import { interpolate } from "remotion";

export type AnimationTemplate = {
  name: string;
  preview: string;
  isPro?: boolean;
  directions?: string[]; // Add directions array
  enter: (
    frame: number,
    durationInFrames: number,
    direction?: string
  ) => {
    transform?: string;
    opacity?: number;
    filter?: string;
    clipPath?: string;
  };
  exit: (
    frame: number,
    durationInFrames: number,
    direction?: string
  ) => {
    transform?: string;
    opacity?: number;
    filter?: string;
    clipPath?: string;
  };
};

export const animationTemplates: Record<string, AnimationTemplate> = {
  fade: {
    name: "Fade",
    preview: "Simple fade in/out",
    enter: (frame) => ({
      opacity: interpolate(frame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
      }),
    }),
    exit: (frame, duration) => ({
      opacity: interpolate(frame, [duration - 15, duration], [1, 0], {
        extrapolateLeft: "clamp",
      }),
    }),
  },
  slide: {
    name: "Slide",
    preview: "Slide in from direction",
    isPro: true,
    directions: ["left", "right", "top", "bottom"],
    enter: (frame, duration, direction = "right") => {
      const directions: Record<string, [number, number]> = {
        left: [-100, 0],
        right: [100, 0],
        top: [0, -100],
        bottom: [0, 100],
      };
      const [startX, startY] = direction === "left" || direction === "right" 
        ? [directions[direction][0], 0]
        : [0, directions[direction][1]];
      
      return {
        transform: direction === "left" || direction === "right"
          ? `translateX(${interpolate(frame, [0, 15], [startX, 0], {
              extrapolateRight: "clamp",
            })}%)`
          : `translateY(${interpolate(frame, [0, 15], [startY, 0], {
              extrapolateRight: "clamp",
            })}%)`,
        opacity: interpolate(frame, [0, 15], [0, 1], {
          extrapolateRight: "clamp",
        }),
      };
    },
    exit: (frame, duration, direction = "right") => {
      const directions: Record<string, [number, number]> = {
        left: [0, 100],
        right: [0, -100],
        top: [0, 100],
        bottom: [0, -100],
      };
      const [startPos, endPos] = direction === "left" || direction === "right"
        ? [directions[direction][0], directions[direction][1]]
        : [directions[direction][0], directions[direction][1]];
      
      return {
        transform: direction === "left" || direction === "right"
          ? `translateX(${interpolate(
              frame,
              [duration - 15, duration],
              [startPos, endPos],
              { extrapolateLeft: "clamp" }
            )}%)`
          : `translateY(${interpolate(
              frame,
              [duration - 15, duration],
              [startPos, endPos],
              { extrapolateLeft: "clamp" }
            )}%)`,
        opacity: interpolate(frame, [duration - 15, duration], [1, 0], {
          extrapolateLeft: "clamp",
        }),
      };
    },
  },
  scale: {
    name: "Scale",
    preview: "Scale in/out",
    enter: (frame) => ({
      transform: `scale(${interpolate(frame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
      })})`,
      opacity: interpolate(frame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
      }),
    }),
    exit: (frame, duration) => ({
      transform: `scale(${interpolate(
        frame,
        [duration - 15, duration],
        [1, 0],
        { extrapolateLeft: "clamp" }
      )})`,
      opacity: interpolate(frame, [duration - 15, duration], [1, 0], {
        extrapolateLeft: "clamp",
      }),
    }),
  },
  bounce: {
    name: "Bounce",
    preview: "Elastic bounce entrance",
    isPro: true,
    directions: ["left", "right", "top", "bottom"],
    enter: (frame, duration, direction = "bottom") => {
      const isHorizontal = direction === "left" || direction === "right";
      const multiplier = direction === "left" || direction === "top" ? -1 : 1;
      
      return {
        transform: isHorizontal
          ? `translateX(${interpolate(
              frame,
              [0, 10, 13, 15],
              [100 * multiplier, -10 * multiplier, 5 * multiplier, 0],
              { extrapolateRight: "clamp" }
            )}px)`
          : `translateY(${interpolate(
              frame,
              [0, 10, 13, 15],
              [100 * multiplier, -10 * multiplier, 5 * multiplier, 0],
              { extrapolateRight: "clamp" }
            )}px)`,
        opacity: interpolate(frame, [0, 10], [0, 1], {
          extrapolateRight: "clamp",
        }),
      };
    },
    exit: (frame, duration, direction = "bottom") => {
      const isHorizontal = direction === "left" || direction === "right";
      const multiplier = direction === "left" || direction === "top" ? -1 : 1;
      
      return {
        transform: isHorizontal
          ? `translateX(${interpolate(
              frame,
              [duration - 15, duration - 13, duration - 10, duration],
              [0, 5 * multiplier, -10 * multiplier, 100 * multiplier],
              { extrapolateLeft: "clamp" }
            )}px)`
          : `translateY(${interpolate(
              frame,
              [duration - 15, duration - 13, duration - 10, duration],
              [0, 5 * multiplier, -10 * multiplier, 100 * multiplier],
              { extrapolateLeft: "clamp" }
            )}px)`,
        opacity: interpolate(frame, [duration - 10, duration], [1, 0], {
          extrapolateLeft: "clamp",
        }),
      };
    },
  },
  flip: {
    name: "Flip",
    preview: "3D flip animation",
    isPro: true,
    directions: ["horizontal", "vertical"],
    enter: (frame, duration, direction = "horizontal") => ({
      transform: direction === "horizontal"
        ? `perspective(400px) rotateX(${interpolate(
            frame,
            [0, 15],
            [90, 0],
            { extrapolateRight: "clamp" }
          )}deg)`
        : `perspective(400px) rotateY(${interpolate(
            frame,
            [0, 15],
            [90, 0],
            { extrapolateRight: "clamp" }
          )}deg)`,
      opacity: interpolate(frame, [0, 5, 15], [0, 0.7, 1], {
        extrapolateRight: "clamp",
      }),
    }),
    exit: (frame, duration, direction = "horizontal") => ({
      transform: direction === "horizontal"
        ? `perspective(400px) rotateX(${interpolate(
            frame,
            [duration - 15, duration],
            [0, -90],
            { extrapolateLeft: "clamp" }
          )}deg)`
        : `perspective(400px) rotateY(${interpolate(
            frame,
            [duration - 15, duration],
            [0, -90],
            { extrapolateLeft: "clamp" }
          )}deg)`,
      opacity: interpolate(
        frame,
        [duration - 15, duration - 5, duration],
        [1, 0.7, 0],
        {
          extrapolateLeft: "clamp",
        }
      ),
    }),
  },
  zoomBlur: {
    name: "Zoom",
    preview: "Zoom with blur effect",
    isPro: true,
    enter: (frame) => ({
      transform: `scale(${interpolate(frame, [0, 15], [1.5, 1], {
        extrapolateRight: "clamp",
      })})`,
      opacity: interpolate(frame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
      }),
      filter: `blur(${interpolate(frame, [0, 15], [10, 0], {
        extrapolateRight: "clamp",
      })}px)`,
    }),
    exit: (frame, duration) => ({
      transform: `scale(${interpolate(
        frame,
        [duration - 15, duration],
        [1, 1.5],
        { extrapolateLeft: "clamp" }
      )})`,
      opacity: interpolate(frame, [duration - 15, duration], [1, 0], {
        extrapolateLeft: "clamp",
      }),
      filter: `blur(${interpolate(frame, [duration - 15, duration], [0, 10], {
        extrapolateLeft: "clamp",
      })}px)`,
    }),
  },
  snapRotate: {
    name: "Snap",
    preview: "Quick rotate with snap",
    isPro: true,
    directions: ["clockwise", "counter-clockwise"],
    enter: (frame, duration, direction = "clockwise") => {
      const multiplier = direction === "clockwise" ? 1 : -1;
      return {
        transform: `rotate(${interpolate(frame, [0, 8, 12, 15], [-10 * multiplier, 5 * multiplier, -2 * multiplier, 0], {
          extrapolateRight: "clamp",
        })}deg) scale(${interpolate(frame, [0, 15], [0.8, 1], {
          extrapolateRight: "clamp",
        })})`,
        opacity: interpolate(frame, [0, 10], [0, 1], {
          extrapolateRight: "clamp",
        }),
      };
    },
    exit: (frame, duration, direction = "clockwise") => {
      const multiplier = direction === "clockwise" ? 1 : -1;
      return {
        transform: `rotate(${interpolate(
          frame,
          [duration - 15, duration - 12, duration - 8, duration],
          [0, -2 * multiplier, 5 * multiplier, -10 * multiplier],
          { extrapolateLeft: "clamp" }
        )}deg) scale(${interpolate(frame, [duration - 15, duration], [1, 0.8], {
          extrapolateLeft: "clamp",
        })})`,
        opacity: interpolate(frame, [duration - 10, duration], [1, 0], {
          extrapolateLeft: "clamp",
        }),
      };
    },
  },
  glitch: {
    name: "Glitch",
    preview: "Digital glitch effect",
    isPro: true,
    enter: (frame) => {
      const progress = interpolate(frame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
      });
      const xOffset =
        frame % 3 === 0 ? (Math.random() * 10 - 5) * (1 - progress) : 0;
      const yOffset =
        frame % 4 === 0 ? (Math.random() * 8 - 4) * (1 - progress) : 0;

      return {
        transform: `translate(${xOffset}px, ${yOffset}px) scale(${interpolate(
          frame,
          [0, 3, 6, 10, 15],
          [0.9, 1.05, 0.95, 1.02, 1],
          { extrapolateRight: "clamp" }
        )})`,
        opacity: interpolate(frame, [0, 3, 5, 15], [0, 0.7, 0.8, 1], {
          extrapolateRight: "clamp",
        }),
      };
    },
    exit: (frame, duration) => {
      const progress = interpolate(frame, [duration - 15, duration], [0, 1], {
        extrapolateLeft: "clamp",
      });
      const xOffset =
        (duration - frame) % 3 === 0 ? (Math.random() * 10 - 5) * progress : 0;
      const yOffset =
        (duration - frame) % 4 === 0 ? (Math.random() * 8 - 4) * progress : 0;

      return {
        transform: `translate(${xOffset}px, ${yOffset}px) scale(${interpolate(
          frame,
          [duration - 15, duration - 10, duration - 6, duration - 3, duration],
          [1, 1.02, 0.95, 1.05, 0.9],
          { extrapolateLeft: "clamp" }
        )})`,
        opacity: interpolate(
          frame,
          [duration - 15, duration - 5, duration - 3, duration],
          [1, 0.8, 0.7, 0],
          {
            extrapolateLeft: "clamp",
          }
        ),
      };
    },
  },
  swipe: {
    name: "Swipe",
    preview: "Reveals content with a swipe",
    isPro: true,
    directions: ["left", "right", "top", "bottom"],
    enter: (frame, duration, direction = "right") => {
      const clipPaths: Record<string, string> = {
        left: `inset(0 0 0 ${interpolate(frame, [0, 15], [100, 0], {
          extrapolateRight: "clamp",
        })}%)`,
        right: `inset(0 ${interpolate(frame, [0, 15], [100, 0], {
          extrapolateRight: "clamp",
        })}% 0 0)`,
        top: `inset(${interpolate(frame, [0, 15], [100, 0], {
          extrapolateRight: "clamp",
        })}% 0 0 0)`,
        bottom: `inset(0 0 ${interpolate(frame, [0, 15], [100, 0], {
          extrapolateRight: "clamp",
        })}% 0)`,
      };
      
      return {
        transform: `translateX(0px)`,
        opacity: 1,
        clipPath: clipPaths[direction],
      };
    },
    exit: (frame, duration, direction = "right") => {
      const clipPaths: Record<string, string> = {
        left: `inset(0 ${interpolate(
          frame,
          [duration - 15, duration],
          [0, 100],
          { extrapolateLeft: "clamp" }
        )}% 0 0)`,
        right: `inset(0 0 0 ${interpolate(
          frame,
          [duration - 15, duration],
          [0, 100],
          { extrapolateLeft: "clamp" }
        )}%)`,
        top: `inset(0 0 ${interpolate(
          frame,
          [duration - 15, duration],
          [0, 100],
          { extrapolateLeft: "clamp" }
        )}% 0)`,
        bottom: `inset(${interpolate(
          frame,
          [duration - 15, duration],
          [0, 100],
          { extrapolateLeft: "clamp" }
        )}% 0 0 0)`,
      };
      
      return {
        transform: `translateX(0px)`,
        opacity: 1,
        clipPath: clipPaths[direction],
      };
    },
  },
  float: {
    name: "Float",
    preview: "Smooth floating entrance",
    directions: ["left", "right", "top", "bottom", "top-left", "top-right", "bottom-left", "bottom-right"],
    enter: (frame, duration, direction = "bottom") => {
      const movements: Record<string, [number, number]> = {
        left: [-20, 0],
        right: [20, 0],
        top: [0, -20],
        bottom: [0, 20],
        "top-left": [-15, -15],
        "top-right": [15, -15],
        "bottom-left": [-15, 15],
        "bottom-right": [15, 15],
      };
      const [x, y] = movements[direction];
      
      return {
        transform: `translate(${interpolate(frame, [0, 15], [x, 0], {
          extrapolateRight: "clamp",
        })}px, ${interpolate(frame, [0, 15], [y, 0], {
          extrapolateRight: "clamp",
        })}px)`,
        opacity: interpolate(frame, [0, 15], [0, 1], {
          extrapolateRight: "clamp",
        }),
      };
    },
    exit: (frame, duration, direction = "bottom") => {
      const movements: Record<string, [number, number]> = {
        left: [0, 20],
        right: [0, -20],
        top: [0, 20],
        bottom: [0, -20],
        "top-left": [15, 15],
        "top-right": [-15, 15],
        "bottom-left": [15, -15],
        "bottom-right": [-15, -15],
      };
      const [x, y] = movements[direction];
      
      return {
        transform: `translate(${interpolate(
          frame,
          [duration - 15, duration],
          [0, x],
          { extrapolateLeft: "clamp" }
        )}px, ${interpolate(frame, [duration - 15, duration], [0, y], {
          extrapolateLeft: "clamp",
        })}px)`,
        opacity: interpolate(frame, [duration - 15, duration], [1, 0], {
          extrapolateLeft: "clamp",
        }),
      };
    },
  },
};