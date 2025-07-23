import React, { useRef, useState, useEffect } from "react";
import { SoundOverlay } from "../../../types";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SoundDetailsProps {
  localOverlay: SoundOverlay;
  setLocalOverlay: (overlay: SoundOverlay) => void;
}

export const SoundDetails: React.FC<SoundDetailsProps> = ({
  localOverlay,
  setLocalOverlay,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speedInputValue, setSpeedInputValue] = useState<string>('');
  const [fadeInInputValue, setFadeInInputValue] = useState<string>('');
  const [fadeOutInputValue, setFadeOutInputValue] = useState<string>('');

  // Initialize the input values when overlay changes
  useEffect(() => {
    setSpeedInputValue(String(localOverlay?.speed ?? 1));
  }, [localOverlay?.speed]);

  useEffect(() => {
    setFadeInInputValue(String(localOverlay?.styles?.fadeIn ?? 0));
  }, [localOverlay?.styles?.fadeIn]);

  useEffect(() => {
    setFadeOutInputValue(String(localOverlay?.styles?.fadeOut ?? 0));
  }, [localOverlay?.styles?.fadeOut]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    audioRef.current = new Audio(localOverlay.src);
    
    // Apply speed/playback rate immediately
    if (audioRef.current) {
      audioRef.current.playbackRate = localOverlay.speed ?? 1;
      audioRef.current.volume = localOverlay.styles?.volume ?? 1;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [localOverlay.src, localOverlay.speed]);

  // Add effect to handle fade in/out during playback
  useEffect(() => {
    if (!audioRef.current || !isPlaying) return;

    const audio = audioRef.current;
    const fadeInDuration = (localOverlay.styles?.fadeIn ?? 0) * 1000;
    const fadeOutDuration = (localOverlay.styles?.fadeOut ?? 0) * 1000;
    const originalVolume = localOverlay.styles?.volume ?? 1;

    let fadeInterval: NodeJS.Timeout;

    const handleFadeEffects = () => {
      const currentTime = audio.currentTime * 1000;
      const totalDuration = audio.duration * 1000;
      
      if (isNaN(totalDuration)) return;

      let targetVolume = originalVolume;

      // Fade in at the beginning
      if (fadeInDuration > 0 && currentTime < fadeInDuration) {
        targetVolume = originalVolume * (currentTime / fadeInDuration);
      }
      
      // Fade out at the end
      if (fadeOutDuration > 0 && currentTime > (totalDuration - fadeOutDuration)) {
        const fadeOutProgress = (totalDuration - currentTime) / fadeOutDuration;
        targetVolume = originalVolume * fadeOutProgress;
      }

      audio.volume = Math.max(0, Math.min(1, targetVolume));
    };

    fadeInterval = setInterval(handleFadeEffects, 50);

    return () => {
      if (fadeInterval) clearInterval(fadeInterval);
    };
  }, [isPlaying, localOverlay.styles?.fadeIn, localOverlay.styles?.fadeOut, localOverlay.styles?.volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    // Apply current settings
    audioRef.current.playbackRate = localOverlay.speed ?? 1;
    audioRef.current.volume = localOverlay.styles?.volume ?? 1;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current
        .play()
        .catch((error) => console.error("Error playing audio:", error));
    }
    setIsPlaying(!isPlaying);
  };

  const handleStyleChange = (updates: Partial<SoundOverlay["styles"]>) => {
    const updatedOverlay = {
      ...localOverlay,
      styles: {
        ...localOverlay.styles,
        ...updates,
      },
    };
    setLocalOverlay(updatedOverlay);
  };

  const handlePropertyChange = (updates: Partial<Pick<SoundOverlay, 'speed'>>) => {
    const updatedOverlay = {
      ...localOverlay,
      ...updates,
    };
    setLocalOverlay(updatedOverlay);
  };

  const handleSpeedChange = (newSpeed: number) => {
    if (localOverlay) {
      // Calculate new duration based on speed
      const originalDuration = localOverlay.durationInFrames * (localOverlay.speed ?? 1);
      const newDuration = Math.round(originalDuration / newSpeed);
      
      // Update both speed and duration
      const updatedOverlay = {
        ...localOverlay,
        speed: newSpeed,
        durationInFrames: newDuration,
      };
      
      setLocalOverlay(updatedOverlay);
      
      // If audio is currently playing, update its playback rate immediately
      if (audioRef.current) {
        audioRef.current.playbackRate = newSpeed;
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Sound Info with Play Button */}
      <div className="flex items-center gap-3 p-4 bg-background/50 rounded-md border">
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePlay}
          className="h-8 w-8 rounded-full bg-transparent hover:bg-accent text-foreground"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">
            {localOverlay.content}
          </p>
        </div>
      </div>

      <div className="space-y-4 mt-4">
        {/* Volume Settings */}
        <div className="space-y-4 rounded-md bg-background/50 p-4 border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Volume</h3>
            <button
              onClick={() =>
                handleStyleChange({
                  volume: localOverlay?.styles?.volume === 0 ? 1 : 0,
                })
              }
              className={`text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                (localOverlay?.styles?.volume ?? 1) === 0
                  ? "bg-primary/20 text-primary hover:bg-primary/30"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {(localOverlay?.styles?.volume ?? 1) === 0 ? "Unmute" : "Mute"}
            </button>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={localOverlay?.styles?.volume ?? 1}
              onChange={(e) =>
                handleStyleChange({ volume: parseFloat(e.target.value) })
              }
              className="flex-1 accent-primary h-1.5 rounded-full bg-muted"
            />
            <span className="text-xs text-muted-foreground min-w-[40px] text-right">
              {Math.round((localOverlay?.styles?.volume ?? 1) * 100)}%
            </span>
          </div>
        </div>

        {/* Speed Control */}
        <div className="space-y-4 rounded-md bg-background/50 p-4 border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Playback Speed</h3>
            <button
              onClick={() => handleSpeedChange(1)}
              className={`text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                (localOverlay?.speed ?? 1) !== 1
                  ? "bg-primary/20 text-primary hover:bg-primary/30"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              Reset
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.25"
                max="10"
                step="0.05"
                value={localOverlay?.speed ?? 1}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="flex-1 accent-primary h-1.5 rounded-full bg-muted"
              />
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.01"
                value={speedInputValue}
                onChange={(e) => setSpeedInputValue(e.target.value)}
                onBlur={(e) => {
                  const inputValue = e.target.value;
                  let numValue = parseFloat(inputValue);
                  
                  if (isNaN(numValue) || inputValue === '') {
                    numValue = 1;
                  }
                  
                  numValue = Math.max(0.1, Math.min(10, numValue));
                  handleSpeedChange(numValue);
                  setSpeedInputValue(String(numValue)); // Update input to show clamped value
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                className="w-16 px-2 py-1 text-xs bg-background border border-input rounded-md text-right"
              />
              <span className="text-xs text-muted-foreground">x</span>
            </div>
          </div>
        </div>

        {/* Fade Controls */}
        <div className="space-y-4 rounded-md bg-background/50 p-4 border">
          <h3 className="text-sm font-medium text-foreground">Fade Effects</h3>
          
          {/* Fade In */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Fade In Duration</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="30
                "
                step="0.1"
                value={localOverlay?.styles?.fadeIn ?? 0}
                onChange={(e) => handleStyleChange({ fadeIn: parseFloat(e.target.value) })}
                className="flex-1 accent-primary h-1.5 rounded-full bg-muted"
              />
              <input
                type="number"
                min="0"
                max="30"
                step="0.1"
                value={fadeInInputValue}
                onChange={(e) => setFadeInInputValue(e.target.value)}
                onBlur={(e) => {
                  const inputValue = e.target.value;
                  let numValue = parseFloat(inputValue);
                  
                  if (isNaN(numValue) || inputValue === '') {
                    numValue = 0;
                  }
                  
                  numValue = Math.max(0, Math.min(30, numValue));
                  handleStyleChange({ fadeIn: numValue });
                  setFadeInInputValue(String(numValue)); // Update input to show clamped value
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                className="w-16 px-2 py-1 text-xs bg-background border border-input rounded-md text-right"
              />

              <span className="text-xs text-muted-foreground">s</span>
            </div>
          </div>

          {/* Fade Out */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Fade Out Duration</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="30"
                step="0.1"
                value={localOverlay?.styles?.fadeOut ?? 0}
                onChange={(e) => handleStyleChange({ fadeOut: parseFloat(e.target.value) })}
                className="flex-1 accent-primary h-1.5 rounded-full bg-muted"
              />
              <input
                type="number"
                min="0"
                max="30"
                step="0.1"
                value={fadeOutInputValue}
                onChange={(e) => setFadeOutInputValue(e.target.value)}
                onBlur={(e) => {
                  const inputValue = e.target.value;
                  let numValue = parseFloat(inputValue);
                  
                  if (isNaN(numValue) || inputValue === '') {
                    numValue = 0;
                  }
                  
                  numValue = Math.max(0, Math.min(30, numValue));
                  handleStyleChange({ fadeOut: numValue });
                  setFadeOutInputValue(String(numValue)); // Update input to show clamped value
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                className="w-16 px-2 py-1 text-xs bg-background border border-input rounded-md text-right"
              />
              <span className="text-xs text-muted-foreground">s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};