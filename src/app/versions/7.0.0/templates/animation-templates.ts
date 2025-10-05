import { interpolate } from "remotion";

export type AnimationTemplate = {
  name: string;
  preview: string;
  isPro?: boolean;
  directions?: string[]; // Add directions array
  enter: (
    frame: number,
    durationInFrames: number,
    direction?: string,
    speed?: number
  ) => {
    transform?: string;
    opacity?: number;
    filter?: string;
    clipPath?: string;
  };
  exit: (
    frame: number,
    durationInFrames: number,
    direction?: string,
    speed?: number
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
    enter: (frame, duration, direction, speed = 1) => {
      const animDuration = 30 / speed;
      return {
        opacity: interpolate(frame, [0, animDuration], [0, 1], {
          extrapolateRight: "clamp",
        }),
      };
    },
    exit: (frame, duration, direction, speed = 1) => {
const animDuration = 30 / speed;
      return {
        opacity: interpolate(frame, [duration - animDuration, duration], [1, 0], {
          extrapolateLeft: "clamp",
        }),
      };
    },
  },
  slide: {
    name: "Slide",
    preview: "Slide in from direction",
    isPro: true,
    directions: ["left", "right", "top", "bottom"],
    enter: (frame, duration, direction = "right", speed = 1) => {
      const animDuration = 30 / speed;
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
          ? `translateX(${interpolate(frame, [0, animDuration], [startX, 0], {
              extrapolateRight: "clamp",
            })}%)`
          : `translateY(${interpolate(frame, [0, animDuration], [startY, 0], {
              extrapolateRight: "clamp",
            })}%)`,
        opacity: interpolate(frame, [0, animDuration], [0, 1], {
          extrapolateRight: "clamp",
        }),
      };
    },
    exit: (frame, duration, direction = "right", speed = 1) => {
      const animDuration = 30 / speed;
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
              [duration - animDuration, duration],
              [startPos, endPos],
              { extrapolateLeft: "clamp" }
            )}%)`
          : `translateY(${interpolate(
              frame,
              [duration - animDuration, duration],
              [startPos, endPos],
              { extrapolateLeft: "clamp" }
            )}%)`,
        opacity: interpolate(frame, [duration - animDuration, duration], [1, 0], {
          extrapolateLeft: "clamp",
        }),
      };
    },
  },
  scale: {
    name: "Scale",
    preview: "Scale in/out",
    enter: (frame, duration, direction, speed = 1) => {
      const animDuration = 30 / speed;
      return {
        transform: `scale(${interpolate(frame, [0, animDuration], [0, 1], {
          extrapolateRight: "clamp",
        })})`,
        opacity: interpolate(frame, [0, animDuration], [0, 1], {
          extrapolateRight: "clamp",
        }),
      };
    },
    exit: (frame, duration, direction, speed = 1) => {
      const animDuration = 30 / speed;
      return {
        transform: `scale(${interpolate(
          frame,
          [duration - animDuration, duration],
          [1, 0],
          { extrapolateLeft: "clamp" }
        )})`,
        opacity: interpolate(frame, [duration - animDuration, duration], [1, 0], {
          extrapolateLeft: "clamp",
        }),
      };
    },
  },
  bounce: {
    name: "Bounce",
    preview: "Elastic bounce entrance",
    isPro: true,
    directions: ["left", "right", "top", "bottom"],
    enter: (frame, duration, direction = "bottom", speed = 1) => {
      const animDuration = 30 / speed;
      const isHorizontal = direction === "left" || direction === "right";
      const multiplier = direction === "left" || direction === "top" ? -1 : 1;
      
      return {
        transform: isHorizontal
          ? `translateX(${interpolate(
              frame,
              [0, (20 / 30) * animDuration, (26 / 30) * animDuration, animDuration],
              [100 * multiplier, -10 * multiplier, 5 * multiplier, 0],
              { extrapolateRight: "clamp" }
            )}px)`
          : `translateY(${interpolate(
              frame,
              [0, (20 / 30) * animDuration, (26 / 30) * animDuration, animDuration],
              [100 * multiplier, -10 * multiplier, 5 * multiplier, 0],
              { extrapolateRight: "clamp" }
            )}px)`,
        opacity: interpolate(frame, [0, (20 / 30) * animDuration], [0, 1], {
          extrapolateRight: "clamp",
        }),
      };
    },
    exit: (frame, duration, direction = "bottom", speed = 1) => {
const animDuration = 30 / speed;
      const isHorizontal = direction === "left" || direction === "right";
      const multiplier = direction === "left" || direction === "top" ? -1 : 1;
      
      return {
        transform: isHorizontal
          ? `translateX(${interpolate(
              frame,
              [duration - animDuration, duration - (26 / 30) * animDuration, duration - (20 / 30) * animDuration, duration],
              [0, 5 * multiplier, -10 * multiplier, 100 * multiplier],
              { extrapolateLeft: "clamp" }
            )}px)`
          : `translateY(${interpolate(
              frame,
              [duration - animDuration, duration - (26 / 30) * animDuration, duration - (20 / 30) * animDuration, duration],
              [0, 5 * multiplier, -10 * multiplier, 100 * multiplier],
              { extrapolateLeft: "clamp" }
            )}px)`,
        opacity: interpolate(frame, [duration - (20 / 30) * animDuration, duration], [1, 0], {
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
    enter: (frame, duration, direction = "horizontal", speed = 1) => {
const animDuration = 30 / speed;
      return {
        transform: direction === "horizontal"
          ? `perspective(400px) rotateX(${interpolate(
              frame,
              [0, animDuration],
              [90, 0],
              { extrapolateRight: "clamp" }
            )}deg)`
          : `perspective(400px) rotateY(${interpolate(
              frame,
              [0, animDuration],
              [90, 0],
              { extrapolateRight: "clamp" }
            )}deg)`,
        opacity: interpolate(frame, [0, (10 / 30) * animDuration, animDuration], [0, 0.7, 1], {
          extrapolateRight: "clamp",
        }),
      };
    },
    exit: (frame, duration, direction = "horizontal", speed = 1) => {
const animDuration = 30 / speed;
      return {
        transform: direction === "horizontal"
          ? `perspective(400px) rotateX(${interpolate(
              frame,
              [duration - animDuration, duration],
              [0, -90],
              { extrapolateLeft: "clamp" }
            )}deg)`
          : `perspective(400px) rotateY(${interpolate(
              frame,
              [duration - animDuration, duration],
              [0, -90],
              { extrapolateLeft: "clamp" }
            )}deg)`,
        opacity: interpolate(
          frame,
          [duration - animDuration, duration - (10 / 30) * animDuration, duration],
          [1, 0.7, 0],
          {
            extrapolateLeft: "clamp",
          }
        ),
      };
    },
  },
  zoomBlur: {
    name: "Zoom",
    preview: "Zoom with blur effect",
    isPro: true,
    enter: (frame, duration, direction, speed = 1) => {
      const animDuration = 30 / speed;
      return {
        transform: `scale(${interpolate(frame, [0, animDuration], [1.5, 1], {
          extrapolateRight: "clamp",
        })})`,
        opacity: interpolate(frame, [0, animDuration], [0, 1], {
          extrapolateRight: "clamp",
        }),
        filter: `blur(${interpolate(frame, [0, animDuration], [10, 0], {
          extrapolateRight: "clamp",
        })}px)`,
      };
    },
    exit: (frame, duration, direction, speed = 1) => {
const animDuration = 30 / speed;
      return {
        transform: `scale(${interpolate(
          frame,
          [duration - animDuration, duration],
          [1, 1.5],
          { extrapolateLeft: "clamp" }
        )})`,
        opacity: interpolate(frame, [duration - animDuration, duration], [1, 0], {
          extrapolateLeft: "clamp",
        }),
        filter: `blur(${interpolate(frame, [duration - animDuration, duration], [0, 10], {
          extrapolateLeft: "clamp",
        })}px)`,
      };
    },
  },
  snapRotate: {
    name: "Snap",
    preview: "Quick rotate with snap",
    isPro: true,
    directions: ["clockwise", "counter-clockwise"],
    enter: (frame, duration, direction = "clockwise", speed = 1) => {
const animDuration = 30 / speed;
      const multiplier = direction === "clockwise" ? 1 : -1;
      return {
        transform: `rotate(${interpolate(
          frame,
          [0, (16 / 30) * animDuration, (24 / 30) * animDuration, animDuration],
          [-10 * multiplier, 5 * multiplier, -2 * multiplier, 0],
          {
            extrapolateRight: "clamp",
          }
        )}deg) scale(${interpolate(frame, [0, animDuration], [0.8, 1], {
          extrapolateRight: "clamp",
        })})`,
        opacity: interpolate(frame, [0, (20 / 30) * animDuration], [0, 1], {
          extrapolateRight: "clamp",
        }),
      };
    },
    exit: (frame, duration, direction = "clockwise", speed = 1) => {
const animDuration = 30 / speed;
      const multiplier = direction === "clockwise" ? 1 : -1;
      return {
        transform: `rotate(${interpolate(
          frame,
          [duration - animDuration, duration - (24 / 30) * animDuration, duration - (16 / 30) * animDuration, duration],
          [0, -2 * multiplier, 5 * multiplier, -10 * multiplier],
          { extrapolateLeft: "clamp" }
        )}deg) scale(${interpolate(frame, [duration - animDuration, duration], [1, 0.8], {
          extrapolateLeft: "clamp",
        })})`,
        opacity: interpolate(frame, [duration - (20 / 30) * animDuration, duration], [1, 0], {
          extrapolateLeft: "clamp",
        }),
      };
    },
  },
  glitch: {
    name: "Glitch",
    preview: "Digital glitch effect",
    isPro: true,
    enter: (frame, duration, direction, speed = 1) => {
      const animDuration = 30 / speed;
      const progress = interpolate(frame, [0, animDuration], [0, 1], {
        extrapolateRight: "clamp",
      });
      const xOffset =
        frame % 3 === 0 ? (Math.random() * 10 - 5) * (1 - progress) : 0;
      const yOffset =
        frame % 4 === 0 ? (Math.random() * 8 - 4) * (1 - progress) : 0;

      return {
        transform: `translate(${xOffset}px, ${yOffset}px) scale(${interpolate(
          frame,
          [0, (6 / 30) * animDuration, (12 / 30) * animDuration, (20 / 30) * animDuration, animDuration],
          [0.9, 1.05, 0.95, 1.02, 1],
          { extrapolateRight: "clamp" }
        )})`,
        opacity: interpolate(frame, [0, (6 / 30) * animDuration, (10 / 30) * animDuration, animDuration], [0, 0.7, 0.8, 1], {
          extrapolateRight: "clamp",
        }),
      };
    },
    exit: (frame, duration, direction, speed = 1) => {
const animDuration = 30 / speed;
      const progress = interpolate(frame, [duration - animDuration, duration], [0, 1], {
        extrapolateLeft: "clamp",
      });
      const xOffset =
        (duration - frame) % 3 === 0 ? (Math.random() * 10 - 5) * progress : 0;
      const yOffset =
        (duration - frame) % 4 === 0 ? (Math.random() * 8 - 4) * progress : 0;

      return {
        transform: `translate(${xOffset}px, ${yOffset}px) scale(${interpolate(
          frame,
          [duration - animDuration, duration - (20 / 30) * animDuration, duration - (12 / 30) * animDuration, duration - (6 / 30) * animDuration, duration],
          [1, 1.02, 0.95, 1.05, 0.9],
          { extrapolateLeft: "clamp" }
        )})`,
        opacity: interpolate(
          frame,
          [duration - animDuration, duration - (10 / 30) * animDuration, duration - (6 / 30) * animDuration, duration],
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
    enter: (frame, duration, direction = "right", speed = 1) => {
      const animDuration = 30 / speed;
      const clipPaths: Record<string, string> = {
        left: `inset(0 0 0 ${interpolate(frame, [0, animDuration], [100, 0], {
          extrapolateRight: "clamp",
        })}%)`,
        right: `inset(0 ${interpolate(frame, [0, animDuration], [100, 0], {
          extrapolateRight: "clamp",
        })}% 0 0)`,
        top: `inset(${interpolate(frame, [0, animDuration], [100, 0], {
          extrapolateRight: "clamp",
        })}% 0 0 0)`,
        bottom: `inset(0 0 ${interpolate(frame, [0, animDuration], [100, 0], {
          extrapolateRight: "clamp",
        })}% 0)`,
      };
      
      return {
        transform: `translateX(0px)`,
        opacity: 1,
        clipPath: clipPaths[direction],
      };
    },
    exit: (frame, duration, direction = "right", speed = 1) => {
      const animDuration = 30 / speed;
      const clipPaths: Record<string, string> = {
        left: `inset(0 ${interpolate(
          frame,
          [duration - animDuration, duration],
          [0, 100],
          { extrapolateLeft: "clamp" }
        )}% 0 0)`,
        right: `inset(0 0 0 ${interpolate(
          frame,
          [duration - animDuration, duration],
          [0, 100],
          { extrapolateLeft: "clamp" }
        )}%)`,
        top: `inset(0 0 ${interpolate(
          frame,
          [duration - animDuration, duration],
          [0, 100],
          { extrapolateLeft: "clamp" }
        )}% 0)`,
        bottom: `inset(${interpolate(
          frame,
          [duration - animDuration, duration],
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
    enter: (frame, duration, direction = "bottom", speed = 1) => {
const animDuration = 30 / speed;
      const movements: Record<string, [number, number]> = {
        left: [-20, 0],
        right: [20, 0],
        top: [0, -20],
        bottom: [0, 20],
      };
      const [x, y] = movements[direction];
      
      return {
        transform: `translate(${interpolate(frame, [0, animDuration], [x, 0], {
          extrapolateRight: "clamp",
        })}px, ${interpolate(frame, [0, animDuration], [y, 0], {
          extrapolateRight: "clamp",
        })}px)`,
        opacity: interpolate(frame, [0, animDuration], [0, 1], {
          extrapolateRight: "clamp",
        }),
      };
    },
    exit: (frame, duration, direction = "bottom", speed = 1) => {
const animDuration = 30 / speed;
      const movements: Record<string, [number, number]> = {
        left: [0, 20],
        right: [0, -20],
        top: [0, 20],
        bottom: [0, -20],
      };
      const [x, y] = movements[direction];
      
      return {
        transform: `translate(${interpolate(
          frame,
          [duration - animDuration, duration],
          [0, x],
          { extrapolateLeft: "clamp" }
        )}px, ${interpolate(frame, [duration - animDuration, duration], [0, y], {
          extrapolateLeft: "clamp",
        })}px)`,
        opacity: interpolate(frame, [duration - animDuration, duration], [1, 0], {
          extrapolateLeft: "clamp",
        }),
      };
    },
  },
};