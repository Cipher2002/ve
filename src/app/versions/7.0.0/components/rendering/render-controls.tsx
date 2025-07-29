import React from "react";
import { Download, Loader2, Bell, Save, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { useEditorContext } from "../../contexts/editor-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { AutosaveRecoveryDialog } from "../autosave/autosave-recovery-dialog";

/**
 * Interface representing a single video render attempt
 * @property {string} url - URL of the rendered video (if successful)
 * @property {Date} timestamp - When the render was completed
 * @property {string} id - Unique identifier for the render
 * @property {'success' | 'error'} status - Result of the render attempt
 * @property {string} error - Error message if render failed
 */
interface RenderItem {
  url?: string;
  timestamp: Date;
  id: string;
  status: "success" | "error";
  error?: string;
}

/**
 * Props for the RenderControls component
 * @property {object} state - Current render state containing status, progress, and URL
 * @property {() => void} handleRender - Function to trigger a new render
 * @property {() => void} saveProject - Function to save the project
 * @property {('ssr' | 'lambda')?} renderType - Type of render (SSR or Lambda)
 */
interface RenderControlsProps {
  state: any;
  handleRender: (format?: string, codec?: string) => void;
  handleRenderAudio: (format?: string, codec?: string) => void;
  saveProject?: () => Promise<void>;
  downloadTemplate?: () => void;
  renderType?: "ssr" | "lambda";
  hasAutosave?: boolean;
  autosaveTimestamp?: number | null;
  onRecoverAutosave?: () => void;
  onDiscardAutosave?: () => void;
}

/**
 * RenderControls component provides UI controls for video rendering functionality
 *
 * Features:
 * - Export button that shows progress during rendering
 * - Notification bell showing render history
 * - Download buttons for completed renders
 * - Error display for failed renders
 *
 * The component maintains a history of render attempts, both successful and failed,
 * and provides visual feedback about the current render status.
 */
const RenderControls: React.FC<RenderControlsProps> = ({
  state,
  handleRender,
  handleRenderAudio,
  saveProject,
  downloadTemplate,
  renderType = "ssr",
  hasAutosave: propsHasAutosave,
  autosaveTimestamp,
  onRecoverAutosave,
  onDiscardAutosave,
}) => {
  // Get UID from URL
  const getUidFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('uid') || 'default';
  };

  const { 
    isSaving, 
    projectName,
    autosaveTimestamp: contextAutosaveTimestamp,
    handleRecoverAutosave: contextHandleRecoverAutosave,
    handleDiscardAutosave: contextHandleDiscardAutosave,
  } = useEditorContext();

  // Use props if provided, otherwise fall back to context
  const finalAutosaveTimestamp = autosaveTimestamp ?? contextAutosaveTimestamp;
  const finalHandleRecoverAutosave = onRecoverAutosave ?? contextHandleRecoverAutosave;
  const finalHandleDiscardAutosave = onDiscardAutosave ?? contextHandleDiscardAutosave;

  // Create hasAutosave based on whether autosaveTimestamp exists
  const hasAutosave = Boolean(finalAutosaveTimestamp);
  
  // Get project name from context or input field
  const getProjectName = () => {
    return projectName && projectName.trim() !== '' ? projectName : 'Untitled Project';
  };
  React.useEffect(() => {
    if (state.status === "done") {
      const newRender = {
        url: state.url,
        timestamp: new Date(),
        id: crypto.randomUUID(),
        status: "success" as const,
      };
      
      // Save render info to user folder
      saveToUserFolder('render', newRender);
    } else if (state.status === "error") {
      const newRender = {
        timestamp: new Date(),
        id: crypto.randomUUID(),
        status: "error" as const,
        error: state.error?.message || "Failed to render video. Please try again.",
      };
      
      // Save error info to user folder
      saveToUserFolder('render', newRender);
    }
  }, [state.status, state.url, state.error]);

  // Function to save data to user folder structure
  const saveToUserFolder = async (type: 'project' | 'render', data: any) => {
    const uid = getUidFromUrl();
    const projectName = getProjectName();
    
    try {
      const response = await fetch('/api/latest/save-to-user/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid,
          projectName,
          type,
          data,
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to save to user folder');
      }
    } catch (error) {
      console.error('Error saving to user folder:', error);
    }
  };

  const handleDownload = (url: string) => {
    let downloadUrl = url;

    if (renderType === "ssr") {
      // Extract filename from URL to get the correct extension
      const filename = url.split("/").pop() || "";
      const fileExtension = filename.split(".").pop() || "mp4";
      const fileId = filename.replace(`.${fileExtension}`, "");
      
      // Convert the video URL to a download URL for SSR
      downloadUrl = url
        .replace("/rendered-videos/", "/api/latest/ssr/download/")
        .replace(`.${fileExtension}`, "");
    }
    // Lambda URLs are already in the correct format for download

    // Get the actual filename from the URL for download
    const actualFilename = url.split("/").pop() || "rendered-file";

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = actualFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getDisplayFileName = (url: string) => {
    if (renderType === "ssr") {
      return url.split("/").pop();
    }
    // For Lambda URLs, use the full URL pathname
    try {
      return new URL(url).pathname.split("/").pop();
    } catch {
      return url.split("/").pop();
    }
  };

  return (
    <>
    <Button
      variant="ghost"
      size="sm"
      className="relative text-white select-none"
      style={{ backgroundColor: '#490972' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#490972';
        e.currentTarget.style.color = 'white';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#490972';
        e.currentTarget.style.color = 'white';
      }}
      onClick={async () => {
        if (downloadTemplate) {
          downloadTemplate();
          // Also save project info to user folder
          await saveToUserFolder('project', {
            name: getProjectName(),
            savedAt: new Date().toISOString(),
            type: 'project_save'
          });
          
          // Trigger a refresh of the saved projects
          window.dispatchEvent(new CustomEvent('projectSaved', { 
            detail: { projectName: getProjectName() } 
          }));
        }
      }}
      disabled={isSaving}
      title="Save Project"
    >
      {isSaving ? (
        <>
          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin select-none" />
          Saving...
        </>
      ) : (
        <>
          <Save className="w-3.5 h-3.5 mr-1.5 select-none" />
          Save Project
        </>
      )}
    </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`relative text-white transition-all duration-300 ${
              hasAutosave ? 'animate-pulse' : ''
            }`}
            style={{ backgroundColor: hasAutosave ? '#ef4444' : '#490972' }}
            onMouseEnter={(e) => {
              if (!hasAutosave) {
                e.currentTarget.style.backgroundColor = '#490972';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = hasAutosave ? '#ef4444' : '#490972';
              e.currentTarget.style.color = 'white';
            }}
          >
            <Bell className="w-3.5 h-3.5" />
            {hasAutosave && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 animate-ping" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          {hasAutosave && finalAutosaveTimestamp ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                <h4 className="text-sm font-semibold">Unsaved Changes Found</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                We found an autosaved version of your project from{" "}
                <time className="font-medium">
                  {formatDistanceToNow(new Date(finalAutosaveTimestamp), { addSuffix: true })}
                </time>{" "}
                ({new Date(finalAutosaveTimestamp).toLocaleTimeString()})
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={finalHandleDiscardAutosave}
                  className="flex-1"
                >
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={finalHandleRecoverAutosave}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Recover Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">No autosave data found</p>
            </div>
          )}
        </PopoverContent>
      </Popover>

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={state.status === "rendering" || state.status === "invoking"}
          className="text-white border-gray-700 select-none"
          style={{ backgroundColor: '#490972' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#490972';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#490972';
            e.currentTarget.style.color = 'white';
          }}
        >
          {state.status === "rendering" ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Rendering... {(state.progress * 100).toFixed(0)}%
            </>
          ) : state.status === "invoking" ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Preparing...
            </>
          ) : (
            <>
              <img 
                src="https://zanopy.ai/assets/images/3491bfc1ad15744a7aa565f8f4cbce1e.png" 
                alt="Export" 
                className="w-3.5 h-3.5 mr-0.5" 
              />
              2<span className="ml-2">Export</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="p-0">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger 
            disabled={state.status === "rendering" || state.status === "invoking"}
            className="flex items-center [&>svg:last-child]:hidden px-3 py-2 hover:bg-accent cursor-pointer"
          >
            <ChevronDown className="w-3.5 h-3.5 mr-1.5 rotate-90" />
            <span className="ml-2">Export Video</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem 
              onClick={() => handleRender('mp4', 'h264')}
              disabled={state.status === "rendering" || state.status === "invoking"}
            >
              <span className="ml-2">Export in MP4</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleRender('mov', 'h264')}
              disabled={state.status === "rendering" || state.status === "invoking"}
            >
              <span className="ml-2">Export in MOV</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleRender('mkv', 'h264')}
              disabled={state.status === "rendering" || state.status === "invoking"}
            >
            <span className="ml-2">Export in MKV</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleRender('webm', 'vp8')}
              disabled={state.status === "rendering" || state.status === "invoking"}
            >
              <span className="ml-2">Export in WebM</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger 
            disabled={state.status === "rendering" || state.status === "invoking"}
            className="flex items-center [&>svg:last-child]:hidden px-3 py-2 hover:bg-accent cursor-pointer"
          >
            <ChevronDown className="w-3.5 h-3.5 mr-1.5 rotate-90" />
            <span className="ml-2">Export Audio</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem 
              onClick={() => handleRenderAudio('mp3', 'mp3')}
              disabled={state.status === "rendering" || state.status === "invoking"}
            >
              <span className="ml-2">Export in MP3</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleRenderAudio('wav', 'wav')}
              disabled={state.status === "rendering" || state.status === "invoking"}
            >
              <span className="ml-2">Export in WAV</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleRenderAudio('aac', 'aac')}
              disabled={state.status === "rendering" || state.status === "invoking"}
            >
              <span className="ml-2">Export in AAC</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
    
    </>
  );
};

export default RenderControls;
