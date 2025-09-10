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
  // Shared Images tab state
  const [sharedImages, setSharedImages] = useState<ApiImage[]>([]);
  const [filteredSharedImages, setFilteredSharedImages] = useState<ApiImage[]>([]);
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
  const [selectedImageType, setSelectedImageType] = useState('Text to Image');
  const [generatedZanopyImages, setGeneratedZanopyImages] = useState<ApiImage[]>([]);
  const [isLoadingZanopyGenerated, setIsLoadingZanopyGenerated] = useState(false);
  const [isLoadingMoreZanopy, setIsLoadingMoreZanopy] = useState(false);
  const [hasMoreZanopy, setHasMoreZanopy] = useState(true);
  const [currentPageZanopy, setCurrentPageZanopy] = useState(0);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  
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
  const [activeTab, setActiveTab] = useState("generated-zanopy");
  
  const aspectRatioOptions = [
    { label: "1:1", value: "1%3A1" },
    { label: "9:16", value: "9%3A16" },
    { label: "16:9", value: "16%3A9" }
  ];
  
  const imageTypeOptions = [
    { 
      label: 'Text to Image', 
      action: 'BLYNKK_AI_PUBLIC_IMAGE_LIBRARY'
    },
    { 
      label: 'Text to Logo', 
      action: 'BLYNKK_AI_PUBLIC_LOGO_LIBRARY'
    },
    { 
      label: 'Product Photography', 
      action: 'BLYNKK_AI_PUBLIC_PRODUCT_AD_LIBRARY'
    },
    { 
      label: 'Product Influencer', 
      action: 'GET_AI_AMBASSADOR_IMAGE_PROJECT'
    }
  ];

  // Extract URL parameters
  const getUrlParams = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const email = urlParams.get('email') || '';
      
      return {
        uid: urlParams.get('uid') || '',
        sid: urlParams.get('sid') || '',
        user_ref: email // Don't encode here - let URLSearchParams handle it
      };
    }
    return { uid: '', sid: '', user_ref: '' };
  };

  //SETTING THE API BASE URL
  const apiBaseUrl = 'https://zanopy.ai/vedit/api/latest';

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
      const response = await fetch(`${apiBaseUrl}/images/receive?start_from=${startFrom}&max_results=20&ratio=${ratioParam}&tags=${tagsParam}`);
      const data = await response.json();
      
      const newImages = data.images || [];
      
      if (append) {
        setSharedImages(prev => [...prev, ...newImages]);
        if (searchQueryShared.trim() === '') {
          setFilteredSharedImages(prev => [...prev, ...newImages]);
        }
      } else {
        setSharedImages(newImages);
        setFilteredSharedImages(newImages);
      }
      
      setHasMoreShared(newImages.length === 20);
      
    } catch (error) {
    } finally {
      if (append) {
        setIsLoadingMoreShared(false);
      } else {
        setIsLoadingShared(false);
      }
      setIsSearchingShared(false);
    }
  };
  const fetchGeneratedImages = async (startFrom = 0, append = false, ratio?: string, tags?: string, imageType?: string) => {
    if (append) {
      setIsLoadingMoreGenerated(true);
    } else {
      setIsLoadingGenerated(true);
    }
    
    try {
      const { user_ref, uid } = getUrlParams();
      
      // If user_ref exists and we're on zanopy tab, handle Zanopy logic inline
      if (user_ref && activeTab === "generated-zanopy") {
        if (append) {
          setIsLoadingMoreZanopy(true);
        } else {
          setIsLoadingZanopyGenerated(true);
        }
        
        // Use the most recent selectedImageType value
        const currentImageType = imageType || selectedImageType;
        const imageOption = imageTypeOptions.find(option => option.label === currentImageType);
        if (!imageOption) return;

        let baseUrl = '';
        const queryParams = new URLSearchParams();
        queryParams.append('do_action', imageOption.action);

        if (imageOption.label === 'Product Influencer') {
          baseUrl = 'https://zanopy.ai/process_request.php';
          queryParams.append('user_id', uid);
          queryParams.append('imageStatus', '1');
        } else if (imageOption.label === 'Text to Logo') {
          baseUrl = 'https://zanopy.ai/ai-images/process_request.php';
          queryParams.append('start_from', startFrom.toString());
          queryParams.append('max_results', '20');
          if (user_ref) queryParams.append('user_ref', decodeURIComponent(user_ref));
          if (tags) queryParams.append('tags', tags);
          if (ratio || aspectRatioGenerated) {
            const currentRatio = ratio || aspectRatioGenerated;
            const ratioValue = aspectRatioOptions.find(option => option.label === currentRatio)?.label || "1:1";
            queryParams.append('ratio', ratioValue); // Use the label (1:1) instead of pre-encoded value
          }
        } else {
          baseUrl = 'https://zanopy.ai/ai-images/process_request.php';
          queryParams.append('start_from', startFrom.toString());
          queryParams.append('max_results', '20');
          queryParams.append('type', 'image');
          queryParams.append('image_category', '');
          if (user_ref) queryParams.append('user_ref', user_ref);
          if (tags) queryParams.append('tags', tags);
          if (ratio || aspectRatioGenerated) {
            const currentRatio = ratio || aspectRatioGenerated;
            const ratioParam = aspectRatioOptions.find(option => option.label === currentRatio)?.value || "1%3A1";
            queryParams.append('ratio', ratioParam);
          }
        }

        const apiUrl = `${baseUrl}?${queryParams.toString()}`;

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
        });

        if (!response.ok) {
          console.error('Zanopy API error:', response.status, response.statusText);
          throw new Error(`Zanopy API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Handle the Zanopy API response structure
        let rawImages = [];
        
        // Check if the API returned success and has data
        if (data.RESULT === 'SUCCESS' && data.RESPONSE && Array.isArray(data.RESPONSE)) {
          rawImages = data.RESPONSE.reverse();
        } else if (data.images && Array.isArray(data.images)) {
          rawImages = data.images.reverse();
        } else if (data.projects && Array.isArray(data.projects)) {
          rawImages = data.projects.reverse();
        } else {
          // Handle error cases or no data
          rawImages = [];
        }
        
        const transformedImages = rawImages.map((item: any) => {
          // Handle different response structures based on image type
          if (currentImageType === 'Text to Logo') {
            return {
              id: item.logo_id || item.id,
              url: item.logo_url || item.url,
              thumbnail: item.logo_url || item.url,
              title: item.logo_prompt || item.title || `${currentImageType} Image`,
              tags: item.logo_tags || item.tags || ''
            };
          } else if (currentImageType === 'Product Photography') {
            return {
              id: item.product_id || item.id,
              url: item.org_url || item.jn_url || item.lg_url || item.url, // org_url is the main one
              thumbnail: item.jn_url || item.org_url || item.lg_url || item.url, // jn might be thumbnail
              title: item.scene_prompt || item.title || `${currentImageType} Image`,
              tags: item.scene_tags || item.product_type || item.tags || ''
            };
          } else if (currentImageType === 'Product Influencer') {
            return {
              id: item.project_id || item.id,
              url: item.output || item.url,
              thumbnail: item.output || item.url,
              title: item.user_prompt || item.title || `${currentImageType} Image`,
              tags: item.type || item.tags || ''
            };
          } else {
            // Default for Text to Image
            return {
              id: item.image_id || item.id,
              url: item.image_url || item.url,
              thumbnail: item.thumbnail || item.image_url || item.url,
              title: item.user_prompt || item.title || `${currentImageType} Image`,
              tags: item.image_tags || item.tags || ''
            };
          }
        });
        
        if (append) {
          setGeneratedZanopyImages(prev => {
            const newArray = [...prev, ...transformedImages];
            return newArray;
          });
        } else {
          setGeneratedZanopyImages(transformedImages);
        }
        
        // Continue loading if we got exactly 20 images, stop if we got less
        setHasMoreZanopy(transformedImages.length === 20);
        
        // If no images found and it's the first page, show appropriate message
        if (transformedImages.length === 0 && !append) {
        }
          return;
      }
      
      // Original shared images logic
      const currentRatio = ratio || aspectRatioGenerated;
      const ratioParam = aspectRatioOptions.find(option => option.label === currentRatio)?.value || "1%3A1";
      const tagsParam = tags ? encodeURIComponent(tags) : '';
      const response = await fetch(`${apiBaseUrl}/images/receive?start_from=${startFrom}&max_results=20&ratio=${ratioParam}&tags=${tagsParam}`);
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
      console.error('Error fetching Zanopy images:', error);
    } finally {
      const { user_ref } = getUrlParams();
      
      if (user_ref && activeTab === "generated-zanopy") {
        // Handle Zanopy-specific states
        if (append) {
          setIsLoadingMoreZanopy(false);
        } else {
          setIsLoadingZanopyGenerated(false);
        }
      } else {
        // Handle regular generated images states
        if (append) {
          setIsLoadingMoreGenerated(false);
        } else {
          setIsLoadingGenerated(false);
        }
      }
      setIsSearchingGenerated(false);
    }
  };

  const searchSharedImages = (query: string) => {
    setCurrentPageShared(0);
    setSharedImages([]);
    setFilteredSharedImages([]);
    setHasMoreShared(true);
    fetchSharedImages(0, false, aspectRatioShared, query.trim());
  };

  const searchGeneratedImages = (query: string) => {
    const { user_ref } = getUrlParams();
    if (user_ref && activeTab === "generated-zanopy") {
      setCurrentPageZanopy(0);
      setGeneratedZanopyImages([]);
      setHasMoreZanopy(true);
    } else {
      setCurrentPageGenerated(0);
      setGeneratedImages([]);
      setFilteredGeneratedImages([]);
      setHasMoreGenerated(true);
    }
    fetchGeneratedImages(0, false, aspectRatioGenerated, query.trim(), selectedImageType);
  };

  const handleSharedAspectRatioChange = (newRatio: string) => {
    setAspectRatioShared(newRatio);
    setCurrentPageShared(0);
    setSharedImages([]);
    setFilteredSharedImages([]);
    setHasMoreShared(true);
    fetchSharedImages(0, false, newRatio, searchQueryShared.trim());
  };

  const handleGeneratedAspectRatioChange = (newRatio: string) => {
    setAspectRatioGenerated(newRatio);
    const { user_ref } = getUrlParams();
    if (user_ref && activeTab === "generated-zanopy") {
      setCurrentPageZanopy(0);
      setGeneratedZanopyImages([]);
      setHasMoreZanopy(true);
      fetchGeneratedImages(0, false, newRatio, searchQueryGenerated.trim(), selectedImageType);
    } else {
      setCurrentPageGenerated(0);
      setGeneratedImages([]);
      setFilteredGeneratedImages([]);
      setHasMoreGenerated(true);
      fetchGeneratedImages(0, false, newRatio, searchQueryGenerated.trim(), selectedImageType);
    }
  };

  const handleImageTypeChange = (newType: string) => {
    setSelectedImageType(newType);
    setCurrentPageZanopy(0);
    setGeneratedZanopyImages([]);
    setHasMoreZanopy(true);
    
    // Pass the new type directly to avoid stale state
    fetchGeneratedImages(0, false, aspectRatioGenerated, searchQueryGenerated.trim(), newType);
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
      setFilteredSharedImages([]);
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
      const { user_ref } = getUrlParams();
      if (user_ref && activeTab === "generated-zanopy") {
        setCurrentPageZanopy(0);
        setGeneratedZanopyImages([]);
        setHasMoreZanopy(true);
        fetchGeneratedImages(0, false, aspectRatioGenerated, value.trim(), selectedImageType);
      } else {
        setCurrentPageGenerated(0);
        setGeneratedImages([]);
        setFilteredGeneratedImages([]);
        setHasMoreGenerated(true);
        fetchGeneratedImages(0, false, aspectRatioGenerated, value.trim(), selectedImageType);
      }
    }, 1000);
  };

  // Load more functions - fixed implementation based on old working version
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
      fetchGeneratedImages(nextPage * 20, true, aspectRatioGenerated, searchQueryGenerated.trim(), selectedImageType);
    }
  };

  const loadMoreZanopyImages = () => {
    if (!isLoadingMoreZanopy && hasMoreZanopy) {
      const nextPage = currentPageZanopy + 1;
      setCurrentPageZanopy(nextPage);
      fetchGeneratedImages(nextPage * 20, true, aspectRatioGenerated, searchQueryGenerated.trim(), selectedImageType);
    }
  };

  // Fixed scroll handlers based on old working version
  const handleSharedScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasMoreShared && !isLoadingMoreShared) {
      loadMoreSharedImages();
    }
  };

  const handleGeneratedScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const { user_ref } = getUrlParams();
    
    // Use the same logic as the old working version
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      if (user_ref && activeTab === "generated-zanopy") {
        if (hasMoreZanopy && !isLoadingMoreZanopy && !isLoadingZanopyGenerated) {
          loadMoreZanopyImages();
        }
      } else {
        if (hasMoreGenerated && !isLoadingMoreGenerated && !isLoadingGenerated) {
          loadMoreGeneratedImages();
        }
      }
    }
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

  // Helper function to get image's natural dimensions
  const getImageNaturalDimensions = (imageUrl: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      
      img.onerror = () => {
        // Fallback to editor dimensions if image can't be loaded
        resolve({ width: 400, height: 300 }); // Default fallback dimensions
      };
      
      img.src = imageUrl;
    });
  };

  /**
   * Adds a new image overlay to the editor
   * @param image - The selected Pexels image to add
   * Creates a new overlay with default positioning and animation settings
   */
  const handleAddImage = async (image: ApiImage) => {
    const { width, height } = await getImageNaturalDimensions(image.url);
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
        objectFit: "contain",
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
    <div className="flex flex-col gap-4 p-4 bg-gray-100/40 dark:bg-gray-900/40 h-full">
      {!localOverlay ? (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full grid grid-cols-2 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-sm border border-gray-200 dark:border-gray-700 gap-1 mb-2 flex-shrink-0">
              <TabsTrigger
                value="generated-zanopy"
                className="data-[state=active]:bg-[rgb(41,0,156)]/15 data-[state=active]:text-[rgb(41,0,156)] dark:data-[state=active]:text-white 
                rounded-sm transition-all duration-200 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
              >
                <span className="flex items-center gap-2 text-xs">Generated on Zanopy</span>
              </TabsTrigger>
              
              <TabsTrigger
                value="shared-images"
                className="data-[state=active]:bg-[rgb(41,0,156)]/15 data-[state=active]:text-[rgb(41,0,156)] dark:data-[state=active]:text-white 
                rounded-sm transition-all duration-200 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
              >
                <span className="flex items-center gap-2 text-xs">Shared Images</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generated-zanopy" className="flex-1 min-h-0 flex flex-col space-y-4">
              {/* <div className="flex flex-col gap-2 p-2 bg-background/50 rounded-md border border-border/50 mb-4 flex-shrink-0"> */}
                <div className="flex gap-2 flex-shrink-0">
                  <select
                    value={selectedImageType}
                    onChange={(e) => handleImageTypeChange(e.target.value)}
                    className="bg-background border border-border text-foreground rounded-md text-sm"
                    disabled={false}
                    style={{ pointerEvents: 'auto', zIndex: 10 }}
                  >
                    {imageTypeOptions.map((option) => (
                      <option key={option.label} value={option.label}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={aspectRatioGenerated}
                    onChange={(e) => handleGeneratedAspectRatioChange(e.target.value)}
                    className="bg-background border border-border text-foreground rounded-md px-3 py-2 text-sm"
                    disabled={false}
                    style={{ pointerEvents: 'auto', zIndex: 10 }}
                  >
                    {aspectRatioOptions.map((option) => (
                      <option key={option.label} value={option.label}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="default"
                    onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}
                    className="bg-background hover:bg-muted text-foreground border-border"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Expandable search row */}
                {isSearchDropdownOpen && (
                    <Input
                      placeholder="Search images..."
                      value={searchQueryGenerated}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-[rgb(41,0,156)]"
                      onChange={(e) => handleGeneratedSearchInputChange(e.target.value)}
                      style={{ fontSize: "16px" }}
                      autoFocus
                    />
                )}
              {/* </div> */}

              {/* Fixed scroll container structure based on old working version */}
              <div 
                className="grid grid-cols-2 gap-3 overflow-y-auto flex-1" 
                onScroll={handleGeneratedScroll}
              >
                {(() => {
                  const { user_ref } = getUrlParams();
                  const isLoading = user_ref && activeTab === "generated-zanopy" 
                    ? (isLoadingZanopyGenerated || isSearchingGenerated)
                    : (isLoadingGenerated || isSearchingGenerated);
                  return isLoading;
                })() ? (
                  Array.from({ length: 16 }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="relative aspect-video bg-muted animate-pulse rounded-sm"
                    />
                  ))
                ) : (() => {
                  const imagesToShow = generatedZanopyImages.length > 0 ? generatedZanopyImages : filteredGeneratedImages;
                  return imagesToShow.length > 0;
                })() ? (
                  <>
                    {(() => {
                      const imagesToShow = generatedZanopyImages.length > 0 ? generatedZanopyImages : filteredGeneratedImages;
                      return imagesToShow.map((image) => (
                        <button
                          key={image.id}
                          className="relative aspect-video cursor-pointer border border-border hover:border-foreground rounded-md"
                          onClick={() => handleAddImage(image)}
                        >
                          <div className="relative">
                            <img
                              src={image.thumbnail || image.url}
                              alt={image.title}
                              className="rounded-sm object-cover w-full h-full hover:opacity-60 transition-opacity duration-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIEVycm9yPC90ZXh0Pjwvc3ZnPg==';
                              }}
                            />
                            <div className="absolute inset-0 bg-background/20 opacity-0 hover:opacity-100 transition-opacity duration-200" />
                          </div>
                        </button>
                      ));
                    })()}
                    
                    {/* Load more indicator */}
                    {((generatedZanopyImages.length > 0 && isLoadingMoreZanopy) || 
                      (filteredGeneratedImages.length > 0 && isLoadingMoreGenerated)) && (
                      <div className="col-span-2 flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground"></div>
                      </div>
                    )}
                    
                    {/* No more content indicator */}
                    {((generatedZanopyImages.length > 0 && !hasMoreZanopy && !isLoadingMoreZanopy) ||
                      (filteredGeneratedImages.length > 0 && !hasMoreGenerated && !isLoadingMoreGenerated)) && (
                      <div className="col-span-2 text-center py-4 text-muted-foreground text-sm">
                        No more images to load
                      </div>
                    )}
                  </>
                ) : searchQueryGenerated.trim() ? (
                  <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Search className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No images found</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                        No {selectedImageType} images found for "{searchQueryGenerated}". Try different keywords or generate this image using Zanopy's Image generator.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="col-span-2 flex flex-col items-center justify-center py-8 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">No {selectedImageType} images found</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="shared-images" className="flex-1 min-h-0 flex flex-col space-y-4">
              <div className="flex gap-2 flex-shrink-0">
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
                  variant="default"
                  disabled={isLoadingShared}
                  className="bg-background hover:bg-muted text-foreground border-border"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {/* Fixed scroll container structure based on old working version */}
              <div 
                className="grid grid-cols-2 gap-3 overflow-y-auto flex-1" 
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
                  <>
                    {filteredSharedImages.map((image) => (
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
                    ))}
                    
                    {/* Load more indicator */}
                    {isLoadingMoreShared && (
                      <div className="col-span-2 flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground"></div>
                      </div>
                    )}
                    
                    {/* No more content indicator */}
                    {!hasMoreShared && !isLoadingMoreShared && filteredSharedImages.length >= 20 && (
                      <div className="col-span-2 text-center py-4 text-muted-foreground text-sm">
                        No more images to load
                      </div>
                    )}
                  </>
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
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="p-4">
          <ImageDetails
            localOverlay={localOverlay as ImageOverlay}
            setLocalOverlay={handleUpdateOverlay}
          />
        </div>
      )}
    </div>
  );
};