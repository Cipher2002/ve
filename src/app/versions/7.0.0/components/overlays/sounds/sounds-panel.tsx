import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Search } from "lucide-react";
import { Play, Pause } from "lucide-react";
import { LocalSound, OverlayType, SoundOverlay } from "../../../types";

import { localSounds } from "../../../templates/sound-templates";
import { useTimelinePositioning } from "../../../hooks/use-timeline-positioning";
import { useEditorContext } from "../../../contexts/editor-context";
import { useTimeline } from "../../../contexts/timeline-context";
import { SoundDetails } from "./sound-details";

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);


  const filteredSounds = useMemo(() => {
    if (localOverlay) return [];
    
    const filtered = localSounds.filter((sound) =>
      searchQuery === "" ||
      sound.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sound.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return filtered.slice(0, itemsToShow); // Only return visible items
  }, [searchQuery, localOverlay, itemsToShow]);

  const hasMoreItems = useMemo(() => {
    if (localOverlay) return false;
    const totalFiltered = localSounds.filter((sound) =>
      searchQuery === "" ||
      sound.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sound.artist.toLowerCase().includes(searchQuery.toLowerCase())
    ).length;
    return itemsToShow < totalFiltered;
  }, [searchQuery, localOverlay, itemsToShow]);

  
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
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // Load more when user scrolls to bottom (with 100px buffer)
      if (scrollTop + clientHeight >= scrollHeight - 100 && hasMoreItems) {
        setItemsToShow(prev => prev + 20);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMoreItems]);

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
    const sound = localSounds.find(s => s.id === soundId);
    if (!sound) return;

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
      
      // Create new audio instance only when needed
      const audio = new Audio(sound.file);
      
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
        console.error("Error loading audio:", sound.file);
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
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/40 h-full">
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
      {/* {!localOverlay ? (
        localSounds
          .filter((sound) =>
            searchQuery === "" ||
            sound.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sound.artist.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(renderSoundCard)
      ) : (
        <SoundDetails
          localOverlay={localOverlay}
          setLocalOverlay={handleUpdateOverlay}
        />
      )} */}
      {!localOverlay ? (
        <div 
          ref={scrollContainerRef}
          className="overflow-y-auto h-full space-y-2"
          style={{ maxHeight: 'calc(100vh - 200px)' }} // Adjust based on your layout
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
    </div>
  );
};

export default SoundsPanel;