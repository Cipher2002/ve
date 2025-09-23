import React from "react";
import { Loader2, Save, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  hasAutosave?: boolean;
  autosaveTimestamp?: number | null;
  onRecoverAutosave?: () => void;
  onDiscardAutosave?: () => void;
}

//SETTING THE API BASE URL
const apiBaseUrl = 'https://zanopy.ai/vedit/api/latest';

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
  renderType = "lambda",
  hasAutosave: propsHasAutosave,
  autosaveTimestamp,
}) => {
  // Get UID from URL
  const getUidFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('uid') || 'default';
  };

  const { 
    isSaving, 
    projectName,
  } = useEditorContext();

  // Get project name from context or input field
  const getProjectName = () => {
    return projectName && projectName.trim() !== '' ? projectName : 'Untitled Project';
  };

  React.useEffect(() => {
      if (state.status === "done") {
        // Extract renderId from URL (last part of the path before /out.extension)
        const urlParts = state.url.split('/');
        const renderId = urlParts[urlParts.length - 2]; // Gets "qt5d2urtsy" from the URL
        
        // Check if it's a video (not audio) by looking at file extension
        const isVideo = state.url.includes('.mp4') || state.url.includes('.webm') || state.url.includes('.mov') || state.url.includes('.mkv');
        
        console.log('🎬 Render completed:', {
          url: state.url,
          renderId,
          isVideo,
          projectName: getProjectName()
        });
        
        // Generate and upload thumbnail for videos only
        if (isVideo && state.url && renderId) {
          console.log('📸 Starting thumbnail generation...');
          generateClientThumbnail(state.url, renderId)
            .then(blob => {
              if (blob) {
                console.log('✅ Thumbnail generated, uploading...');
                uploadThumbnail(blob, renderId, getProjectName());
              } else {
                console.error('❌ Failed to generate thumbnail blob');
              }
            })
            .catch(error => {
              console.error('❌ Failed to generate/upload thumbnail:', error);
            });
        } else {
          console.log('⏭️ Skipping thumbnail generation (audio file or missing data)');
        }
        
        // Emit event to notify that rendering is complete
        window.dispatchEvent(new CustomEvent('renderCompleted', { 
          detail: { 
            url: state.url,
            projectName: getProjectName(),
            timestamp: new Date().toISOString()
          } 
        }));
        
        // Handle credit deduction after successful render
        handleCreditDeduction();
      } else if (state.status === "error") {
        // Optionally emit an error event
        window.dispatchEvent(new CustomEvent('renderError', { 
          detail: { 
            error: state.error?.message || "Failed to render video. Please try again.",
            projectName: getProjectName(),
            timestamp: new Date().toISOString()
          } 
        }));
      }
    }, [state.status, state.url, state.error]);

  // Function to save data to user folder structure
  const saveToUserFolder = async (type: 'project' | 'render', data: any) => {
    const uid = getUidFromUrl();
    const projectName = getProjectName();
    
    try {
      const response = await fetch(`${apiBaseUrl}/save-to-user/save`, {
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

  // Function to handle credit deduction after successful render
  const handleCreditDeduction = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('uid');
    const sessionId = urlParams.get('sid');
    
    if (!userId || !sessionId) {
      console.error('Missing uid or sid from URL parameters');
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/deduct-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          sessionId,
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to deduct credits');
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Credits deducted successfully:', data.data);
      } else {
        console.error('Credit deduction failed:', data.error);
      }
      
    } catch (error) {
      console.error('Error in credit deduction process:', error);
    }
  };

  const handleDownload = (url: string) => {
    let downloadUrl = url;

    if (renderType === "ssr") {
      // Extract filename from URL to get the correct extension
      const filename = url.split("/").pop() || "";
      const fileExtension = filename.split(".").pop() || "mp4";
      
      // Convert the video URL to a download URL for SSR
      downloadUrl = url
        .replace("/rendered-videos/", `${apiBaseUrl}/ssr/download/`)
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

  // Add this function to generate thumbnails client-side
  const generateClientThumbnail = async (videoUrl: string, renderId: string): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      
      video.onloadeddata = () => {
        video.currentTime = 1; // Seek to 1 second
      };
      
      video.onseeked = () => {
        try {
          // Create canvas and draw video frame
          const canvas = document.createElement('canvas');
          canvas.width = 160;
          canvas.height = 90;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          
          // Draw the video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to blob
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/png', 0.8);
          
        } catch (error) {
          console.error('Error generating thumbnail:', error);
          resolve(null);
        }
      };
      
      video.onerror = () => resolve(null);
      video.src = videoUrl;
    });
  };

  // Add this function to upload the thumbnail
  const uploadThumbnail = async (thumbnailBlob: Blob, renderId: string, projectName: string) => {
    
    const formData = new FormData();
    formData.append('thumbnail', thumbnailBlob, `thumbnail-${renderId}.png`);
    formData.append('renderId', renderId);
    formData.append('projectName', projectName);
    formData.append('uid', getUidFromUrl());
    
    try {
      const response = await fetch(`${apiBaseUrl}/upload-thumbnail`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
      } else {
        const error = await response.text();
      }
    } catch (error) {
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
