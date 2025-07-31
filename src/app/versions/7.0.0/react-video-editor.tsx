"use client";

//#490972

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
import { clearAutosave } from "./utils/indexdb-helper";

//Loading templates with downloaded videos
import { useTemplateLoader } from "./hooks/use-template-loader";


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
  const [hasAutosave, setHasAutosave] = useState(false);
  const [preservedAutosaveData, setPreservedAutosaveData] = useState<{
    overlays: Overlay[];
    aspectRatio: any;
    playerDimensions: { width: number; height: number };
    projectName?: string; // Add this line
  } | null>(null);
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
  const { loadTemplateWithVideos } = useTemplateLoader();
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [templateLoadingProgress, setTemplateLoadingProgress] = useState({ current: 0, total: 0 });


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

  // Get UID from URL (client-side only)
  const getUidFromUrl = () => {
    if (typeof window === 'undefined') return 'default';
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('uid') || 'default';
  };

  const inputProps = {
    overlays,
    durationInFrames,
    fps: FPS,
    width: compositionWidth,
    height: compositionHeight,
    src: "",
    uid: getUidFromUrl(),
    projectName: projectName,
  };

  const { renderMedia, renderAudio, state } = useRendering(
    "TestComponent",
    inputProps,
    RENDER_TYPE
  );

  // Enhanced render functions that auto-save before rendering
  const enhancedRenderMedia = async (format?: string, codec?: string) => {
    // Auto-save project before rendering
    await handleManualSave();
    
    // Then proceed with rendering
    return renderMedia(format, codec);
  };

  const enhancedRenderAudio = async (format?: string, codec?: string) => {
    // Auto-save project before rendering
    await handleManualSave();
    
    // Then proceed with rendering
    return renderAudio(format, codec);
  };

  // Replace history management code with hook
  const { undo, redo, canUndo, canRedo } = useHistory(overlays, setOverlays);

  // Create the editor state object to be saved
  const editorState = {
    overlays,
    aspectRatio,
    playerDimensions,
    projectName, // Include project name in autosave data
  };

  // Implment load state
  const { saveState, loadState } = useAutosave(projectId, editorState, {
    interval: AUTO_SAVE_INTERVAL,
    onSave: () => {
      setIsSaving(false);
      setLastSaveTime(Date.now());
    },
    onLoad: (loadedState) => {
      // DON'T automatically apply loaded state - let user decide
      // This prevents auto-loading and maintains current editor state
      return;
    },
    onAutosaveDetected: (timestamp) => {
      // Only show recovery dialog on initial load, not during an active session
      if (!initialLoadComplete) {
        // Load and preserve the autosave data but DON'T apply it automatically
        loadState().then((loadedState) => {
          if (loadedState) {
            setPreservedAutosaveData(loadedState);
            setAutosaveTimestamp(timestamp);
            setHasAutosave(true);
            // Don't apply the state here - let user choose
          }
        });
      }
    },
  });

  // Mark initial load as complete after component mounts
  useEffect(() => {
    setInitialLoadComplete(true);
  }, []);

  const handleRecoverAutosave = async () => {
    // Use the preserved autosave data instead of loading current state
    if (preservedAutosaveData) {
      // Apply the preserved state to editor
      setOverlays(preservedAutosaveData.overlays || []);
      if (preservedAutosaveData.aspectRatio) setAspectRatio(preservedAutosaveData.aspectRatio);
      if (preservedAutosaveData.playerDimensions)
        updatePlayerDimensions(
          preservedAutosaveData.playerDimensions.width,
          preservedAutosaveData.playerDimensions.height
        );
      
      // IMPORTANT: Also recover the project name if it was saved in autosave
      if ('projectName' in preservedAutosaveData && preservedAutosaveData.projectName) {
        setProjectName(preservedAutosaveData.projectName);
      }
    }
    
    // Clean up
    setHasAutosave(false);
    setAutosaveTimestamp(null);
    setPreservedAutosaveData(null);
    setShowRecoveryDialog(false);
  };

  const handleDiscardAutosave = async () => {
    // Clear the autosave data from storage so it won't appear again
    try {
      await clearAutosave(projectId);
    } catch (error) {
      console.error('Failed to clear autosave:', error);
    }
    
    setHasAutosave(false);
    setAutosaveTimestamp(null);
    setPreservedAutosaveData(null);
    setShowRecoveryDialog(false);
  };

  // Manual save function for use in keyboard shortcuts or save button
  const handleManualSave = async () => {
    setIsSaving(true);
    
    try {
      // Save to the new user-based system
      const uid = getUidFromUrl();
      const saveData = {
        overlays,
        aspectRatio,
        playerDimensions,
        durationInFrames,
        fps: FPS,
        width: getAspectRatioDimensions().width,
        height: getAspectRatioDimensions().height,
      };

      const response = await fetch('/api/latest/save-to-user/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid,
          projectName,
          type: 'project',
          data: saveData,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        // Also save to autosave system for recovery
        await saveState();
        
        // Trigger a refresh of the saved projects
        window.dispatchEvent(new CustomEvent('projectSaved', { 
          detail: { projectName: projectName } 
        }));
        
        setLastSaveTime(Date.now());
      } else {
        console.error('Failed to save project to user folder');
        // Fallback to autosave only
        await saveState();
      }
    } catch (error) {
      console.error('Error saving project:', error);
      // Fallback to autosave only
      await saveState();
    } finally {
      setIsSaving(false);
    }
  };


  // Download template function
  const downloadTemplate = async () => {
    setIsSaving(true);
    
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
      template['tags'] = ['preset', 'system-created'];
      
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
        const uid = typeof window !== 'undefined' 
          ? new URLSearchParams(window.location.search).get('uid') || 'default'
          : 'default';
        const response = await fetch(`/api/latest/templates/save?uid=${uid}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(template)
        });

        const result = await response.json();
        
        if (result.success) {
          // Also save the current project state to user folder
          await handleManualSave();
          
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
      } finally {
        setIsSaving(false);
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
  // const loadTemplateIntoEditor = (template: TemplateOverlay) => {
  //   // Update project name
  //   setProjectName(template.name);
    
  //   // Apply template data
  //   const newOverlays = template.overlays.map((overlayTemplate, index) => ({
  //     ...overlayTemplate,
  //     id: Math.floor(Math.random() * 1000000) + index,
  //   }));
    
  //   setOverlays(newOverlays);
  //   setSelectedOverlayId(null);
    
  //   if (template.aspectRatio) {
  //     setAspectRatio(template.aspectRatio);
  //   }

  //   // Trigger project saved event to refresh saved projects with new name
  //   setTimeout(() => {
  //     window.dispatchEvent(new CustomEvent('projectSaved', { 
  //       detail: { projectName: template.name } 
  //     }));
  //   }, 100);
  // };

  const loadTemplateIntoEditor = async (template: TemplateOverlay) => {
    setIsLoadingTemplate(true);
    setTemplateLoadingProgress({ current: 0, total: 0 });
    
    try {
      // Update project name immediately
      setProjectName(template.name);
      
      // Process template overlays to handle video downloads
      const processedOverlays = await loadTemplateWithVideos(template, (current, total) => {
        setTemplateLoadingProgress({ current, total });
      });
      
      // Apply the processed overlays
      setOverlays(processedOverlays);
      setSelectedOverlayId(null);
      
      if (template.aspectRatio) {
        setAspectRatio(template.aspectRatio);
      }

      // Trigger project saved event to refresh saved projects with new name
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('projectSaved', { 
          detail: { projectName: template.name } 
        }));
      }, 100);
      
    } catch (error) {
      console.error('Error loading template:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoadingTemplate(false);
      setTemplateLoadingProgress({ current: 0, total: 0 });
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
  }, [handleManualSave]);

  // Listen for project name changes from saved projects
  useEffect(() => {
    const handleProjectNameChanged = (event: CustomEvent) => {
      const { projectId, oldName, newName } = event.detail;
      
      // Check if the current project matches the one being renamed
      // We can match by name since that's what we're using as the identifier
      if (projectName === oldName) {
        setProjectName(newName);
      }
    };

    window.addEventListener('projectNameChanged', handleProjectNameChanged as EventListener);
    return () => window.removeEventListener('projectNameChanged', handleProjectNameChanged as EventListener);
  }, [projectName]);

  useEffect(() => {
    const handleApplyTemplate = (event: CustomEvent) => {
      const { template } = event.detail;
      
      // Use the existing loadTemplateIntoEditor function
      loadTemplateIntoEditor(template);
    };

    window.addEventListener('applyTemplate', handleApplyTemplate as EventListener);
    return () => window.removeEventListener('applyTemplate', handleApplyTemplate as EventListener);
  }, [loadTemplateIntoEditor]);

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
    renderMedia: enhancedRenderMedia,
    renderAudio: enhancedRenderAudio,
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
    isSaving,

    // Admin mode
    isAdminMode,

    // Project name management
    projectName,
    setProjectName,
    newProject,
    loadTemplateIntoEditor,

    // Add autosave recovery props
    autosaveTimestamp,
    preservedAutosaveData,
    handleRecoverAutosave,
    handleDiscardAutosave,

    // Template loading state
    isLoadingTemplate,
    templateLoadingProgress,
    
  };

  return (
      <div 
        className="flex flex-col overflow-hidden h-full"
        style={{
          backgroundColor: 'rgb(244, 242, 250)',
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
                    {/* {showRecoveryDialog && autosaveTimestamp && (
                      <AutosaveRecoveryDialog
                        projectId={projectId}
                        timestamp={autosaveTimestamp}
                        onRecover={handleRecoverAutosave}
                        onDiscard={handleDiscardAutosave}
                        onClose={() => setShowRecoveryDialog(false)}
                      />
                    )} */}
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
