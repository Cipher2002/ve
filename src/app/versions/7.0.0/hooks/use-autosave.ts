import { useEffect, useRef, useState } from "react";
import {
  saveEditorState,
  loadEditorState,
  hasAutosave,
} from "../utils/indexdb-helper";

interface AutosaveOptions {
  /**
   * Interval in milliseconds between autosaves
   * @default 5000 (5 seconds)
   */
  interval?: number;

  /**
   * Function to call when an autosave is loaded
   */
  onLoad?: (data: any) => void;

  /**
   * Function to call when an autosave is saved
   */
  onSave?: () => void;

  /**
   * Function to call when an autosave is detected on initial load
   */
  onAutosaveDetected?: (timestamp: number) => void;

  /**
   * Whether autosave is currently paused
   */
  isPaused?: boolean;
}

/**
 * Hook for automatically saving editor state to IndexedDB
 *
 * @param projectId Unique identifier for the project
 * @param state Current state to be saved
 * @param options Configuration options for autosave behavior
 * @returns Object with functions to manually save and load state
 */
export const useAutosave = (
  projectId: string,
  state: any,
  options: AutosaveOptions = {}
) => {
  const { interval = 5000, onLoad, onSave, onAutosaveDetected, isPaused = false } = options;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const saveInProgressRef = useRef<boolean>(false);
  const lastSavedStateRef = useRef<string>("");
  // const [hasCheckedForAutosave, setHasCheckedForAutosave] = useState(false);

  // Check for existing autosave on mount, but only once
  // useEffect(() => {
  //   const checkForAutosave = async () => {
  //     if (hasCheckedForAutosave) return;

  //     try {
  //       const timestamp = await hasAutosave(projectId);
  //       if (timestamp && onAutosaveDetected) {
  //         onAutosaveDetected(timestamp);
  //       }
  //       setHasCheckedForAutosave(true);
  //     } catch (error) {
  //       console.error("Failed to check for autosave:", error);
  //       setHasCheckedForAutosave(true);
  //     }
  //   };

  //   checkForAutosave();
  // }, [projectId, onAutosaveDetected, hasCheckedForAutosave]);

  // Set up autosave timer
  useEffect(() => {
    // Don't start autosave if projectId is not valid
    if (!projectId || !state.projectName) return;

    const saveIfChanged = async () => {
      // Skip autosave if paused or already saving
      if (isPaused || saveInProgressRef.current) return;
      
      const currentStateString = JSON.stringify(state);

      // Only save if state has changed since last save
      if (currentStateString !== lastSavedStateRef.current) {
        // Set save in progress flag
        saveInProgressRef.current = true;
        
        try {
          // Small delay to ensure state updates are reflected
          await new Promise(resolve => setTimeout(resolve, 100));
          const getUidFromUrl = () => {
            if (typeof window === 'undefined') return 'default';
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get('uid') || 'default';
          };

          const uid = getUidFromUrl();

          // Prepare project save data
          const projectSaveData = {
            overlays: state.overlays,
            aspectRatio: state.aspectRatio,
            playerDimensions: state.playerDimensions,
            durationInFrames: state.durationInFrames || 30 * 30,
            fps: 30,
            width: state.playerDimensions?.width || 1920,
            height: state.playerDimensions?.height || 1080,
          };

          // Prepare template data
          const templateData = {
            id: `template-${Date.now()}`,
            name: state.projectName,
            description: "Template created from editor",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: { id: "user", name: "User" },
            category: "Custom",
            tags: ["custom", "user-created"],
            duration: state.durationInFrames || 30 * 30,
            aspectRatio: state.aspectRatio || "16:9",
            overlays: state.overlays || []
          };

          // Save both project and template in parallel
          const [projectResponse, templateResponse] = await Promise.all([
            fetch('/api/latest/save-to-user/save', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                uid,
                projectName: state.projectName,
                type: 'project',
                data: projectSaveData,
                timestamp: new Date().toISOString(),
              }),
            }),
            fetch(`/api/latest/templates/save?uid=${uid}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(templateData)
            })
          ]);

          if (projectResponse.ok && templateResponse.ok) {
            lastSavedStateRef.current = currentStateString;
            if (onSave) onSave();

            // Trigger events to refresh UI
            window.dispatchEvent(new CustomEvent('projectSaved', { 
              detail: { projectName: state.projectName } 
            }));
            window.dispatchEvent(new CustomEvent('templateUpdated', { 
              detail: { isUpdate: true, templateName: state.projectName }
            }));
          } else {
          console.error("Autosave failed: API responses not OK");
        }

      } catch (error) {
        console.error("Autosave failed:", error);
      } finally {
        // Clear save in progress flag
        saveInProgressRef.current = false;
      }
    }
  };

    // Set up interval for autosave
    timerRef.current = setInterval(saveIfChanged, interval);

    // Clean up timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [projectId, state, interval, onSave, state.projectName]);


  // Function to manually save state
  const saveState = async () => {
    try {
      await saveEditorState(projectId, state);
      lastSavedStateRef.current = JSON.stringify(state);
      if (onSave) onSave();
      return true;
    } catch (error) {
      console.error("Manual save failed:", error);
      return false;
    }
  };

  // Function to manually load state
  const loadState = async () => {
    try {
      const loadedState = await loadEditorState(projectId);
      if (loadedState && onLoad) {
        onLoad(loadedState);
      }
      return loadedState;
    } catch (error) {
      console.error("Load failed:", error);
      return null;
    }
  };

  return {
    saveState,
    loadState,
  };
};
