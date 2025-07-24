
import RenderControls from "../rendering/render-controls";
import { useEditorContext } from "../../contexts/editor-context";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// Types
type AspectRatioOption = "16:9" | "9:16" | "1:1" | "4:5";

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
  const { renderMedia, state, saveProject, downloadTemplate, renderType, projectName, aspectRatio, setProjectName,setAspectRatio, newProject } = useEditorContext();

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
          onBlur={() => {
            // Save the name when focus is lost
            if (saveProject) {
              saveProject();
            }
          }}
          className="w-60 px-3 py-1.5 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100"
          placeholder="Project name"
        />
        
        <button
          onClick={newProject}
          className="flex-shrink-0 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md transition-colors whitespace-nowrap"
        >
          New Project
        </button>
      </div>

      {/* Spacer to push rendering controls to the right */}
      <div className="flex-grow" />

      {/* Aspect Ratio */}
      <div className="flex items-center gap-3">
        <Label className="text-sm text-gray-700 dark:text-zinc-300 font-medium whitespace-nowrap">
          Aspect Ratio
        </Label>
        <div className="flex gap-1">
          {["16:9", "9:16", "4:5"].map((ratio) => (
            <Button
              key={ratio}
              onClick={() => handleAspectRatioChange(ratio)}
              size="sm"
              variant={aspectRatio === ratio ? "default" : "outline"}
              className={`h-8 px-3 min-w-[3rem] text-xs transition-colors ${
                aspectRatio === ratio
                  ? "bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 border-0"
                  : "bg-white hover:bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-zinc-300"
              }`}
            >
              {ratio}
            </Button>
          ))}
        </div>
      </div>

      {/* Media rendering controls */}
      <RenderControls
        handleRender={renderMedia}
        state={state}
        saveProject={saveProject}
        downloadTemplate={downloadTemplate}
        renderType={renderType}
      />
    </header>
  );
}
