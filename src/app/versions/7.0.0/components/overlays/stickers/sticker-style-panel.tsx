import React from "react";
import { StickerOverlay } from "../../../types";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import ColorPicker from "react-best-gradient-color-picker";

interface StickerStylePanelProps {
  localOverlay: StickerOverlay;
  handleStyleChange: (field: string, value: any) => void;
}

export const StickerStylePanel: React.FC<StickerStylePanelProps> = ({
  localOverlay,
  handleStyleChange,
}) => {
  const [isShapePropsOpen, setIsShapePropsOpen] = React.useState(true);
  const [isShadowOpen, setIsShadowOpen] = React.useState(false);

  const isShapeSticker = localOverlay.category === "Shapes";

  // For non-shape stickers, show basic properties
  if (!isShapeSticker) {
    return (
      <div className="space-y-4">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">
            This sticker doesn't have customizable properties.
          </p>
        </div>
      </div>
    );
  }

  // Get current style values with defaults for shapes
  const fillColor = localOverlay.fillColor || "#3B82F6";
  const strokeColor = localOverlay.strokeColor || "#1E40AF";
  const strokeWidth = localOverlay.strokeWidth !== undefined ? localOverlay.strokeWidth : 0;
  const strokeStyle = localOverlay.strokeStyle || "solid";
  const shadowColor = localOverlay.shadowColor || "rgba(0,0,0,0.2)";
  const shadowBlur = localOverlay.shadowBlur !== undefined ? localOverlay.shadowBlur : 0;
  const shadowOffsetX = localOverlay.shadowOffsetX !== undefined ? localOverlay.shadowOffsetX : 0;
  const shadowOffsetY = localOverlay.shadowOffsetY !== undefined ? localOverlay.shadowOffsetY : 0;

  return (
    <div className="space-y-4">
      {/* Shape Properties */}
      <div className="rounded-md bg-background/50 border">
        <button
          onClick={() => setIsShapePropsOpen(!isShapePropsOpen)}
          className="w-full flex items-center justify-between p-4 text-sm font-medium hover:bg-accent/50 rounded-t-md"
        >
          <span>Shape Properties</span>
          {isShapePropsOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        
        {isShapePropsOpen && (
          <div className="space-y-4 p-4 pt-0">
            {/* Colors */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Colors</h4>
              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Fill Color</label>
                  <input
                    type="color"
                    value={fillColor || "#ffffff"} // default to white if fillColor is empty
                    onChange={(e) => handleStyleChange("fillColor", e.target.value)}
                    className="h-8 w-full rounded-md border cursor-pointer p-0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Stroke Color</label>
                  <input
                    type="color"
                    value={strokeColor || "#000000"} // default to black if strokeColor is empty
                    onChange={(e) => handleStyleChange("strokeColor", e.target.value)}
                    className="h-8 w-full rounded-md border cursor-pointer p-0"
                  />
                </div>

              </div>
            </div>

            {/* Sticker Opacity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Sticker Opacity</label>
                <span className="text-xs text-muted-foreground min-w-[40px] text-right">
                  {Math.round((localOverlay?.stickerOpacity ?? 1) * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round((localOverlay?.stickerOpacity ?? 1) * 100)}
                  onChange={(e) => {
                    handleStyleChange("stickerOpacity", parseInt(e.target.value) / 100);
                  }}
                  className="flex-1 accent-primary h-1.5 rounded-full bg-muted"
                />
              </div>
            </div>

            {/* Stroke Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Stroke</h4>
              
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Stroke Width</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={strokeWidth}
                    onChange={(e) => handleStyleChange("strokeWidth", parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="1"
                    value={strokeWidth}
                    onChange={(e) => handleStyleChange("strokeWidth", parseInt(e.target.value))}
                    className="w-16 px-2 py-1 text-xs border rounded"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Stroke Style</label>
                <select
                  value={strokeStyle}
                  onChange={(e) => handleStyleChange("strokeStyle", e.target.value)}
                  className="w-full px-2 py-1 text-xs border rounded bg-background"
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Shadow Settings */}
      <div className="rounded-md bg-background/50 border">
        <button
          onClick={() => setIsShadowOpen(!isShadowOpen)}
          className="w-full flex items-center justify-between p-4 text-sm font-medium hover:bg-accent/50 rounded-t-md"
        >
          <span>Drop Shadow</span>
          {isShadowOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        
        {isShadowOpen && (
          <div className="space-y-4 p-4 pt-0">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Offset X (px)</label>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="1"
                  value={shadowOffsetX}
                  onChange={(e) => handleStyleChange("shadowOffsetX", parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Offset Y (px)</label>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="1"
                  value={shadowOffsetY}
                  onChange={(e) => handleStyleChange("shadowOffsetY", parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Blur (px)</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={shadowBlur}
                  onChange={(e) => handleStyleChange("shadowBlur", parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Color</label>
                <input
                  type="color"
                  value={shadowColor || "#000000"} // default to black if shadowColor is empty
                  onChange={(e) => handleStyleChange("shadowColor", e.target.value)}
                  className="h-6 w-full rounded border cursor-pointer p-0"
                />
              </div>

            </div>
            
            <button
              onClick={() => {
                handleStyleChange("shadowBlur", 0);
                handleStyleChange("shadowOffsetX", 0);
                handleStyleChange("shadowOffsetY", 0);
              }}
              className="w-full px-2 py-1 text-xs border rounded hover:bg-accent"
            >
              Remove Shadow
            </button>
          </div>
        )}
      </div>
    </div>
  );
};