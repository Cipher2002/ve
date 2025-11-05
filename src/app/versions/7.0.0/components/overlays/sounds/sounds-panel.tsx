import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Search } from "lucide-react";
import { Play, Pause } from "lucide-react";
import { LocalSound, OverlayType, SoundOverlay } from "../../../types";

import { localSounds } from "../../../templates/sound-templates";
import { useTimelinePositioning } from "../../../hooks/use-timeline-positioning";
import { useEditorContext } from "../../../contexts/editor-context";
import { useTimeline } from "../../../contexts/timeline-context";
import { SoundDetails } from "./sound-details";
import { useRenderedAudio } from "../../../hooks/use-rendered-audio";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Radio, Trash2 } from "lucide-react";

/**
 * SoundsPanel Component
 *
 * A panel component that manages sound overlays in the editor. It provides functionality for:
 * - Displaying a list of available sound tracks
 * - Playing/pausing sound previews
 * - Adding sounds to the timeline
 * - Managing selected sound overlays and their properties
 *
 * The component switches between two views:
 * 1. Sound library view: Shows available sounds that can be added
 * 2. Sound details view: Shows controls for the currently selected sound overlay
 *
 * @component
 */
const SoundsPanel: React.FC = () => {
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingTrack, setLoadingTrack] = useState<string | null>(null);
  const [localOverlay, setLocalOverlay] = useState<SoundOverlay | null>(null);
  const [itemsToShow, setItemsToShow] = useState(20);
  const [activeTab, setActiveTab] = useState("system-audio");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Helper function to convert content to filename
  const contentToFilename = (content: string): string => {
    return content.replace(/\s+/g, '_') + '.mp3';
  };


  const filteredSounds = useMemo(() => {
    if (localOverlay || activeTab !== "system-audio") return [];
    
    const filtered = localSounds.filter((sound) =>
      searchQuery === "" ||
      sound.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sound.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return filtered.slice(0, itemsToShow); // Only return visible items
  }, [searchQuery, localOverlay, itemsToShow, activeTab]);

  const hasMoreItems = useMemo(() => {
    if (localOverlay || activeTab !== "system-audio") return false;
    
    const totalFiltered = localSounds.filter((sound) =>
      searchQuery === "" ||
      sound.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sound.artist.toLowerCase().includes(searchQuery.toLowerCase())
    ).length;
    
    return itemsToShow < totalFiltered && totalFiltered > 0;
  }, [searchQuery, localOverlay, itemsToShow, activeTab]);

  
  // Only store currently active audio instances
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  //SETTING THE API BASE URL
  const apiBaseUrl = 'https://zanopy.ai/vedit/api/latest';
  
  const {
    addOverlay,
    overlays,
    durationInFrames,
    selectedOverlayId,
    changeOverlay,
    currentFrame,
    setOverlays,
  } = useEditorContext();
  const { findNextAvailablePosition, addAtPlayhead } = useTimelinePositioning();
  const { visibleRows } = useTimeline();
  const [renderedAudio, setRenderedAudio] = useState<any[]>([]);
  const [renderedLoading, setRenderedLoading] = useState(true);

  // Reset items when tab changes or search changes
  useEffect(() => {
    setItemsToShow(20);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    if (selectedOverlayId === null) {
      setLocalOverlay(null);
      return;
    }

    const selectedOverlay = overlays.find(
      (overlay) => overlay.id === selectedOverlayId
    );

    if (selectedOverlay?.type === OverlayType.SOUND) {
      setLocalOverlay(selectedOverlay);
    }
  }, [selectedOverlayId, overlays]);

  useEffect(() => {
    if (activeTab === 'rendered-audio') {
      fetchRenderedAudio();
    }
  }, [activeTab]);

  // Infinite scroll handler
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || activeTab !== "system-audio") return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // Load more when user scrolls to bottom (with 100px buffer)
      if (scrollTop + clientHeight >= scrollHeight - 100 && hasMoreItems && !localOverlay) {
        setItemsToShow(prev => prev + 20);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMoreItems, activeTab, localOverlay]);

  const handleUpdateOverlay = (updatedOverlay: SoundOverlay) => {
    setLocalOverlay(updatedOverlay);
    changeOverlay(updatedOverlay.id, updatedOverlay);
  };

  // Get UID from URL
  const getUidFromUrl = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('uid') || 'default';
    }
    return 'default';
  };

  const fetchRenderedAudio = async () => {
    setRenderedLoading(true);
    try {
      const uid = getUidFromUrl();
      const response = await fetch(`${apiBaseUrl}/save-to-user/get-renders?uid=${uid}`);
      const data = await response.json();
      
      // Filter and format audio renders
      const audioRenders = (data.renders || [])
        .filter((render: any) => render.mediaType === 'audio')
        .map((render: any) => ({
          id: render.renderId,
          filename: `${render.renderId}.${render.format}`,
          url: render.s3Url,
          size: render.fileSize,
          createdAt: render.timestamp,
          projectId: render.projectId
        }));
      
      setRenderedAudio(audioRenders);
    } catch (error) {
      console.error('Failed to fetch rendered audio:', error);
    } finally {
      setRenderedLoading(false);
    }
  };

  const refetchRendered = () => {
    fetchRenderedAudio();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
        activeAudioRef.current = null;
      }
    };
  }, []);

  /**
   * Optimized play/pause that only loads audio when needed
   */

  const togglePlay = async (soundId: string) => {
    // Check if it's a system sound or rendered audio
    const sound = localSounds.find(s => s.id === soundId);
    const renderedSound = renderedAudio.find(a => a.id === soundId);
    
    if (!sound && !renderedSound) return;

    // If this sound is already playing, pause it
    if (playingTrack === soundId && activeAudioRef.current) {
      activeAudioRef.current.pause();
      setPlayingTrack(null);
      return;
    }

    // Stop any currently playing audio
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
    }

    try {
      setLoadingTrack(soundId);
      
      // Get the audio file URL (either from system sounds or rendered audio)
      let audioUrl;
      if (sound) {
        audioUrl = sound.file;
      } else {
        // Use proxy for rendered audio to avoid CORS
        audioUrl = `${apiBaseUrl}/proxy-audio?url=${encodeURIComponent(renderedSound!.url)}`;
      }
      
      // Create new audio instance only when needed
      const audio = new Audio(audioUrl);
      
      // Set preload to metadata only (much faster)
      audio.preload = 'metadata';
      
      // Handle loading completion
      const handleCanPlay = () => {
        setLoadingTrack(null);
        audio.play().catch((error) => {
          console.error("Error playing audio:", error);
          setPlayingTrack(null);
          setLoadingTrack(null);
        });
      };

      // Handle playback end
      const handleEnded = () => {
        setPlayingTrack(null);
        activeAudioRef.current = null;
      };

      // Handle errors
      const handleError = () => {
        console.error("Error loading audio:", audioUrl);
        setLoadingTrack(null);
        setPlayingTrack(null);
      };

      audio.addEventListener('canplay', handleCanPlay, { once: true });
      audio.addEventListener('ended', handleEnded, { once: true });
      audio.addEventListener('error', handleError, { once: true });

      activeAudioRef.current = audio;
      setPlayingTrack(soundId);

    } catch (error) {
      console.error("Error creating audio:", error);
      setLoadingTrack(null);
      setPlayingTrack(null);
    }
  };


  const handleAddToTimeline = async (sound: LocalSound) => {
  // Stop any playing preview
  if (activeAudioRef.current) {
    activeAudioRef.current.pause();
    setPlayingTrack(null);
  }

  // Set this sound as loading in the UI
  setLoadingTrack(sound.id);

  try {
    // Download the audio file once
    const response = await fetch(sound.file);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    // Create accessible URL for Lambda rendering
    const accessibleUrl = `https://zanopy.ai/vedit/sounds/${contentToFilename(sound.title)}`;

    // Clear loading state
    setLoadingTrack(null);

    const { from, row, updatedOverlays } = addAtPlayhead(
      currentFrame,
      overlays,
      'top'
    );

    const newSoundOverlay: SoundOverlay = {
      id: Date.now(),
      type: OverlayType.SOUND,
      content: sound.title,
      src: blobUrl,
      originalUrl: accessibleUrl,
      from,
      row,
      left: 0,
      top: 0,
      width: 1920,
      height: 100,
      rotation: 0,
      isDragging: false,
      durationInFrames: sound.duration * 30, // 30fps
      styles: {
        opacity: 1,
      },
    };

    // Create final overlays array
    const finalOverlays = [...updatedOverlays, newSoundOverlay];
    setOverlays(finalOverlays);
    
    // Request timeline to adjust rows
    window.dispatchEvent(new CustomEvent('adjustTimelineRows', {
      detail: { requiredRows: Math.max(...finalOverlays.map(o => o.row)) + 1 }
    }));
  } catch (error) {
    console.error('Failed to download audio:', error);
    setLoadingTrack(null);
  }
};

  const renderSoundCard = useCallback((sound: LocalSound) => {
    const isPlaying = playingTrack === sound.id;
    const isLoading = loadingTrack === sound.id;

    return (
      <div
        key={sound.id}
        onClick={() => handleAddToTimeline(sound)}
        className="group flex items-center gap-3 p-2.5 bg-white dark:bg-gray-900 rounded-md 
          border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900
          transition-all duration-150 cursor-pointer"
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (!isLoading) {
              togglePlay(sound.id);
            }
          }}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-full 
            ${isLoading ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-200 dark:bg-gray-800'} 
            hover:bg-gray-200 dark:hover:bg-gray-700 transition-all 
            ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center justify-center h-6 w-6">
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[rgb(41,0,156)] border-t-transparent" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            ) : (
              <Play className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            )}
          </div>
          <span className="text-[10px] mt-1 text-gray-700 dark:text-gray-300 select-none">
            {isLoading ? "Loading..." : isPlaying ? "Pause" : "Play"}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 select-none">
            {sound.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 select-none">
            {sound.artist}
          </p>
        </div>
      </div>
    );
  }, [playingTrack, loadingTrack, handleAddToTimeline, togglePlay]);

return (
    <section className="flex flex-col bg-[rgb(244,242,250)] h-full overflow-hidden">
      {/* Header */}
      {/* <div className="w-full flex flex-col items-center" style={{ gap: '8px', marginTop: '8px' }}>
        <div className="bg-[rgb(65,77,92)] rounded-[1px]" style={{ width: '42px', height: '2px', minHeight: '2px' }} />
        <p className="flex items-center font-bold text-[rgb(47,46,46)]" style={{ fontSize: '14px', lineHeight: '1.14', fontFamily: "'Poppins',Helvetica,Arial,serif" }}>
          Audio
        </p>
      </div> */}

      {/* Title with decorative line */}
      <div className="w-full flex flex-col items-center gap-y-2 flex-shrink-0" style={{ gap: '8px', marginTop: '8px' }}>
        <div className="flex flex-col gap-y-2 items-center">
          <hr className="bg-[rgb(65,77,92)] rounded w-[2.625rem] h-[2px] border-0" />
          <h1 className="flex items-center font-bold text-3.5 leading-1.14 font-['Poppins',Helvetica,Arial,serif] text-[rgb(47,46,46)] w-full">
            Audio
          </h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center" style={{ gap: '8px', marginTop: '8px', marginRight: '10px', marginBottom: '8px', marginLeft: '12px' }}>
        <button
          onClick={() => setActiveTab('system-audio')}
          className="flex justify-center items-center font-bold text-center transition-colors"
          style={{ 
            fontSize: '12px', 
            lineHeight: '1', 
            fontFamily: "'Poppins',Helvetica,Arial,serif",
            letterSpacing: '-0.06px',
            paddingTop: '8px',
            paddingBottom: '8px',
            flex: '1',
            borderBottom: activeTab === 'system-audio' ? '1px solid rgb(73,9,114)' : '1px solid transparent',
            color: activeTab === 'system-audio' ? 'rgb(73,9,114)' : 'rgb(135,133,133)',
            boxShadow: activeTab === 'system-audio' ? 'inset 10px 10px 50px 0px rgba(57, 25, 148, 0.15)' : 'none'
          }}
        >
          System Audio
        </button>
        <button
          onClick={() => setActiveTab('rendered-audio')}
          className="flex justify-center items-center font-bold text-center transition-colors"
          style={{ 
            fontSize: '12px', 
            lineHeight: '1', 
            fontFamily: "'Poppins',Helvetica,Arial,serif",
            letterSpacing: '-0.06px',
            paddingTop: '8px',
            paddingBottom: '8px',
            flex: '1',
            borderBottom: activeTab === 'rendered-audio' ? '1px solid rgb(73,9,114)' : '1px solid transparent',
            color: activeTab === 'rendered-audio' ? 'rgb(73,9,114)' : 'rgb(135,133,133)',
            boxShadow: activeTab === 'rendered-audio' ? 'inset 10px 10px 50px 0px rgba(57, 25, 148, 0.15)' : 'none'
          }}
        >
          Rendered Audio
        </button>
      </div>

      {/* Search Input */}
      {!localOverlay && (
        <form onSubmit={(e) => e.preventDefault()} className="flex" style={{ gap: '8px', marginTop: '8px', marginRight: '10px', marginBottom: '8px', marginLeft: '12px' }}>
          <input
            placeholder="Search Sounds.."
            value={searchQuery}
            className="flex items-center bg-white rounded border border-[rgb(135,133,133)] focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[rgb(135,133,133)] focus:outline-none"
            style={{ 
              fontSize: '12px',
              lineHeight: '1',
              fontFamily: "'Poppins',Helvetica,Arial,serif",
              color: 'rgb(135,133,133)',
              paddingLeft: '10px',
              paddingTop: '6px',
              paddingBottom: '6px',
              marginRight: '2px',
              width: '100%'
            }}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      )}

      {/* Content with Independent Scroll */}
      <div className="flex gap-x-px" style={{ flex: '1', minHeight: '0', marginTop: '8px', marginRight: '10px', marginBottom: '8px', marginLeft: '12px' }}>
        <div className="flex-1 overflow-y-auto" style={{ paddingRight: '4px' }}>
          {activeTab === 'system-audio' ? (
            // System Audio Tab
            !localOverlay ? (
              <div 
                ref={scrollContainerRef}
                className="flex flex-col" 
                style={{ gap: '8px' }}
              >
                {filteredSounds.map((sound) => (
                  <div
                    key={sound.id}
                    className="bg-white rounded cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{ padding: '8px', display: 'flex', gap: '6px' }}
                    onClick={() => handleAddToTimeline(sound)}
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlay(sound.id);
                      }}
                      className="bg-[rgb(227,222,253)] rounded flex flex-col items-center justify-center cursor-pointer"
                      style={{ width: '40px', minWidth: '40px', padding: '8px 3px 6px 2px', gap: '2px' }}
                    >
                      <div className="flex items-center justify-center" style={{ width: '11px', height: '11px' }}>
                        {loadingTrack === sound.id ? (
                          <div className="animate-spin rounded-full border-2 border-[rgb(73,9,114)] border-t-transparent" style={{ height: '11px', width: '11px' }} />
                        ) : playingTrack === sound.id ? (
                          <Pause style={{ width: '11px', height: '11px' }} className="text-[rgb(65,77,92)]" />
                        ) : (
                          <Play style={{ width: '11px', height: '11px' }} className="text-[rgb(65,77,92)]" />
                        )}
                      </div>
                      <span className="text-center text-[rgb(65,77,92)]" style={{ fontSize: '10px', lineHeight: '1.2', fontFamily: "'Poppins',Helvetica,Arial,serif", letterSpacing: '-0.08px', width: '100%' }}>
                        {loadingTrack === sound.id ? "Loading" : playingTrack === sound.id ? "Pause" : "Play"}
                      </span>
                    </div>

                    <div className="flex flex-col" style={{ gap: '4px', flex: '1', marginTop: '3px', marginBottom: '3px' }}>
                      <p className="font-semibold text-[rgb(47,46,46)]" style={{ fontSize: '12px', lineHeight: '1.25', fontFamily: "'Poppins',Helvetica,Arial,serif", letterSpacing: '-0.08px' }}>
                        {sound.title}
                      </p>
                      <p className="text-[rgb(65,77,92)]" style={{ fontSize: '12px', lineHeight: '1.25', fontFamily: "'Poppins',Helvetica,Arial,serif", letterSpacing: '-0.08px' }}>
                        {sound.artist}
                      </p>
                    </div>
                  </div>
                ))}
                {hasMoreItems && (
                  <div className="flex justify-center" style={{ padding: '16px' }}>
                    <div className="animate-spin rounded-full border-2 border-[rgb(73,9,114)] border-t-transparent" style={{ height: '24px', width: '24px' }} />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '16px' }}>
                <SoundDetails
                  localOverlay={localOverlay}
                  setLocalOverlay={handleUpdateOverlay}
                />
              </div>
            )
          ) : (
            // Rendered Audio Tab
            <div className="flex flex-col" style={{ gap: '8px' }}>
              {renderedLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="bg-white rounded animate-pulse"
                    style={{ padding: '8px', display: 'flex', gap: '6px', height: '56px' }}
                  >
                    <div className="rounded bg-gray-200" style={{ width: '40px', height: '40px' }} />
                    <div className="flex flex-col flex-1" style={{ gap: '4px' }}>
                      <div className="h-3 bg-gray-200 rounded" style={{ width: '70%' }} />
                      <div className="h-3 bg-gray-200 rounded" style={{ width: '40%' }} />
                    </div>
                  </div>
                ))
              ) : renderedAudio.length > 0 ? (
                renderedAudio
                  .filter(audio => 
                    searchQuery === "" ||
                    audio.filename.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((audio) => (
                    <div
                      key={audio.id}
                      onClick={async () => {
                        setLoadingTrack(audio.id);
                        try {
                          const proxyUrl = `${apiBaseUrl}/proxy-audio?url=${encodeURIComponent(audio.url)}`;
                          const response = await fetch(proxyUrl);
                          const blob = await response.blob();
                          const blobUrl = URL.createObjectURL(blob);

                          const audioDuration = await new Promise<number>((resolve) => {
                            const audioElement = new Audio(blobUrl);
                            audioElement.addEventListener('loadedmetadata', () => {
                              resolve(audioElement.duration);
                            });
                            audioElement.addEventListener('error', () => {
                              resolve(30);
                            });
                          });

                          setLoadingTrack(null);

                          const { from, row, updatedOverlays } = addAtPlayhead(
                            currentFrame,
                            overlays,
                            'top'
                          );

                          const newSoundOverlay: SoundOverlay = {
                            id: Date.now(),
                            type: OverlayType.SOUND,
                            content: audio.filename,
                            src: blobUrl,
                            originalUrl: audio.url,
                            from,
                            row,
                            left: 0,
                            top: 0,
                            width: 1920,
                            height: 100,
                            rotation: 0,
                            isDragging: false,
                            durationInFrames: Math.round(audioDuration * 30),
                            styles: {
                              opacity: 1,
                            },
                          };

                          const finalOverlays = [...updatedOverlays, newSoundOverlay];
                          setOverlays(finalOverlays);
                          
                          window.dispatchEvent(new CustomEvent('adjustTimelineRows', {
                            detail: { requiredRows: Math.max(...finalOverlays.map(o => o.row)) + 1 }
                          }));
                        } catch (error) {
                          console.error('Failed to download rendered audio:', error);
                          setLoadingTrack(null);
                        }
                      }}
                      className="bg-white rounded cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ padding: '8px', display: 'flex', gap: '6px' }}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          const isLoading = loadingTrack === audio.id;
                          if (!isLoading) {
                            togglePlay(audio.id);
                          }
                        }}
                        className="bg-[rgb(227,222,253)] rounded flex flex-col items-center justify-center"
                        style={{ width: '40px', minWidth: '40px', padding: '8px 3px 6px 2px', gap: '2px', cursor: loadingTrack === audio.id ? 'not-allowed' : 'pointer' }}
                      >
                        <div className="flex items-center justify-center" style={{ width: '11px', height: '11px' }}>
                          {loadingTrack === audio.id ? (
                            <div className="animate-spin rounded-full border-2 border-[rgb(73,9,114)] border-t-transparent" style={{ height: '11px', width: '11px' }} />
                          ) : playingTrack === audio.id ? (
                            <Pause style={{ width: '11px', height: '11px' }} className="text-[rgb(65,77,92)]" />
                          ) : (
                            <Play style={{ width: '11px', height: '11px' }} className="text-[rgb(65,77,92)]" />
                          )}
                        </div>
                        <span className="text-center text-[rgb(65,77,92)]" style={{ fontSize: '10px', lineHeight: '1.2', fontFamily: "'Poppins',Helvetica,Arial,serif", letterSpacing: '-0.08px', width: '100%' }}>
                          {loadingTrack === audio.id ? "Loading" : "Play"}
                        </span>
                      </div>

                      <div className="flex flex-col flex-1" style={{ gap: '4px', marginTop: '3px', marginBottom: '3px' }}>
                        <p className="font-semibold text-[rgb(47,46,46)]" style={{ fontSize: '12px', lineHeight: '1.25', fontFamily: "'Poppins',Helvetica,Arial,serif", letterSpacing: '-0.08px' }}>
                          {audio.filename}
                        </p>
                        <p className="text-[rgb(65,77,92)]" style={{ fontSize: '12px', lineHeight: '1.25', fontFamily: "'Poppins',Helvetica,Arial,serif", letterSpacing: '-0.08px' }}>
                          {(audio.size / (1024 * 1024)).toFixed(1)} MB • {new Date(audio.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-500" style={{ padding: '32px 0', fontSize: '14px', textAlign: 'center', gap: '12px' }}>
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                    <Radio className="w-4 h-4 text-[rgb(135,133,133)]" />
                  </div>
                  <div style={{ gap: '4px' }}>
                    <p className="font-medium" style={{ fontSize: '14px' }}>No rendered audio</p>
                    <p className="text-[rgb(135,133,133)]" style={{ fontSize: '12px' }}>
                      Rendered audio will appear here after you render audio
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SoundsPanel;
