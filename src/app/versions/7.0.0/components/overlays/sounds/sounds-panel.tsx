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
  
  const {
    addOverlay,
    overlays,
    durationInFrames,
    selectedOverlayId,
    changeOverlay,
  } = useEditorContext();
  const { findNextAvailablePosition } = useTimelinePositioning();
  const { visibleRows } = useTimeline();
  const { audio: renderedAudio, isLoading: renderedLoading, refetch: refetchRendered, deleteAudio } = useRenderedAudio();

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
      const audioUrl = sound ? sound.file : renderedSound!.url;
      
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


  const handleAddToTimeline = (sound: LocalSound) => {
    // Stop any playing preview
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      setPlayingTrack(null);
    }

    const { from, row } = findNextAvailablePosition(
      overlays,
      visibleRows,
      durationInFrames
    );

    const newSoundOverlay: SoundOverlay = {
      id: Date.now(),
      type: OverlayType.SOUND,
      content: sound.title,
      src: sound.file,
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

    addOverlay(newSoundOverlay);
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
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            ) : (
              <Play className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            )}
          </div>
          <span className="text-[10px] mt-1 text-gray-700 dark:text-gray-300 select-none">
            {isLoading ? "Loading" : isPlaying ? "Pause" : "Play"}
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
    <div className="flex flex-col gap-2 p-2 sm:gap-4 sm:p-4 bg-gray-100/40 dark:bg-gray-900/40 h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full grid grid-cols-2 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-sm border border-gray-200 dark:border-gray-700 gap-1 mb-2 flex-shrink-0">
          <TabsTrigger
            value="system-audio"
            className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white 
            rounded-sm transition-all duration-200 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
          >
            <span className="flex items-center gap-2 text-xs">System Audio</span>
          </TabsTrigger>
          <TabsTrigger
            value="rendered-audio"
            className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white 
            rounded-sm transition-all duration-200 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
          >
            <span className="flex items-center gap-2 text-xs">Rendered Audio</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system-audio" className="flex-1 min-h-0 flex flex-col space-y-4">
          {!localOverlay && (
            <div className="flex gap-2 flex-shrink-0">
              <form onSubmit={(e) => e.preventDefault()} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    placeholder="Search sounds..."
                    value={searchQuery}
                    className="w-full h-10 pl-10 pr-3 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/5 rounded-md text-gray-900 dark:text-zinc-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ fontSize: "16px" }}
                  />
                </div>
              </form>
            </div>
          )}
          {!localOverlay ? (
            <div 
              ref={scrollContainerRef}
              className="overflow-y-auto flex-1 space-y-2"
            >
              {filteredSounds.map(renderSoundCard)}
              {hasMoreItems && (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
                </div>
              )}
            </div>
          ) : (
            <SoundDetails
              localOverlay={localOverlay}
              setLocalOverlay={handleUpdateOverlay}
            />
          )}
        </TabsContent>

        {/* <TabsContent value="rendered-audio" className="flex-1 min-h-0">
          {!localOverlay && (
            <div className="flex gap-2 flex-shrink-0">
              <form onSubmit={(e) => e.preventDefault()} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    placeholder="Search sounds..."
                    value={searchQuery}
                    className="w-full h-10 pl-10 pr-3 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/5 rounded-md text-gray-900 dark:text-zinc-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ fontSize: "16px" }}
                  />
                </div>
              </form>
            </div>
          )}
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Radio className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">No rendered audio</p>
              <p className="text-xs text-gray-500">
                Rendered audio will appear here after you render audio
              </p>
            </div>
          </div>
        </TabsContent> */}

        <TabsContent value="rendered-audio" className="flex-1 min-h-0 flex flex-col">
          {!localOverlay && (
            <div className="flex gap-2 flex-shrink-0">
              <form onSubmit={(e) => e.preventDefault()} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    placeholder="Search sounds..."
                    value={searchQuery}
                    className="w-full h-10 pl-10 pr-3 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/5 rounded-md text-gray-900 dark:text-zinc-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ fontSize: "16px" }}
                  />
                </div>
              </form>
            </div>
          )}
          
          <div className="overflow-y-auto flex-1 space-y-2">
            {renderedLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="h-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-md"
                  />
                ))}
              </div>
            ) : renderedAudio.length > 0 ? (
              renderedAudio
                .filter(audio => 
                  searchQuery === "" ||
                  audio.filename.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((audio) => (
                  <div
                    key={audio.id}
                    onClick={() => {
                      const { from, row } = findNextAvailablePosition(
                        overlays,
                        visibleRows,
                        durationInFrames
                      );

                      const newSoundOverlay: SoundOverlay = {
                        id: Date.now(),
                        type: OverlayType.SOUND,
                        content: audio.filename,
                        src: audio.url,
                        from,
                        row,
                        left: 0,
                        top: 0,
                        width: 1920,
                        height: 100,
                        rotation: 0,
                        isDragging: false,
                        durationInFrames: 300, // Default duration
                        styles: {
                          opacity: 1,
                        },
                      };

                      addOverlay(newSoundOverlay);
                    }}
                    className="group flex items-center gap-3 p-2.5 bg-white dark:bg-gray-900 rounded-md 
                      border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900
                      transition-all duration-150 cursor-pointer relative"
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        const isLoading = loadingTrack === audio.id;
                        if (!isLoading) {
                          togglePlay(audio.id);
                        }
                      }}
                      className={`flex flex-col items-center justify-center w-14 h-14 rounded-full 
                        ${loadingTrack === audio.id ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-200 dark:bg-gray-800'} 
                        hover:bg-gray-200 dark:hover:bg-gray-700 transition-all 
                        ${loadingTrack === audio.id ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-center h-6 w-6">
                        {loadingTrack === audio.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                        ) : playingTrack === audio.id ? (
                          <Pause className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                        ) : (
                          <Play className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                        )}
                      </div>
                      <span className="text-[10px] mt-1 text-gray-700 dark:text-gray-300 select-none">
                        {loadingTrack === audio.id ? "Loading" : playingTrack === audio.id ? "Pause" : "Play"}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 select-none">
                        {audio.filename}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 select-none">
                        {(audio.size / (1024 * 1024)).toFixed(1)} MB • {new Date(audio.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 
                        text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 
                        shadow-sm hover:shadow-md transform hover:scale-105"
                      onClick={async (e) => {
                        e.stopPropagation();
                        deleteAudio(audio.id);
                      }}
                      title="Delete audio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Radio className="w-4 h-4 text-gray-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">No rendered audio</p>
                  <p className="text-xs text-gray-500">
                    Rendered audio will appear here after you render audio
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SoundsPanel;
