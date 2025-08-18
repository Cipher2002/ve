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
import { AutosaveStatus } from "./components/autosave/autosave-status";
import { useState, useEffect } from "react";
import { useAutosave } from "./hooks/use-autosave";
import { LocalMediaProvider } from "./contexts/local-media-context";
import { KeyframeProvider } from "./contexts/keyframe-context";
import { AssetLoadingProvider } from "./contexts/asset-loading-context";
import { clearAutosave } from "./utils/indexdb-helper";

//Loading templates with downloaded videos
import { useTemplateLoader } from "./hooks/use-template-loader";

//SETTING THE API BASE URL
const apiBaseUrl = 'https://zanopy.ai/vedit/api/latest';


export default function ReactVideoEditor({ projectId, isAdminMode = false }: { projectId: string; isAdminMode?: boolean }) {
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
  const { loadTemplateWithVideos } = useTemplateLoader();
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [templateLoadingProgress, setTemplateLoadingProgress] = useState({ current: 0, total: 0 });
  const [isAutoLoadingVideo, setIsAutoLoadingVideo] = useState(false);



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
  const handleMuteVideo = (id: number) => {
    const videoOverlay = overlays.find(overlay => overlay.id === id);
    if (!videoOverlay || videoOverlay.type !== 'video') return;
    
    // Toggle mute state - if currently muted (volume 0), unmute to 1, otherwise mute to 0
    const newVolume = (videoOverlay.styles?.volume ?? 1) === 0 ? 1 : 0;
    
    changeOverlay(id, {
      ...videoOverlay,
      styles: {
        ...videoOverlay.styles,
        volume: newVolume,
      },
    });
  };
  const handleMuteAudio = (id: number) => {
    const audioOverlay = overlays.find(overlay => overlay.id === id);
    if (!audioOverlay || audioOverlay.type !== 'sound') return;
    
    // Toggle mute state - if currently muted (volume 0), unmute to 1, otherwise mute to 0
    const newVolume = (audioOverlay.styles?.volume ?? 1) === 0 ? 1 : 0;
    
    changeOverlay(id, {
      ...audioOverlay,
      styles: {
        ...audioOverlay.styles,
        volume: newVolume,
      },
    });
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

  // Captions generation state
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);

  // Auto-load video from URL parameters
  // const handleAutoLoadVideo = async () => {
  //   try {
  //     const autoLoadData = sessionStorage.getItem('autoLoadVideo');
  //     if (!autoLoadData) return;

  //     const { url, type } = JSON.parse(autoLoadData);
      
  //     // Clear the session storage to prevent re-loading
  //     sessionStorage.removeItem('autoLoadVideo');

  //     // Download the video directly using fetch
  //     const response = await fetch(`${apiBaseUrl}/video/download?url=${encodeURIComponent(url)}`);
      
  //     if (!response.ok) {
  //       throw new Error(`Failed to download video: ${response.status}`);
  //     }

  //     const blob = await response.blob();
  //     const cachedVideoUrl = URL.createObjectURL(blob);
      
  //     if (cachedVideoUrl) {
  //       // Get video dimensions
  //       const getVideoNaturalDimensions = (videoUrl: string): Promise<{ width: number; height: number }> => {
  //         return new Promise((resolve) => {
  //           const video = document.createElement('video');
  //           video.preload = 'metadata';
            
  //           video.onloadedmetadata = () => {
  //             resolve({
  //               width: video.videoWidth,
  //               height: video.videoHeight
  //             });
  //           };
            
  //           video.onerror = () => {
  //             // Fallback to composition dimensions
  //             resolve(getAspectRatioDimensions());
  //           };
            
  //           video.src = videoUrl;
  //         });
  //       };

  //       const getVideoDurationInFrames = (videoUrl: string): Promise<number> => {
  //         return new Promise((resolve) => {
  //           const video = document.createElement('video');
  //           video.preload = 'metadata';
            
  //           video.onloadedmetadata = () => {
  //             const durationInSeconds = video.duration;
  //             const durationInFrames = Math.round(durationInSeconds * 30);
  //             resolve(durationInFrames);
  //           };
            
  //           video.onerror = () => {
  //             // Fallback to 300 frames (10 seconds)
  //             resolve(300);
  //           };
            
  //           video.src = videoUrl;
  //         });
  //       };

  //       // Get video properties
  //       const { width, height } = await getVideoNaturalDimensions(cachedVideoUrl);
  //       const videoDuration = await getVideoDurationInFrames(cachedVideoUrl);

  //       // Create video overlay
  //       const videoOverlay: Overlay = {
  //         left: 0,
  //         top: 0,
  //         width,
  //         height,
  //         durationInFrames: videoDuration,
  //         from: 0, // Place at beginning of timeline
  //         id: Date.now(),
  //         rotation: 0,
  //         row: 0, // Place on first row
  //         isDragging: false,
  //         type: 'video' as any,
  //         content: url, // Keep original URL for Remotion
  //         src: cachedVideoUrl, // Keep blob URL for preview
  //         originalUrl: url,
  //         videoStartTime: 0,
  //         styles: {
  //           opacity: 1,
  //           zIndex: 100,
  //           transform: "none",
  //           objectFit: "contain",
  //         },
  //       };

  //       // Add the overlay to the timeline
  //       addOverlay(videoOverlay);
  //     }
  //   } catch (error) {
  //     console.error('Failed to auto-load video:', error);
  //   }
  // };

  const handleAutoLoadVideo = async () => {
    try {
      const autoLoadData = sessionStorage.getItem('autoLoadVideo');
      if (!autoLoadData) return;

      const { url, type } = JSON.parse(autoLoadData);
      
      // Clear the session storage to prevent re-loading
      sessionStorage.removeItem('autoLoadVideo');
      
      // Set loading state
      setIsAutoLoadingVideo(true);

      // Download the video directly using fetch
      const response = await fetch(`${apiBaseUrl}/video/download?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.status}`);
      }

      const blob = await response.blob();
      const cachedVideoUrl = URL.createObjectURL(blob);
      
      if (cachedVideoUrl) {
        // Get video dimensions
        const getVideoNaturalDimensions = (videoUrl: string): Promise<{ width: number; height: number }> => {
          return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            
            video.onloadedmetadata = () => {
              resolve({
                width: video.videoWidth,
                height: video.videoHeight
              });
            };
            
            video.onerror = () => {
              // Fallback to composition dimensions
              resolve(getAspectRatioDimensions());
            };
            
            video.src = videoUrl;
          });
        };

        const getVideoDurationInFrames = (videoUrl: string): Promise<number> => {
          return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            
            video.onloadedmetadata = () => {
              const durationInSeconds = video.duration;
              const durationInFrames = Math.round(durationInSeconds * 30);
              resolve(durationInFrames);
            };
            
            video.onerror = () => {
              // Fallback to 300 frames (10 seconds)
              resolve(300);
            };
            
            video.src = videoUrl;
          });
        };

        // Get video properties
        const { width, height } = await getVideoNaturalDimensions(cachedVideoUrl);
        const videoDuration = await getVideoDurationInFrames(cachedVideoUrl);

        // Create video overlay
        const videoOverlay: Overlay = {
          left: 0,
          top: 0,
          width,
          height,
          durationInFrames: videoDuration,
          from: 0, // Place at beginning of timeline
          id: Date.now(),
          rotation: 0,
          row: 0, // Place on first row
          isDragging: false,
          type: 'video' as any,
          content: url, // Keep original URL for Remotion
          src: cachedVideoUrl, // Keep blob URL for preview
          originalUrl: url,
          videoStartTime: 0,
          styles: {
            opacity: 1,
            zIndex: 100,
            transform: "none",
            objectFit: "contain",
          },
        };

        // Add the overlay to the timeline
        addOverlay(videoOverlay);
      }
    } catch (error) {
      console.error('Failed to auto-load video:', error);
    } finally {
      // Clear loading state
      setIsAutoLoadingVideo(false);
    }
  };

  // Rename project state
  const [isRenamingProject, setIsRenamingProject] = useState(false);

  const [hasTimelineContent, setHasTimelineContent] = useState(false);

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
    projectName,
    durationInFrames,
    fps: FPS,
    width: getAspectRatioDimensions().width,
    height: getAspectRatioDimensions().height,
  };

  const { saveState, loadState } = useAutosave(projectId, editorState, {
    interval: AUTO_SAVE_INTERVAL,
    isPaused: isRenamingProject,
    isEnabled: hasTimelineContent, // Only enable autosave when timeline has content
    onSave: () => {
      setIsSaving(false);
      setLastSaveTime(Date.now());
    },
  });

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

      const response = await fetch(`${apiBaseUrl}/save-to-user/save`, {
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
        const response = await fetch(`${apiBaseUrl}/templates/save?uid=${uid}`, {
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

  // Monitor when user first adds content to timeline (once enabled, stays enabled)
  useEffect(() => {
    if (!hasTimelineContent && overlays.length > 0) {
      setHasTimelineContent(true);
    }
    // Once user has added content once, autosave remains active
  }, [overlays.length, hasTimelineContent]);

  useEffect(() => {
    const handleApplyTemplate = (event: CustomEvent) => {
      const { template } = event.detail;
      
      // Use the existing loadTemplateIntoEditor function
      loadTemplateIntoEditor(template);
    };

    window.addEventListener('applyTemplate', handleApplyTemplate as EventListener);
    return () => window.removeEventListener('applyTemplate', handleApplyTemplate as EventListener);
  }, [loadTemplateIntoEditor]);

  // Auto-load video from URL parameters on component mount
  useEffect(() => {
    // Add a small delay to ensure all contexts are initialized
    const timer = setTimeout(() => {
      handleAutoLoadVideo();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

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
    handleMuteVideo,
    handleMuteAudio,
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
    setIsRenamingProject,

    // Template loading state
    isLoadingTemplate,
    templateLoadingProgress,

    // Caption generation state
    isGeneratingCaptions,
    setIsGeneratingCaptions,

    // Auto-load video from URL parameters
    handleAutoLoadVideo,
    isAutoLoadingVideo,
    
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