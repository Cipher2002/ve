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
}

/**
 * RenderControls component provides UI controls for video rendering functionality
 *
 * Features:
 * - Render button that shows progress during rendering
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
}) => {
  // Store multiple renders
  const [renders, setRenders] = React.useState<RenderItem[]>([]);
  // Track if there are new renders
  const [hasNewRender, setHasNewRender] = React.useState(false);

  // Add new render to the list when completed
  React.useEffect(() => {
    if (state.status === "done") {
      setRenders((prev) => [
        {
          url: state.url,
          timestamp: new Date(),
          id: crypto.randomUUID(),
          status: "success",
        },
        ...prev,
      ]);
      setHasNewRender(true);
    } else if (state.status === "error") {
      setRenders((prev) => [
        {
          timestamp: new Date(),
          id: crypto.randomUUID(),
          status: "error",
          error:
            state.error?.message || "Failed to render video. Please try again.",
        },
        ...prev,
      ]);
      setHasNewRender(true);
    }
  }, [state.status, state.url, state.error]);

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

  const { isSaving } = useEditorContext();

  return (
    <>
    <Button
      variant="ghost"
      size="sm"
      className="relative text-white"
      style={{ backgroundColor: '#490972' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#490972';
        e.currentTarget.style.color = 'white';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#490972';
        e.currentTarget.style.color = 'white';
      }}
      onClick={downloadTemplate}
      disabled={isSaving}
      title="Save Project"
    >
      {isSaving ? (
        <>
          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Save className="w-3.5 h-3.5 mr-1.5" />
          Save Project
        </>
      )}
    </Button>
      <Popover onOpenChange={() => setHasNewRender(false)}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative text-white"
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
            <Bell className="w-3.5 h-3.5" />
            {hasNewRender && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-3">
          {/* ... existing PopoverContent code remains the same ... */}
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium">Recent Renders</h4>
            {renders.length === 0 ? (
              <p className="text-xs text-muted-foreground">No renders yet</p>
            ) : (
              renders.map((render) => (
                <div
                  key={render.id}
                  className={`flex items-center justify-between rounded-md border p-1.5 ${
                    render.status === "error"
                      ? "border-destructive/50 bg-destructive/10"
                      : "border-border"
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="text-xs text-zinc-200">
                      {render.status === "error" ? (
                        <span className="text-red-400 font-medium">
                          Render Failed
                        </span>
                      ) : (
                        getDisplayFileName(render.url!)
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(render.timestamp, {
                        addSuffix: true,
                      })}
                      {render.error && (
                        <div
                          className="text-red-400 mt-0.5 truncate max-w-[180px]"
                          title={render.error}
                        >
                          {render.error}
                        </div>
                      )}
                    </div>
                  </div>
                  {render.status === "success" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white h-6 w-6"
                      style={{ backgroundColor: '#490972' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#490972';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#490972';
                        e.currentTarget.style.color = 'white';
                      }}
                      onClick={() => handleDownload(render.url!)}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={state.status === "rendering" || state.status === "invoking"}
          className="text-white border-gray-700"
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
              Render
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
            Render Video
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem 
              onClick={() => handleRender('mp4', 'h264')}
              disabled={state.status === "rendering" || state.status === "invoking"}
            >
              Render in MP4
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleRender('mov', 'h264')}
              disabled={state.status === "rendering" || state.status === "invoking"}
            >
              Render in MOV
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleRender('mkv', 'h264')}
              disabled={state.status === "rendering" || state.status === "invoking"}
            >
              Render in MKV
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleRender('gif', 'gif')}
              disabled={state.status === "rendering" || state.status === "invoking"}
            >
              Render in GIF
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleRender('webm', 'vp8')}
              disabled={state.status === "rendering" || state.status === "invoking"}
            >
              Render in WebM
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger 
            disabled={state.status === "rendering" || state.status === "invoking"}
            className="flex items-center [&>svg:last-child]:hidden px-3 py-2 hover:bg-accent cursor-pointer"
          >
            <ChevronDown className="w-3.5 h-3.5 mr-1.5 rotate-90" />
            Render Audio
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem 
              onClick={() => handleRenderAudio('mp3', 'mp3')}
              disabled={state.status === "rendering" || state.status === "invoking"}
            >
              Render in MP3
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleRenderAudio('wav', 'wav')}
              disabled={state.status === "rendering" || state.status === "invoking"}
            >
              Render in WAV
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleRenderAudio('aac', 'aac')}
              disabled={state.status === "rendering" || state.status === "invoking"}
            >
              Render in AAC
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
    
    </>
  );
};

export default RenderControls;
