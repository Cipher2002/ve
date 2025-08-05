import React from "react";
import { Type, Film, Image, Volume2, Sticker } from "lucide-react";
import { OverlayType, Overlay, CaptionOverlay } from "../../types";
import { DISABLE_VIDEO_KEYFRAMES } from "../../constants";

type LoadingCaptionOverlay = CaptionOverlay & {
  isLoading: boolean;
  loadingStage: 'extracting' | 'generating' | 'complete';
  sourceType: 'video' | 'audio';
  sourceOverlayId: number;
};

type TimelineItem = Overlay | LoadingCaptionOverlay;

/**
 * Props for the TimelineItemLabel component
 * @interface TimelineItemLabelProps
 * @property {Overlay} item - The overlay item to display (text, video, image, sound, or caption)
 * @property {boolean} isSelected - Whether the timeline item is currently selected
 */
interface TimelineItemLabelProps {
  item: Overlay & { isLoading?: boolean; loadingStage?: string; sourceType?: string; sourceOverlayId?: number };
  isSelected: boolean;
}

/**
 * Component that renders a label for a timeline item, showing its type and content
 * with appropriate styling and icons based on the overlay type.
 *
 * @component
 * @param {TimelineItemLabelProps} props - Component props
 * @returns {JSX.Element} Rendered timeline item label
 */
export const TimelineItemLabel: React.FC<TimelineItemLabelProps> = ({
  item,
  isSelected,
}) => {
  /**
   * Returns the appropriate icon component based on the overlay type
   * @param {string} type - The type of overlay
   * @returns {JSX.Element | null} Icon component or null
   */
  const getItemIcon = (type: string) => {
    switch (type) {
      case OverlayType.TEXT:
        return <Type className="w-2 h-2 mr-0.5" />;
      case OverlayType.VIDEO:
        return <Film className="w-2 h-2 mr-0.5" />;
      case OverlayType.IMAGE:
        return <Image className="w-2 h-2 mr-0.5" />;
      case OverlayType.SOUND:
        return <Volume2 className="w-2 h-2 mr-0.5" />;
      case OverlayType.STICKER:
        return <Sticker className="w-2 h-2 mr-0.5" />;
      case OverlayType.CAPTION:
        return <></>;
      default:
        return null;
    }
  };

  /**
   * Determines the label content to display based on the item type and properties
   * - For captions: returns empty string
   * - For text: returns the content string
   * - For media (image/video/sound): returns filename from src or name property
   * - Fallback: returns the item type
   *
   * @returns {string} The label content to display
   */
  // const getLabelContent = () => {
  //   if (item.type === OverlayType.CAPTION) {
  //     return "";
  //   }
  //   if (item.type === OverlayType.SOUND && 'isLoading' in item && item.isLoading) {
  //     return "Extracting...";
  //   }
  //   if (item.type === OverlayType.TEXT && typeof item.content === "string") {
  //     return item.content;
  //   }
  //   if ("src" in item && item.src) {
  //     const filename = item.src.split("/").pop() || "";
  //     return filename.split("?")[0];
  //   }
  //   if ("name" in item && item.name) {
  //     return String(item.name);
  //   }
  //   return String(item.type);
  // };
  const getLabelContent = () => {
    // Handle loading states first
    if (item.isLoading) {
      if (item.type === OverlayType.CAPTION) {
        const stage = item.loadingStage;
        switch (stage) {
          case 'extracting':
            return `Extracting Audio... (${item.sourceType})`;
          case 'generating':
            return `Generating Captions... (${item.sourceType})`;
          default:
            return "Processing...";
        }
      }
      if (item.type === OverlayType.SOUND) {
        return "Extracting...";
      }
    }
    
    if (item.type === OverlayType.CAPTION) {
      return "";
    }
    if (item.type === OverlayType.TEXT && typeof item.content === "string") {
      return item.content;
    }
    if ("src" in item && item.src) {
      const filename = item.src.split("/").pop() || "";
      return filename.split("?")[0];
    }
    if ("name" in item && item.name) {
      return String(item.name);
    }
    return String(item.type);
  };

  const getItemClasses = () => {
    if (item.isLoading) {
      return "bg-blue-200/30 text-blue-600 dark:bg-blue-200/30 dark:text-blue-400";
    }
    
    switch (item.type) {
      case OverlayType.TEXT:
        return "bg-purple-200/30 text-white dark:bg-purple-200/30 dark:text-white";
      case OverlayType.STICKER:
        return "bg-pink-200/30 text-white dark:bg-pink-200/30 dark:text-white";
      case OverlayType.SOUND:
        return "bg-amber-200/80 text-gray-500 dark:bg-amber-200/80 dark:text-gray-500";
      case OverlayType.VIDEO:
        return "bg-purple-200/30 text-white dark:bg-purple-200/30 dark:text-white";
      case OverlayType.IMAGE:
        return "bg-emerald-100/80 text-emerald-900 dark:bg-emerald-700/90 dark:text-emerald-100";
      case OverlayType.CAPTION:
        return "bg-indigo-200/30 text-white dark:bg-indigo-200/30 dark:text-white";
      default:
        return "bg-gray-100/80 text-gray-900 dark:bg-gray-700/90 dark:text-gray-200";
    }
  };
  
  return (
    <div className="absolute inset-0 flex items-center z-20">
      {item.type !== OverlayType.CAPTION &&
        (item.type !== OverlayType.VIDEO || DISABLE_VIDEO_KEYFRAMES) && (
          <div
            className={`flex items-center text-[9px] rounded-[2px] px-1.5 py-0.5
        ${isSelected ? "mx-5" : "mx-2"} 
        group-hover:mx-5
        transition-all duration-200 ease-in-out
        ${getItemClasses()}`}
          >
            <div className="flex items-center gap-0.5">
              {/* Show loading spinner for loading overlays */}
              {item.isLoading ? (
                <div className="animate-spin w-2 h-2 border border-blue-600 border-t-transparent rounded-full mr-0.5" />
              ) : (
                getItemIcon(item.type)
              )}
              <span className="capitalize truncate max-w-[100px]">
                {getLabelContent()}
              </span>
            </div>
          </div>
        )}
    </div>
);
};
