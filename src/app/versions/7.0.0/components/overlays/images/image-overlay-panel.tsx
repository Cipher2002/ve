import { useState, useEffect, useRef, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useEditorContext } from "../../../contexts/editor-context";
import { useTimelinePositioning } from "../../../hooks/use-timeline-positioning";
import { useAspectRatio } from "../../../hooks/use-aspect-ratio";
import { useTimeline } from "../../../contexts/timeline-context";
import { ImageOverlay, Overlay, OverlayType } from "../../../types";
import { ImageDetails } from "./image-details";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ApiImage {
  id: number | string;
  url: string;
  thumbnail?: string;
  tags?: string;
  title?: string;
}

/**
 * ImageOverlayPanel Component
 *
 * A panel that provides functionality to:
 * 1. Search and select images from Pexels
 * 2. Add selected images as overlays to the editor
 * 3. Modify existing image overlay properties
 *
 * The panel has two main states:
 * - Search/Selection mode: Shows a search bar and grid of Pexels images
 * - Edit mode: Shows image details editor when an existing image overlay is selected
 */
export const ImageOverlayPanel: React.FC = () => {
  // const [searchQuery, setSearchQuery] = useState("");
  // Shared Images tab state
  const [sharedImages, setSharedImages] = useState<ApiImage[]>([]);
  const [filteredSharedImages, setFiltereredSharedImages] = useState<ApiImage[]>([]);
  const [isLoadingShared, setIsLoadingShared] = useState(false);
  const [isLoadingMoreShared, setIsLoadingMoreShared] = useState(false);
  const [isSearchingShared, setIsSearchingShared] = useState(false);
  const [hasMoreShared, setHasMoreShared] = useState(true);
  const [currentPageShared, setCurrentPageShared] = useState(0);
  const [aspectRatioShared, setAspectRatioShared] = useState<string>("1:1");
  const [searchQueryShared, setSearchQueryShared] = useState("");

  // Generated on Zanopy tab state
  const [generatedImages, setGeneratedImages] = useState<ApiImage[]>([]);
  const [filteredGeneratedImages, setFilteredGeneratedImages] = useState<ApiImage[]>([]);
  const [isLoadingGenerated, setIsLoadingGenerated] = useState(false);
  const [isLoadingMoreGenerated, setIsLoadingMoreGenerated] = useState(false);
  const [isSearchingGenerated, setIsSearchingGenerated] = useState(false);
  const [hasMoreGenerated, setHasMoreGenerated] = useState(true);
  const [currentPageGenerated, setCurrentPageGenerated] = useState(0);
  const [aspectRatioGenerated, setAspectRatioGenerated] = useState<string>("1:1");
  const [searchQueryGenerated, setSearchQueryGenerated] = useState("");
  const {
    addOverlay,
    overlays,
    durationInFrames,
    selectedOverlayId,
    changeOverlay,
  } = useEditorContext();
  const { findNextAvailablePosition } = useTimelinePositioning();
  const { getAspectRatioDimensions } = useAspectRatio();
  const { visibleRows } = useTimeline();
  const [localOverlay, setLocalOverlay] = useState<Overlay | null>(null);
  const hasInitializedShared = useRef(false);
  const hasInitializedGenerated = useRef(false);
  const searchTimeoutShared = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutGenerated = useRef<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState("shared-images");
  const aspectRatioOptions = [
    { label: "1:1", value: "1%3A1" },
    { label: "9:16", value: "9%3A16" },
    { label: "16:9", value: "16%3A9" }
  ];

  const fetchSharedImages = async (startFrom = 0, append = false, ratio?: string, tags?: string) => {
    if (append) {
      setIsLoadingMoreShared(true);
    } else {
      setIsLoadingShared(true);
    }
    
    try {
      const currentRatio = ratio || aspectRatioShared;
      const ratioParam = aspectRatioOptions.find(option => option.label === currentRatio)?.value || "1%3A1";
      const tagsParam = tags ? encodeURIComponent(tags) : '';
      const response = await fetch(`/api/latest/images/receive?start_from=${startFrom}&max_results=20&ratio=${ratioParam}&tags=${tagsParam}`);
      const data = await response.json();
      
      const newImages = data.images || [];
      
      if (append) {
        setSharedImages(prev => [...prev, ...newImages]);
        if (searchQueryShared.trim() === '') {
          setFiltereredSharedImages(prev => [...prev, ...newImages]);
        }
      } else {
        setSharedImages(newImages);
        setFiltereredSharedImages(newImages);
      }
      
      setHasMoreShared(newImages.length === 20);
      
    } catch (error) {
      console.error('Failed to fetch shared images:', error);
    } finally {
      if (append) {
        setIsLoadingMoreShared(false);
      } else {
        setIsLoadingShared(false);
      }
      setIsSearchingShared(false);
    }
  };

  const fetchGeneratedImages = async (startFrom = 0, append = false, ratio?: string, tags?: string) => {
    if (append) {
      setIsLoadingMoreGenerated(true);
    } else {
      setIsLoadingGenerated(true);
    }
    
    try {
      // TODO: Replace with actual generated images API
      const currentRatio = ratio || aspectRatioGenerated;
      const ratioParam = aspectRatioOptions.find(option => option.label === currentRatio)?.value || "1%3A1";
      const tagsParam = tags ? encodeURIComponent(tags) : '';
      const response = await fetch(`/api/latest/images/receive?start_from=${startFrom}&max_results=20&ratio=${ratioParam}&tags=${tagsParam}`);
      const data = await response.json();
      
      const newImages = data.images || [];
      
      if (append) {
        setGeneratedImages(prev => [...prev, ...newImages]);
        if (searchQueryGenerated.trim() === '') {
          setFilteredGeneratedImages(prev => [...prev, ...newImages]);
        }
      } else {
        setGeneratedImages(newImages);
        setFilteredGeneratedImages(newImages);
      }
      
      setHasMoreGenerated(newImages.length === 20);
      
    } catch (error) {
      console.error('Failed to fetch generated images:', error);
    } finally {
      if (append) {
        setIsLoadingMoreGenerated(false);
      } else {
        setIsLoadingGenerated(false);
      }
      setIsSearchingGenerated(false);
    }
  };

  const searchSharedImages = (query: string) => {
    setCurrentPageShared(0);
    setSharedImages([]);
    setFiltereredSharedImages([]);
    setHasMoreShared(true);
    fetchSharedImages(0, false, aspectRatioShared, query.trim());
  };

  const searchGeneratedImages = (query: string) => {
    setCurrentPageGenerated(0);
    setGeneratedImages([]);
    setFilteredGeneratedImages([]);
    setHasMoreGenerated(true);
    fetchGeneratedImages(0, false, aspectRatioGenerated, query.trim());
  };

  const handleSharedAspectRatioChange = (newRatio: string) => {
    setAspectRatioShared(newRatio);
    setCurrentPageShared(0);
    setSharedImages([]);
    setFiltereredSharedImages([]);
    setHasMoreShared(true);
    fetchSharedImages(0, false, newRatio, searchQueryShared.trim());
  };

  const handleGeneratedAspectRatioChange = (newRatio: string) => {
    setAspectRatioGenerated(newRatio);
    setCurrentPageGenerated(0);
    setGeneratedImages([]);
    setFilteredGeneratedImages([]);
    setHasMoreGenerated(true);
    fetchGeneratedImages(0, false, newRatio, searchQueryGenerated.trim());
  };

  const handleSharedSearchInputChange = (value: string) => {
    setSearchQueryShared(value);
    
    // Clear existing timeout
    if (searchTimeoutShared.current) {
      clearTimeout(searchTimeoutShared.current);
    }
    
    // Show search loader if there's a query
    if (value.trim()) {
      setIsSearchingShared(true);
    } else {
      setIsSearchingShared(false);
    }
    
    // Set new timeout for 1000ms delay
    searchTimeoutShared.current = setTimeout(() => {
      setCurrentPageShared(0);
      setSharedImages([]);
      setFiltereredSharedImages([]);
      setHasMoreShared(true);
      fetchSharedImages(0, false, aspectRatioShared, value.trim());
    }, 1000);
  };

  const handleGeneratedSearchInputChange = (value: string) => {
    setSearchQueryGenerated(value);
    
    // Clear existing timeout
    if (searchTimeoutGenerated.current) {
      clearTimeout(searchTimeoutGenerated.current);
    }
    
    // Show search loader if there's a query
    if (value.trim()) {
      setIsSearchingGenerated(true);
    } else {
      setIsSearchingGenerated(false);
    }
    
    // Set new timeout for 1000ms delay
    searchTimeoutGenerated.current = setTimeout(() => {
      setCurrentPageGenerated(0);
      setGeneratedImages([]);
      setFilteredGeneratedImages([]);
      setHasMoreGenerated(true);
      fetchGeneratedImages(0, false, aspectRatioGenerated, value.trim());
    }, 1000);
  };

  const loadMoreSharedImages = () => {
    if (!isLoadingMoreShared && hasMoreShared) {
      const nextPage = currentPageShared + 1;
      setCurrentPageShared(nextPage);
      fetchSharedImages(nextPage * 20, true, aspectRatioShared, searchQueryShared.trim());
    }
  };

  const loadMoreGeneratedImages = () => {
    if (!isLoadingMoreGenerated && hasMoreGenerated) {
      const nextPage = currentPageGenerated + 1;
      setCurrentPageGenerated(nextPage);
      fetchGeneratedImages(nextPage * 20, true, aspectRatioGenerated, searchQueryGenerated.trim());
    }
  };

  const handleSharedScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasMoreShared && !isLoadingMoreShared) {
      loadMoreSharedImages();
    }
  };

  const handleGeneratedScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasMoreGenerated && !isLoadingMoreGenerated) {
      loadMoreGeneratedImages();
    }
  };

  const handleSharedSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchSharedImages(searchQueryShared);
  };

  const handleGeneratedSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchGeneratedImages(searchQueryGenerated);
  };

  useEffect(() => {
    if (!hasInitializedShared.current && activeTab === "shared-images") {
      hasInitializedShared.current = true;
      fetchSharedImages();
    }
    if (!hasInitializedGenerated.current && activeTab === "generated-zanopy") {
      hasInitializedGenerated.current = true;
      fetchGeneratedImages();
    }
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (searchTimeoutShared.current) {
        clearTimeout(searchTimeoutShared.current);
      }
      if (searchTimeoutGenerated.current) {
        clearTimeout(searchTimeoutGenerated.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedOverlayId === null) {
      setLocalOverlay(null);
      return;
    }

    const selectedOverlay = overlays.find(
      (overlay) => overlay.id === selectedOverlayId
    );

    if (selectedOverlay?.type === OverlayType.IMAGE) {
      setLocalOverlay(selectedOverlay);
    }
  }, [selectedOverlayId, overlays]);

  /**
   * Handles the image search form submission
   * Triggers the Pexels API call with the current search query
   */
  // const handleSearch = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   searchImages(searchQuery);
  // };

  /**
   * Adds a new image overlay to the editor
   * @param image - The selected Pexels image to add
   * Creates a new overlay with default positioning and animation settings
   */
  const handleAddImage = (image: ApiImage) => {
    const { width, height } = getAspectRatioDimensions();
    const { from, row } = findNextAvailablePosition(
      overlays,
      visibleRows,
      durationInFrames
    );

    const newOverlay: Overlay = {
      left: 0,
      top: 0,
      width,
      height,
      durationInFrames: 200,
      from,
      id: Date.now(),
      rotation: 0,
      row,
      isDragging: false,
      type: OverlayType.IMAGE,
      src: image.url,
      styles: {
        objectFit: "cover",
        animation: {
          enter: "fadeIn",
          exit: "fadeOut",
        },
      },
    };


    addOverlay(newOverlay);
  };

  /**
   * Updates an existing image overlay's properties
   * @param updatedOverlay - The modified overlay object
   * Updates both local state and global editor context
   */
  const handleUpdateOverlay = (updatedOverlay: Overlay) => {
    setLocalOverlay(updatedOverlay);
    changeOverlay(updatedOverlay.id, updatedOverlay);
  };
  return (
    <div className="flex flex-col gap-2 p-2 sm:gap-4 sm:p-4 bg-gray-100/40 dark:bg-gray-900/40 h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full grid grid-cols-2 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-sm border border-gray-200 dark:border-gray-700 gap-1 mb-2 flex-shrink-0">
          <TabsTrigger
            value="shared-images"
            className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white 
            rounded-sm transition-all duration-200 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
          >
            <span className="flex items-center gap-2 text-xs">Shared Images</span>
          </TabsTrigger>
          <TabsTrigger
            value="generated-zanopy"
            className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white 
            rounded-sm transition-all duration-200 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
          >
            <span className="flex items-center gap-2 text-xs">Generated on Zanopy</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shared-images" className="flex-1 min-h-0 flex flex-col space-y-4">
          {!localOverlay ? (
            <>
              <form onSubmit={handleSharedSearch} className="flex gap-2">
                <select
                  value={aspectRatioShared}
                  onChange={(e) => handleSharedAspectRatioChange(e.target.value)}
                  className="bg-background border border-border text-foreground rounded-md px-3 py-2 text-sm"
                  disabled={isLoadingShared}
                >
                  {aspectRatioOptions.map((option) => (
                    <option key={option.label} value={option.label}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Search images..."
                  value={searchQueryShared}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-blue-400"
                  onChange={(e) => handleSharedSearchInputChange(e.target.value)}
                  style={{ fontSize: "16px" }}
                />
                <Button
                  type="submit"
                  variant="default"
                  disabled={isLoadingShared}
                  className="bg-background hover:bg-muted text-foreground border-border"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              <div 
                className="grid grid-cols-2 gap-3 overflow-y-auto max-h" 
                onScroll={handleSharedScroll}
              >
                {isLoadingShared || isSearchingShared ? (
                  Array.from({ length: 16 }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="relative aspect-video bg-muted animate-pulse rounded-sm"
                    />
                  ))
                ) : filteredSharedImages.length > 0 ? (
                  filteredSharedImages.map((image) => (
                    <button
                      key={image.id}
                      className="relative aspect-video cursor-pointer border border-border hover:border-foreground rounded-md"
                      onClick={() => handleAddImage(image)}
                    >
                      <div className="relative">
                        <img
                          src={image.thumbnail || image.url}
                          alt={`Image thumbnail ${image.id}`}
                          className="rounded-sm object-cover w-full h-full hover:opacity-60 transition-opacity duration-200"
                          onError={(e) => {
                            const button = (e.target as HTMLImageElement).closest('button');
                            if (button) {
                              button.style.display = 'none';
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-background/20 opacity-0 hover:opacity-100 transition-opacity duration-200" />
                      </div>
                    </button>
                  ))
                ) : searchQueryShared.trim() ? (
                  <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Search className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No images found</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                        Couldn't find any images matching "{searchQueryShared}". Try creating this image using Zanopy's Image generator.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="col-span-2 flex flex-col items-center justify-center py-8 text-muted-foreground"></div>
                )}

                {isLoadingMoreShared  && (
                  <div className="col-span-2 flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground"></div>
                  </div>
                )}

                {!hasMoreShared  && filteredSharedImages.length > 0 && (
                  <div className="col-span-2 text-center py-4 text-muted-foreground text-sm">
                    No more images to load
                  </div>
                )}
              </div>
            </>
          ) : (
            <ImageDetails
              localOverlay={localOverlay as ImageOverlay}
              setLocalOverlay={handleUpdateOverlay}
            />
          )}
        </TabsContent>

        <TabsContent value="generated-zanopy" className="flex-1 min-h-0 flex flex-col space-y-4">
          {!localOverlay ? (
            <>
              <form onSubmit={handleGeneratedSearch} className="flex gap-2">
                <select
                  value={aspectRatioGenerated}
                  onChange={(e) => handleGeneratedAspectRatioChange(e.target.value)}
                  className="bg-background border border-border text-foreground rounded-md px-3 py-2 text-sm"
                  disabled={isLoadingGenerated}
                >
                  {aspectRatioOptions.map((option) => (
                    <option key={option.label} value={option.label}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Search images..."
                  value={searchQueryGenerated}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-blue-400"
                  onChange={(e) => handleGeneratedSearchInputChange(e.target.value)}
                  style={{ fontSize: "16px" }}
                />
                <Button
                  type="submit"
                  variant="default"
                  disabled={isLoadingGenerated}
                  className="bg-background hover:bg-muted text-foreground border-border"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              <div 
                className="grid grid-cols-2 gap-3 overflow-y-auto max-h" 
                onScroll={handleGeneratedScroll}
              >
                {isLoadingGenerated || isSearchingGenerated ? (
                  Array.from({ length: 16 }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="relative aspect-video bg-muted animate-pulse rounded-sm"
                    />
                  ))
                ) : filteredGeneratedImages.length > 0 ? (
                  filteredGeneratedImages.map((image) => (
                    <button
                      key={image.id}
                      className="relative aspect-video cursor-pointer border border-border hover:border-foreground rounded-md"
                      onClick={() => handleAddImage(image)}
                    >
                      <div className="relative">
                        <img
                          src={image.thumbnail || image.url}
                          alt={`Image thumbnail ${image.id}`}
                          className="rounded-sm object-cover w-full h-full hover:opacity-60 transition-opacity duration-200"
                          onError={(e) => {
                            const button = (e.target as HTMLImageElement).closest('button');
                            if (button) {
                              button.style.display = 'none';
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-background/20 opacity-0 hover:opacity-100 transition-opacity duration-200" />
                      </div>
                    </button>
                  ))
                ) : searchQueryGenerated.trim() ? (
                  <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Search className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No images found</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                        Couldn't find any images matching "{searchQueryGenerated}". Try creating this image using Zanopy's AI generator.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="col-span-2 flex flex-col items-center justify-center py-8 text-muted-foreground"></div>
                )}

                {isLoadingMoreGenerated && (
                  <div className="col-span-2 flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground"></div>
                  </div>
                )}

                {!hasMoreGenerated  && filteredGeneratedImages.length > 0 && (
                  <div className="col-span-2 text-center py-4 text-muted-foreground text-sm">
                    No more images to load
                  </div>
                )}
              </div>
            </>
          ) : (
            <ImageDetails
              localOverlay={localOverlay as ImageOverlay}
              setLocalOverlay={handleUpdateOverlay}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

};
