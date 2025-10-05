"use client";

import React from "react";
import { EditorHeader } from "./editor-header";

import { useEditorContext } from "../../contexts/editor-context";
import { TimelineControls } from "../timeline/timeline-controls";
import { FPS } from "../../constants";
import Timeline from "../timeline/timeline";
import { VideoPlayer } from "./video-player";
import { TimelineSection } from "./timeline-section";
import { MobileNavBar } from "../shared/mobile-nav-bar";



/**
 * Main Editor Component
 *
 * @component
 * @description
 * The core editor interface that orchestrates the video editing experience.
 * This component manages:
 * - Video playback and controls
 * - Timeline visualization and interaction
 * - Overlay management (selection, modification, deletion)
 * - Responsive behavior for desktop/mobile views
 *
 * The component uses the EditorContext to manage state and actions across
 * its child components. It implements a responsive design that shows a
 * mobile-specific message for smaller screens.
 *
 * Key features:
 * - Video player integration
 * - Timeline controls (play/pause, seeking)
 * - Overlay management (selection, modification)
 * - Frame-based navigation
 * - Mobile detection and fallback UI
 *
 * @example
 * ```tsx
 * <Editor />
 * ```
 */
export const Editor: React.FC = () => {
  /** State to track if the current viewport is mobile-sized */
  const [isMobile, setIsMobile] = React.useState(false);

  /**
   * Effect to handle mobile detection and window resize events
   * Uses 768px as the standard mobile breakpoint
   */
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /**
   * Effect to handle viewport issues on mobile - MODIFIED to not control body scroll
   */
  React.useEffect(() => {
    // Function to handle viewport issues on mobile
    const handleResize = () => {
      // Set CSS custom property for viewport height to use instead of h-screen
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // Initial call
    handleResize();

    // Handle orientation changes and resizes
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      // Don't restore overflow styles
    };
  }, []);

  // State for selected rows
  const [selectedRows, setSelectedRows] = React.useState<Set<number>>(new Set());

  /**
   * Destructure values and functions from the editor context
   * These provide core functionality for the editor's features
   */
  const {
    overlays, // Array of current overlay objects
    selectedOverlayId, // ID of the currently selected overlay
    setSelectedOverlayId, // Function to update selected overlay
    // selectedOverlayIds: contextSelectedOverlayIds, // Multi-selection from context
    // setSelectedOverlayIds: contextSetSelectedOverlayIds, // Function to update multi-selection
    isPlaying, // Current playback state
    currentFrame, // Current frame position
    playerRef, // Reference to video player
    disableMobileLayout, // Configuration for mobile layout
    togglePlayPause, // Function to toggle play/pause
    formatTime, // Function to format time display
    handleOverlayChange, // Function to handle overlay modifications
    handleMuteVideo, // Add this line - Function to mute/unmute video
    handleMuteAudio, // Add this line - Function to mute/unmute audio
    handleTimelineClick, // Function to handle timeline interaction
    deleteOverlay, // Function to remove an overlay
    duplicateOverlay, // Function to clone an overlay
    splitOverlay, // Function to split an overlay at current position
    durationInFrames, // Total duration in frames
    setOverlays, // Function to update overlays
  } = useEditorContext();

    // Multi-selection state for overlays
  const [selectedOverlayIds, setSelectedOverlayIds] = React.useState<number[]>(
    selectedOverlayId !== null ? [selectedOverlayId] : []
  );

  // Sync with single selection when it changes externally (only add, don't clear)
  React.useEffect(() => {
    if (selectedOverlayId !== null && !selectedOverlayIds.includes(selectedOverlayId)) {
      setSelectedOverlayIds([selectedOverlayId]);
    }
    // Removed the else-if that was clearing selection when selectedOverlayId becomes null
  }, [selectedOverlayId, selectedOverlayIds]);

  // Keyboard shortcut handlers
  const handleSelectAll = React.useCallback(() => {
    const allIds = overlays.map(o => o.id);
    setSelectedOverlayIds(allIds);
    // Update primary selection to last item
    if (allIds.length > 0) {
      setSelectedOverlayId(allIds[allIds.length - 1]);
    }
  }, [overlays, setSelectedOverlayId]);

  const handleDeselectAll = React.useCallback(() => {
    setSelectedOverlayIds([]);
    setSelectedOverlayId(null);
  }, [setSelectedOverlayId]);

  const handleDeleteSelected = React.useCallback(() => {
    if (selectedOverlayIds.length === 0) return;
    selectedOverlayIds.forEach(id => deleteOverlay(id));
    setSelectedOverlayIds([]);
    setSelectedOverlayId(null);
  }, [selectedOverlayIds, deleteOverlay, setSelectedOverlayId]);

  // Handler for selection changes from timeline
  const handleSelectionChange = React.useCallback((ids: number[]) => {
    console.log('🔵 handleSelectionChange called with:', ids);
    setSelectedOverlayIds(ids);
    setSelectedOverlayId(ids.length > 0 ? ids[ids.length - 1] : null);
  }, [setSelectedOverlayId]);

  
  // Handle clicks outside to deselect overlays
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if clicking on the Remotion player canvas (the black area with video)
      const isRemotionCanvas = target.closest('[data-remotion-canvas]') || 
                               target.tagName === 'CANVAS' ||
                               target.closest('canvas');
      
      // Don't deselect if clicking on:
      // - Timeline items or controls
      // - Sidebar/panels (AppSidebar component)
      // - Editor canvas overlays (selection outlines)
      // - The actual Remotion canvas (black area with overlays)
      // - Any form controls (buttons, inputs, etc.)
      // - Dropdown menus, dialogs, popovers
      if (
        target.closest('[data-timeline-item]') ||
        target.closest('[data-timeline-marker]') ||
        target.closest('[data-selection-outline]') ||
        target.closest('[data-sidebar]') ||
        target.closest('aside') ||
        isRemotionCanvas ||
        target.closest('[role="dialog"]') ||
        target.closest('[role="menu"]') ||
        target.closest('[role="menuitem"]') ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select') ||
        target.closest('[data-radix-popper-content-wrapper]') ||
        target.closest('[data-radix-dialog-overlay]') ||
        target.closest('.cm-editor') ||
        target.closest('[contenteditable="true"]')
      ) {
        return;
      }
      
      // Deselect all overlays
      handleDeselectAll();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleDeselectAll]);


  /**
   * Main editor layout - MODIFIED to work within container
   * Organized in a column layout with the following sections:
   * 1. Editor header (controls and options)
   * 2. Main content area (video player)
   * 3. Timeline controls
   * 4. Timeline visualization
   */
  return (
    <div
      // className="flex flex-col h-full overflow-hidden"
      className="flex flex-col overflow-hidden"
      style={{
        height: "calc(var(--vh, 1vh) * 100)",
        maxHeight: "-webkit-fill-available" /* Safari fix */,
      }}
    >
      <EditorHeader />
      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        <VideoPlayer playerRef={playerRef} />
      </div>

      <TimelineControls
        isPlaying={isPlaying}
        togglePlayPause={togglePlayPause}
        currentFrame={currentFrame}
        totalDuration={durationInFrames}
        formatTime={formatTime}
        selectedRows={selectedRows}
        onClearSelectedRows={() => setSelectedRows(new Set())}
        overlays={overlays}
        setOverlays={setOverlays}
        selectedOverlayIds={selectedOverlayIds}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onDeleteSelected={handleDeleteSelected}
      />
      {/* <TimelineSection /> */}

      

      {/* 
        Timeline Component
        Note: On mobile devices, this component also renders the MobileNavBar 
        at the bottom with a scrollable interface similar to TimelineControls
        for easy access to content creation tools.
      */}
      <Timeline
        currentFrame={currentFrame}
        overlays={overlays}
        durationInFrames={durationInFrames}
        selectedOverlayId={selectedOverlayId}
        setSelectedOverlayId={setSelectedOverlayId}
        selectedOverlayIds={selectedOverlayIds}
        onSelectedOverlaysChange={handleSelectionChange}
        onOverlayChange={handleOverlayChange}
        onOverlayDelete={deleteOverlay}
        onOverlayDuplicate={duplicateOverlay}
        onSplitOverlay={splitOverlay}
        setCurrentFrame={(frame) => {
          if (playerRef.current) {
            playerRef.current.seekTo(frame / FPS);
          }
        }}
        setOverlays={setOverlays}
        onTimelineClick={handleTimelineClick}
        onDetachAudio={() => {
          if (playerRef.current) {
            playerRef.current.detachAudio();
          }
        }}
        onMuteVideo={handleMuteVideo}
        onMuteAudio={handleMuteAudio}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
      />
      {/* Mobile Navigation Bar
       * Only shows on mobile devices (md:hidden)
       * Improved scrollable design inspired by TimelineControls
       * Horizontal scrolling with fade indicators for better UX
       * Touch-friendly buttons with tooltips for content creation
       * Placed at the bottom of the timeline for easy access
       */}
      <MobileNavBar />
    </div>
  );
};