import React, { useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StickerOverlay } from "../../../types";
import { useEditorContext } from "../../../contexts/editor-context";
import { StickerStylePanel } from "./sticker-style-panel";
import { StickerSettingsPanel } from "./sticker-settings-panel";
import { useDebouncedCallback } from "use-debounce";

interface StickerDetailsProps {
  localOverlay: StickerOverlay;
  setLocalOverlay: (overlay: StickerOverlay) => void;
}

export const StickerDetails: React.FC<StickerDetailsProps> = ({
  localOverlay,
  setLocalOverlay,
}) => {
  const { selectedOverlayId, changeOverlay } = useEditorContext();
  const previousOverlayRef = useRef<StickerOverlay | null>(null);

  // Debounced function to update the overlay in context
  const debouncedUpdateOverlay = useDebouncedCallback((updatedOverlay: StickerOverlay) => {
    if (selectedOverlayId !== null) {
      changeOverlay(selectedOverlayId, () => updatedOverlay);
    }
  }, 100);

  // Apply changes to context when local overlay changes
  useEffect(() => {
    if (
      localOverlay &&
      previousOverlayRef.current &&
      JSON.stringify(localOverlay) !== JSON.stringify(previousOverlayRef.current)
    ) {
      debouncedUpdateOverlay(localOverlay);
    }
    previousOverlayRef.current = localOverlay;
  }, [localOverlay, debouncedUpdateOverlay]);

  const handleStyleChange = (field: string, value: any) => {
    setLocalOverlay({
      ...localOverlay,
      [field]: value,
    } as StickerOverlay);
  };

  // Check if this is a shape sticker
  const isShapeSticker = localOverlay.category === "Shapes";

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">
          {isShapeSticker ? "Shape Properties" : "Sticker Properties"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isShapeSticker 
            ? "Customize your shape appearance and animations"
            : "Customize your sticker appearance and animations"
          }
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="style" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="settings">Animation</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="style" className="h-full m-0">
              <div className="h-full overflow-y-auto p-4">
                <StickerStylePanel
                  localOverlay={localOverlay}
                  handleStyleChange={handleStyleChange}
                />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="h-full m-0">
              <div className="h-full overflow-y-auto p-4">
                <StickerSettingsPanel
                  localOverlay={localOverlay}
                  handleStyleChange={handleStyleChange}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};