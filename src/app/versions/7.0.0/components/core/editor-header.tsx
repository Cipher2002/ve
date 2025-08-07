
import RenderControls from "../rendering/render-controls";
import { useEditorContext } from "../../contexts/editor-context";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";

// Types
type AspectRatioOption = "16:9" | "9:16" | "1:1" | "4:5";

//SETTING THE API BASE URL
const apiBaseUrl = 'https://zanopy.ai/vedit/api/latest';

/**
 * EditorHeader component renders the top navigation bar of the editor interface.
 *
 * @component
 * @description
 * This component provides the main navigation and control elements at the top of the editor:
 * - Rendering controls for media export
 *
 *
 * @example
 * ```tsx
 * <EditorHeader />
 * ```
 *
 * @returns {JSX.Element} A header element containing navigation and control components
 */
export function EditorHeader() {
  /**
   * Destructure required values from the editor context:
   * - renderMedia: Function to handle media rendering/export
   * - state: Current editor state
   * - renderType: Type of render
   */
  const { 
    renderMedia, 
    renderAudio, 
    state, 
    saveProject, 
    downloadTemplate, 
    renderType, 
    projectName, 
    aspectRatio, 
    setProjectName, 
    setAspectRatio, 
    newProject,
    autosaveTimestamp,
    handleRecoverAutosave,
    handleDiscardAutosave,
    setIsRenamingProject
  } = useEditorContext();

  // Create hasAutosave based on whether autosaveTimestamp exists
  const hasAutosave = Boolean(autosaveTimestamp);

  const [isInputFocused, setIsInputFocused] = useState(false);
  const [originalName, setOriginalName] = useState(projectName);
  const [isRenaming, setIsRenaming] = useState(false);

  const handleCancelRename = () => {
    setProjectName(originalName); // Revert to original name
    setIsInputFocused(false); // Hide the rename controls
  };

  const handleAspectRatioChange = (value: string) => {
    setAspectRatio(value as AspectRatioOption);
  };

  const handleRenameProject = async () => {
    const newName = projectName.trim();
    const oldName = originalName;
    
    // Only proceed if name actually changed and is not empty
    if (newName && newName !== oldName) {
      setIsRenaming(true);
      setIsRenamingProject(true);
      
      try {
        const uid = typeof window !== 'undefined' 
          ? new URLSearchParams(window.location.search).get('uid') || 'default'
          : 'default';
        
        // Check if project exists (has been saved before)
        const checkResponse = await fetch(`${apiBaseUrl}/save-to-user/get-project-data?uid=${uid}&projectName=${oldName}`);
        
        if (checkResponse.ok) {
          // Project exists, rename it
          const updateResponse = await fetch(`${apiBaseUrl}/save-to-user/update-name`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              uid,
              oldName: oldName,
              newName: newName,
              projectId: `${uid}-${oldName}`,
            }),
          });
          
          if (updateResponse.ok) {
            // Update original name to new name
            setOriginalName(newName);
            
            // Trigger events to refresh UI components
            window.dispatchEvent(new CustomEvent('projectSaved', { 
              detail: { projectName: newName } 
            }));
            
            window.dispatchEvent(new CustomEvent('templateUpdated', { 
              detail: { isUpdate: true, templateName: newName }
            }));
            
            window.dispatchEvent(new CustomEvent('projectNameChanged', { 
              detail: { 
                projectId: `${uid}-${oldName}`,
                oldName: oldName,
                newName: newName 
              } 
            }));

            // Wait a bit for all UI components to update
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            console.error('Failed to update project name');
            setProjectName(oldName);
          }
        } else {
          // Project doesn't exist yet (hasn't been saved), just update the name locally
          setOriginalName(newName);
          console.log('Project name updated locally (not saved yet)');
        }
      } catch (error) {
        console.error('Error updating project name:', error);
        // For unsaved projects, still allow the name change
        if (error instanceof TypeError && error.message.includes('fetch')) {
          // Network error - might be unsaved project, allow local rename
          setOriginalName(newName);
          console.log('Project name updated locally due to network error');
        } else {
          setProjectName(oldName);
        }
      } finally {
        setIsRenaming(false);
        setIsRenamingProject(false);
        setIsInputFocused(false);
      }
    } else if (!newName) {
      // Revert to old name if new name is empty
      setProjectName(oldName);
      setIsInputFocused(false);
    }
  };

  return (
    <header
      className="sticky top-0 flex shrink-0 items-center gap-2.5 
      bg-white dark:bg-gray-900/10
      border-l 
      border-b border-gray-200 dark:border-gray-800
      p-2.5 px-4.5"
    >

      {/* Project name field */}
      <div className="flex items-center gap-2 min-w-0">
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          onFocus={() => {
            setIsInputFocused(true);
            setOriginalName(projectName);
          }}
          onBlur={(e) => {
            // Only validate empty name, don't trigger rename
            if (!e.target.value.trim()) {
              setProjectName(originalName);
            }
            // Don't hide the button immediately - let the rename button handle it
          }}
          className="w-60 px-3 py-1.5 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100"
          placeholder="Project name"
        />

        {isInputFocused && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleRenameProject}
              onMouseDown={(e) => e.preventDefault()} // Prevent input from losing focus
              disabled={isRenaming}
              className="flex-shrink-0 px-3 py-1.5 text-sm bg-[rgb(41,0,156)]/15 text-[rgb(41,0,156)] border border-[rgb(41,0,156)] hover:bg-[rgb(41,0,156)]/15 rounded-md transition-colors whitespace-nowrap select-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isRenaming && (
                <div className="animate-spin rounded-full h-3 w-3 border border-[rgb(41,0,156)] hover:bg-[rgb(41,0,156)]/15 border-t-transparent"></div>
              )}
              {isRenaming ? 'Renaming...' : 'Rename Project'}
            </button>
            
            <button
              onClick={handleCancelRename}
              onMouseDown={(e) => e.preventDefault()} // Prevent input from losing focus
              disabled={isRenaming}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cancel rename"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <button
          onClick={newProject}
          className="flex-shrink-0 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md transition-colors whitespace-nowrap select-none"
        >
          New Project
        </button>
      </div>

      {/* Spacer to push rendering controls to the right */}
      <div className="flex-grow" />

      {/* Aspect Ratio */}
      <div className="flex items-center gap-3">
        <Label className="text-sm text-gray-700 dark:text-zinc-300 font-medium whitespace-nowrap select-none">
          Aspect Ratio
        </Label>
        <div className="flex gap-1">
          {["16:9", "9:16", "1:1"].map((ratio) => (
            <Button
              key={ratio}
              onClick={() => handleAspectRatioChange(ratio)}
              size="sm"
              variant={aspectRatio === ratio ? "default" : "outline"}
              className={`h-8 px-3 min-w-[3rem] text-xs transition-colors select-none ${
                aspectRatio === ratio
                  ? "text-white border-0"
                  : "bg-white hover:bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-zinc-300"
              }`}
              style={{
                backgroundColor: aspectRatio === ratio ? '#490972' : undefined
              }}
              onMouseEnter={(e) => {
                if (aspectRatio === ratio) {
                  e.currentTarget.style.backgroundColor = '#490972';
                }
              }}
              onMouseLeave={(e) => {
                if (aspectRatio === ratio) {
                  e.currentTarget.style.backgroundColor = '#490972';
                }
              }}
            >
              {ratio}
            </Button>
          ))}
        </div>
      </div>

      {/* Media rendering controls */}
      <RenderControls
        handleRender={renderMedia}
        handleRenderAudio={renderAudio}
        state={state}
        saveProject={saveProject}
        downloadTemplate={downloadTemplate}
        renderType={renderType}
        hasAutosave={hasAutosave}
        autosaveTimestamp={autosaveTimestamp}
        onRecoverAutosave={handleRecoverAutosave}
        onDiscardAutosave={handleDiscardAutosave}
      />
    </header>
  );
}
