
import RenderControls from "../rendering/render-controls";
import { useEditorContext } from "../../contexts/editor-context";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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

  const handleAspectRatioChange = (value: string) => {
    setAspectRatio(value as AspectRatioOption);
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
          onBlur={async (e) => {
            const newName = e.target.value.trim();
            const oldName = projectName;
            
            // Only proceed if name actually changed and is not empty
            if (newName && newName !== oldName) {
              // Pause autosave during rename operation
              setIsRenamingProject(true);
              
              try {
                const uid = typeof window !== 'undefined' 
                  ? new URLSearchParams(window.location.search).get('uid') || 'default'
                  : 'default';
                
                // Call the project name update API to handle folder renaming
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
                } else {
                  console.error('Failed to update project name');
                  // Revert the name if API call failed
                  setProjectName(oldName);
                }
              } catch (error) {
                console.error('Error updating project name:', error);
                // Revert the name if there was an error
                setProjectName(oldName);
              } finally {
                // Resume autosave after rename operation completes
                setIsRenamingProject(false);
              }
            } else if (!newName) {
              // Revert to old name if new name is empty
              setProjectName(oldName);
            }
          }}
          className="w-60 px-3 py-1.5 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100"
          placeholder="Project name"
        />
        
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
          {["16:9", "9:16", "4:5"].map((ratio) => (
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
      {/* <RenderControls
        handleRender={renderMedia}
        handleRenderAudio={renderAudio}
        state={state}
        saveProject={saveProject}
        downloadTemplate={downloadTemplate}
        renderType={renderType}
      /> */}
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
