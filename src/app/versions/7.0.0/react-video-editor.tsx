"use client";

// UI Components
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/sidebar/app-sidebar";
import { Editor } from "./components/core/editor";
import { SidebarProvider as UISidebarProvider } from "@/components/ui/sidebar";
import { SidebarProvider as EditorSidebarProvider } from "./contexts/sidebar-context";

// Context Providers
import { EditorProvider } from "./contexts/editor-context";

// Custom Hooks
import { useOverlays } from "./hooks/use-overlays";
import { useVideoPlayer } from "./hooks/use-video-player";
import { useTimelineClick } from "./hooks/use-timeline-click";
import { useAspectRatio } from "./hooks/use-aspect-ratio";
import { useCompositionDuration } from "./hooks/use-composition-duration";
import { useHistory } from "./hooks/use-history";

// Types
import { Overlay, TemplateOverlay } from "./types";
import { useRendering } from "./hooks/use-rendering";
import {
  AUTO_SAVE_INTERVAL,
  DEFAULT_OVERLAYS,
  FPS,
  RENDER_TYPE,
} from "./constants";
import { TimelineProvider } from "./contexts/timeline-context";

// Autosave Components
import { AutosaveRecoveryDialog } from "./components/autosave/autosave-recovery-dialog";
import { AutosaveStatus } from "./components/autosave/autosave-status";
import { useState, useEffect } from "react";
import { useAutosave } from "./hooks/use-autosave";
import { LocalMediaProvider } from "./contexts/local-media-context";
import { KeyframeProvider } from "./contexts/keyframe-context";
import { AssetLoadingProvider } from "./contexts/asset-loading-context";

export default function ReactVideoEditor({ projectId, isAdminMode = false }: { projectId: string; isAdminMode?: boolean }) {
  // Autosave state
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [autosaveTimestamp, setAutosaveTimestamp] = useState<number | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [dynamicDuration, setDynamicDuration] = useState(30 * FPS);
  // const [projectName, setProjectName] = useState("Default Project");
  const [projectName, setProjectName] = useState(() => {
  const now = new Date();
  const date = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).replace(/\//g, '-');
    const time = now.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/:/g, '-');
    return `Default_${date}_${time}`;
  });


  // Overlay management hooks
  const {
    overlays,
    setOverlays,
    selectedOverlayId,
    setSelectedOverlayId,
    changeOverlay,
    addOverlay,
    deleteOverlay,
    duplicateOverlay,
    splitOverlay,
    deleteOverlaysByRow,
    updateOverlayStyles,
    resetOverlays,
  } = useOverlays(DEFAULT_OVERLAYS);

  // Video player controls and state
  const { isPlaying, currentFrame, playerRef, togglePlayPause, formatTime } =
    useVideoPlayer();

  // Composition duration calculations
  const { durationInFrames, durationInSeconds } = useCompositionDuration(overlays);

  // Aspect ratio and player dimension management
  const {
    aspectRatio,
    setAspectRatio,
    playerDimensions,
    updatePlayerDimensions,
    getAspectRatioDimensions,
  } = useAspectRatio();

  // Event handlers
  const handleOverlayChange = (updatedOverlay: Overlay) => {
    changeOverlay(updatedOverlay.id, () => updatedOverlay);
  };

  const { width: compositionWidth, height: compositionHeight } =
    getAspectRatioDimensions();

  const handleTimelineClick = useTimelineClick(playerRef, durationInFrames);

  const inputProps = {
    overlays,
    durationInFrames,
    fps: FPS,
    width: compositionWidth,
    height: compositionHeight,
    src: "",
  };

  const { renderMedia, state } = useRendering(
    "TestComponent",
    inputProps,
    RENDER_TYPE
  );

  // Replace history management code with hook
  const { undo, redo, canUndo, canRedo } = useHistory(overlays, setOverlays);

  // Create the editor state object to be saved
  const editorState = {
    overlays,
    aspectRatio,
    playerDimensions,
  };

  // Implment load state
  const { saveState, loadState } = useAutosave(projectId, editorState, {
    interval: AUTO_SAVE_INTERVAL,
    onSave: () => {
      setIsSaving(false);
      setLastSaveTime(Date.now());
    },
    onLoad: (loadedState) => {
      if (loadedState) {
        // Apply loaded state to editor
        setOverlays(loadedState.overlays || []);
        if (loadedState.aspectRatio) setAspectRatio(loadedState.aspectRatio);
        if (loadedState.playerDimensions)
          updatePlayerDimensions(
            loadedState.playerDimensions.width,
            loadedState.playerDimensions.height
          );
      }
    },
    onAutosaveDetected: (timestamp) => {
      // Only show recovery dialog on initial load, not during an active session
      if (!initialLoadComplete) {
        setAutosaveTimestamp(timestamp);
        setShowRecoveryDialog(true);
      }
    },
  });

  // Mark initial load as complete after component mounts
  useEffect(() => {
    setInitialLoadComplete(true);
  }, []);

  // Handle recovery dialog actions
  const handleRecoverAutosave = async () => {
    const loadedState = await loadState();
    setShowRecoveryDialog(false);
  };

  const handleDiscardAutosave = () => {
    setShowRecoveryDialog(false);
  };

  // Manual save function for use in keyboard shortcuts or save button
  const handleManualSave = async () => {
    setIsSaving(true);
    await saveState();
  };


  // Download template function
  const downloadTemplate = async () => {
    const template = {
      id: `template-${Date.now()}`,
      name: projectName,
      description: "Template created from editor",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: { id: "user-1", name: "User" },
      category: "Custom",
      tags: ["custom", "user-created"],
      duration: durationInFrames,
      aspectRatio: aspectRatio,
      overlays: overlays
    };

    if (isAdminMode) {
      // Admin mode: Download locally as before
      const jsonString = JSON.stringify(template, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Client mode: Save to server
      try {
        const response = await fetch('/api/latest/templates/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(template)
        });

        const result = await response.json();
        
        if (result.success) {
          // Trigger a custom event to notify template panel to refresh
          window.dispatchEvent(new CustomEvent('templateUpdated', { 
            detail: { isUpdate: result.isUpdate, templateName: projectName }
          }));
        } else {
          console.error('Failed to save template:', result.message);
          // You could show an error toast here
        }
      } catch (error) {
        console.error('Error saving template:', error);
        // You could show an error toast here
      }
    }
  };

  // New project function
  const newProject = () => {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).replace(/\//g, '-');
    const time = now.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/:/g, '-');
    setOverlays(DEFAULT_OVERLAYS);
    setProjectName(`Default_${date}_${time}`);
    setSelectedOverlayId(null);
    // Reset other states as needed
    setAspectRatio("16:9");
  };

  // Load template into editor function
  const loadTemplateIntoEditor = (template: TemplateOverlay) => {
    // Update project name
    setProjectName(template.name);
    
    // Apply template data
    const newOverlays = template.overlays.map((overlayTemplate, index) => ({
      ...overlayTemplate,
      id: Math.floor(Math.random() * 1000000) + index,
    }));
    
    setOverlays(newOverlays);
    setSelectedOverlayId(null);
    
    if (template.aspectRatio) {
      setAspectRatio(template.aspectRatio);
    }
  };

  // Set up keyboard shortcut for manual save (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleManualSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editorState]);

  // Combine all editor context values
  const editorContextValue = {
    // Overlay management
    overlays,
    setOverlays,
    selectedOverlayId,
    setSelectedOverlayId,
    dynamicDuration,
    setDynamicDuration,
    changeOverlay,
    handleOverlayChange,
    addOverlay,
    deleteOverlay,
    duplicateOverlay,
    splitOverlay,
    resetOverlays,

    // Player controls
    isPlaying,
    currentFrame,
    playerRef,
    togglePlayPause,
    formatTime,
    handleTimelineClick,
    playbackRate,
    setPlaybackRate,

    // Dimensions and duration
    aspectRatio,
    setAspectRatio,
    playerDimensions,
    updatePlayerDimensions,
    getAspectRatioDimensions,
    durationInFrames,
    durationInSeconds,

    // Add renderType to the context
    renderType: RENDER_TYPE,
    renderMedia,
    state,

    deleteOverlaysByRow,

    // History management
    undo,
    redo,
    canUndo,
    canRedo,

    // New style management
    updateOverlayStyles,

    // Autosave
    saveProject: handleManualSave,
    downloadTemplate,

    // Admin mode
    isAdminMode,

    // Project name management
    projectName,
    setProjectName,
    newProject,
    loadTemplateIntoEditor,
  };

  return (
      <div 
        className="flex flex-col overflow-hidden h-full"
        style={{
          backgroundColor: 'rgb(244, 242, 250)',
          outlineOffset: '-1px',
          borderRadius: '16px',
          boxShadow: '4px 4px 40px 0 rgb(0, 0, 0, 0.25)',
          outline: 'rgb(73, 9, 114) solid 1px'
        }}
      >
      <UISidebarProvider>
        <EditorSidebarProvider>
          <KeyframeProvider>
            <TimelineProvider>
              <EditorProvider value={editorContextValue}>
                <LocalMediaProvider>
                  <AssetLoadingProvider>
                    <AppSidebar />
                    <SidebarInset>
                      <Editor />
                    </SidebarInset>
  
                    {/* Autosave Status Indicator */}
                    <AutosaveStatus
                      isSaving={isSaving}
                      lastSaveTime={lastSaveTime}
                    />
  
                    {/* Autosave Recovery Dialog */}
                    {showRecoveryDialog && autosaveTimestamp && (
                      <AutosaveRecoveryDialog
                        projectId={projectId}
                        timestamp={autosaveTimestamp}
                        onRecover={handleRecoverAutosave}
                        onDiscard={handleDiscardAutosave}
                        onClose={() => setShowRecoveryDialog(false)}
                      />
                    )}
                  </AssetLoadingProvider>
                </LocalMediaProvider>
              </EditorProvider>
            </TimelineProvider>
          </KeyframeProvider>
        </EditorSidebarProvider>
      </UISidebarProvider>
    </div>
  );
}
