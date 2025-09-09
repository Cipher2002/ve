import React from "react";
import { StickerTemplate, StickerTemplateProps } from "../base-template";
import { interpolate, useCurrentFrame } from "remotion";

interface SimpleShapeProps extends StickerTemplateProps {
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: "solid" | "dashed" | "dotted";
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

const ShapeWrapper: React.FC<{ children: React.ReactNode; overlay: any; shadow?: string }> = ({
  children,
  overlay,
  shadow,
}) => {
  const frame = useCurrentFrame();
  
  // Simple entrance animation
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        filter: shadow || "none",
      }}
    >
      {children}
    </div>
  );
};

// Helper function to create shadow filter string
const createShadowFilter = (color: string, blur: number, offsetX: number, offsetY: number): string => {
  if (blur === 0 && offsetX === 0 && offsetY === 0) return "none";
  return `drop-shadow(${offsetX}px ${offsetY}px ${blur}px ${color})`;
};

// Helper function to create stroke style
const getStrokeStyle = (style: string): string => {
  switch (style) {
    case "dashed": return "5,5";
    case "dotted": return "2,2";
    default: return "none";
  }
};

// BASIC SHAPES
const createBasicShapeTemplate = (
  id: string,
  name: string,
  ShapeComponent: React.FC<SimpleShapeProps>
): StickerTemplate => ({
  config: {
    id: `shape-${id}`,
    name,
    category: "Shapes",
    isPro: false,
    defaultProps: {
      fillColor: "#3B82F6",
      strokeColor: "#1E40AF",
      strokeWidth: 0,
      strokeStyle: "solid",
      shadowColor: "rgba(0,0,0,0.2)",
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
    },
  },
  Component: ShapeComponent,
});

// Circle
const CircleComponent: React.FC<SimpleShapeProps> = ({
  overlay,
  fillColor = "#3B82F6",
  strokeColor = "#1E40AF",
  strokeWidth = 0,
  strokeStyle = "solid",
  shadowColor = "rgba(0,0,0,0.2)",
  shadowBlur = 0,
  shadowOffsetX = 0,
  shadowOffsetY = 0,
}) => {
  const size = Math.min(overlay.width || 100, overlay.height || 100);
  const shadow = createShadowFilter(shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY);
  
  return (
    <ShapeWrapper overlay={overlay} shadow={shadow}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size / 2) - (strokeWidth / 2)}
          fill={fillColor}
          stroke={strokeWidth > 0 ? strokeColor : "none"}
          strokeWidth={strokeWidth}
          strokeDasharray={getStrokeStyle(strokeStyle)}
        />
      </svg>
    </ShapeWrapper>
  );
};

// Square
const SquareComponent: React.FC<SimpleShapeProps> = ({
  overlay,
  fillColor = "#3B82F6",
  strokeColor = "#1E40AF",
  strokeWidth = 0,
  strokeStyle = "solid",
  shadowColor = "rgba(0,0,0,0.2)",
  shadowBlur = 0,
  shadowOffsetX = 0,
  shadowOffsetY = 0,
}) => {
  const size = Math.min(overlay.width || 100, overlay.height || 100);
  const shadow = createShadowFilter(shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY);
  
  return (
    <ShapeWrapper overlay={overlay} shadow={shadow}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect
          x={strokeWidth / 2}
          y={strokeWidth / 2}
          width={size - strokeWidth}
          height={size - strokeWidth}
          fill={fillColor}
          stroke={strokeWidth > 0 ? strokeColor : "none"}
          strokeWidth={strokeWidth}
          strokeDasharray={getStrokeStyle(strokeStyle)}
        />
      </svg>
    </ShapeWrapper>
  );
};

// Rectangle
const RectangleComponent: React.FC<SimpleShapeProps> = ({
  overlay,
  fillColor = "#3B82F6",
  strokeColor = "#1E40AF",
  strokeWidth = 0,
  strokeStyle = "solid",
  shadowColor = "rgba(0,0,0,0.2)",
  shadowBlur = 0,
  shadowOffsetX = 0,
  shadowOffsetY = 0,
}) => {
  const width = overlay.width || 150;
  const height = overlay.height || 100;
  const shadow = createShadowFilter(shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY);
  
  return (
    <ShapeWrapper overlay={overlay} shadow={shadow}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <rect
          x={strokeWidth / 2}
          y={strokeWidth / 2}
          width={width - strokeWidth}
          height={height - strokeWidth}
          fill={fillColor}
          stroke={strokeWidth > 0 ? strokeColor : "none"}
          strokeWidth={strokeWidth}
          strokeDasharray={getStrokeStyle(strokeStyle)}
        />
      </svg>
    </ShapeWrapper>
  );
};

// Triangle
const TriangleComponent: React.FC<SimpleShapeProps> = ({
  overlay,
  fillColor = "#3B82F6",
  strokeColor = "#1E40AF",
  strokeWidth = 0,
  strokeStyle = "solid",
  shadowColor = "rgba(0,0,0,0.2)",
  shadowBlur = 0,
  shadowOffsetX = 0,
  shadowOffsetY = 0,
}) => {
  const size = Math.min(overlay.width || 100, overlay.height || 100);
  const shadow = createShadowFilter(shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY);
  
  return (
    <ShapeWrapper overlay={overlay} shadow={shadow}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <polygon
          points={`${size/2},${strokeWidth/2} ${size-strokeWidth/2},${size-strokeWidth/2} ${strokeWidth/2},${size-strokeWidth/2}`}
          fill={fillColor}
          stroke={strokeWidth > 0 ? strokeColor : "none"}
          strokeWidth={strokeWidth}
          strokeDasharray={getStrokeStyle(strokeStyle)}
          strokeLinejoin="round"
        />
      </svg>
    </ShapeWrapper>
  );
};

// Diamond
const DiamondComponent: React.FC<SimpleShapeProps> = ({
  overlay,
  fillColor = "#3B82F6",
  strokeColor = "#1E40AF",
  strokeWidth = 0,
  strokeStyle = "solid",
  shadowColor = "rgba(0,0,0,0.2)",
  shadowBlur = 0,
  shadowOffsetX = 0,
  shadowOffsetY = 0,
}) => {
  const size = Math.min(overlay.width || 100, overlay.height || 100);
  const shadow = createShadowFilter(shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY);
  
  return (
    <ShapeWrapper overlay={overlay} shadow={shadow}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <polygon
          points={`${size/2},${strokeWidth/2} ${size-strokeWidth/2},${size/2} ${size/2},${size-strokeWidth/2} ${strokeWidth/2},${size/2}`}
          fill={fillColor}
          stroke={strokeWidth > 0 ? strokeColor : "none"}
          strokeWidth={strokeWidth}
          strokeDasharray={getStrokeStyle(strokeStyle)}
          strokeLinejoin="round"
        />
      </svg>
    </ShapeWrapper>
  );
};

// Pentagon
const PentagonComponent: React.FC<SimpleShapeProps> = ({
  overlay,
  fillColor = "#3B82F6",
  strokeColor = "#1E40AF",
  strokeWidth = 0,
  strokeStyle = "solid",
  shadowColor = "rgba(0,0,0,0.2)",
  shadowBlur = 0,
  shadowOffsetX = 0,
  shadowOffsetY = 0,
}) => {
  const size = Math.min(overlay.width || 100, overlay.height || 100);
  const shadow = createShadowFilter(shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY);
  
  return (
    <ShapeWrapper overlay={overlay} shadow={shadow}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <polygon
          points="50,5 95,35 80,90 20,90 5,35"
          fill={fillColor}
          stroke={strokeWidth > 0 ? strokeColor : "none"}
          strokeWidth={strokeWidth}
          strokeDasharray={getStrokeStyle(strokeStyle)}
          strokeLinejoin="round"
          transform={`scale(${(size-strokeWidth)/100})`}
        />
      </svg>
    </ShapeWrapper>
  );
};

// Hexagon
const HexagonComponent: React.FC<SimpleShapeProps> = ({
  overlay,
  fillColor = "#3B82F6",
  strokeColor = "#1E40AF",
  strokeWidth = 0,
  strokeStyle = "solid",
  shadowColor = "rgba(0,0,0,0.2)",
  shadowBlur = 0,
  shadowOffsetX = 0,
  shadowOffsetY = 0,
}) => {
  const size = Math.min(overlay.width || 100, overlay.height || 100);
  const shadow = createShadowFilter(shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY);
  
  return (
    <ShapeWrapper overlay={overlay} shadow={shadow}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <polygon
          points="25,10 75,10 90,50 75,90 25,90 10,50"
          fill={fillColor}
          stroke={strokeWidth > 0 ? strokeColor : "none"}
          strokeWidth={strokeWidth}
          strokeDasharray={getStrokeStyle(strokeStyle)}
          strokeLinejoin="round"
          transform={`scale(${(size-strokeWidth)/100})`}
        />
      </svg>
    </ShapeWrapper>
  );
};

// Octagon
const OctagonComponent: React.FC<SimpleShapeProps> = ({
  overlay,
  fillColor = "#3B82F6",
  strokeColor = "#1E40AF",
  strokeWidth = 0,
  strokeStyle = "solid",
  shadowColor = "rgba(0,0,0,0.2)",
  shadowBlur = 0,
  shadowOffsetX = 0,
  shadowOffsetY = 0,
}) => {
  const size = Math.min(overlay.width || 100, overlay.height || 100);
  const shadow = createShadowFilter(shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY);
  
  return (
    <ShapeWrapper overlay={overlay} shadow={shadow}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <polygon
          points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30"
          fill={fillColor}
          stroke={strokeWidth > 0 ? strokeColor : "none"}
          strokeWidth={strokeWidth}
          strokeDasharray={getStrokeStyle(strokeStyle)}
          strokeLinejoin="round"
          transform={`scale(${(size-strokeWidth)/100})`}
        />
      </svg>
    </ShapeWrapper>
  );
};

// Oval
const OvalComponent: React.FC<SimpleShapeProps> = ({
  overlay,
  fillColor = "#3B82F6",
  strokeColor = "#1E40AF",
  strokeWidth = 0,
  strokeStyle = "solid",
  shadowColor = "rgba(0,0,0,0.2)",
  shadowBlur = 0,
  shadowOffsetX = 0,
  shadowOffsetY = 0,
}) => {
  const width = overlay.width || 150;
  const height = overlay.height || 100;
  const shadow = createShadowFilter(shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY);
  
  return (
    <ShapeWrapper overlay={overlay} shadow={shadow}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <ellipse
          cx={width / 2}
          cy={height / 2}
          rx={(width / 2) - (strokeWidth / 2)}
          ry={(height / 2) - (strokeWidth / 2)}
          fill={fillColor}
          stroke={strokeWidth > 0 ? strokeColor : "none"}
          strokeWidth={strokeWidth}
          strokeDasharray={getStrokeStyle(strokeStyle)}
        />
      </svg>
    </ShapeWrapper>
  );
};

// Rounded Rectangle
const RoundedRectangleComponent: React.FC<SimpleShapeProps> = ({
  overlay,
  fillColor = "#3B82F6",
  strokeColor = "#1E40AF",
  strokeWidth = 0,
  strokeStyle = "solid",
  shadowColor = "rgba(0,0,0,0.2)",
  shadowBlur = 0,
  shadowOffsetX = 0,
  shadowOffsetY = 0,
}) => {
  const width = overlay.width || 150;
  const height = overlay.height || 100;
  const radius = Math.min(width, height) * 0.2;
  const shadow = createShadowFilter(shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY);
  
  return (
    <ShapeWrapper overlay={overlay} shadow={shadow}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <rect
          x={strokeWidth / 2}
          y={strokeWidth / 2}
          width={width - strokeWidth}
          height={height - strokeWidth}
          rx={radius}
          ry={radius}
          fill={fillColor}
          stroke={strokeWidth > 0 ? strokeColor : "none"}
          strokeWidth={strokeWidth}
          strokeDasharray={getStrokeStyle(strokeStyle)}
        />
      </svg>
    </ShapeWrapper>
  );
};

// LINES & ARROWS
const HorizontalLineComponent: React.FC<SimpleShapeProps> = ({
  overlay,
  strokeColor = "#1E40AF",
  strokeWidth = 2,
  strokeStyle = "solid",
  shadowColor = "rgba(0,0,0,0.2)",
  shadowBlur = 0,
  shadowOffsetX = 0,
  shadowOffsetY = 0,
}) => {
  const width = overlay.width || 150;
  const height = overlay.height || 20;
  const shadow = createShadowFilter(shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY);
  
  return (
    <ShapeWrapper overlay={overlay} shadow={shadow}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <line
          x1={strokeWidth / 2}
          y1={height / 2}
          x2={width - strokeWidth / 2}
          y2={height / 2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={getStrokeStyle(strokeStyle)}
          strokeLinecap="round"
        />
      </svg>
    </ShapeWrapper>
  );
};

const VerticalLineComponent: React.FC<SimpleShapeProps> = ({
  overlay,
  strokeColor = "#1E40AF",
  strokeWidth = 2,
  strokeStyle = "solid",
  shadowColor = "rgba(0,0,0,0.2)",
  shadowBlur = 0,
  shadowOffsetX = 0,
  shadowOffsetY = 0,
}) => {
  const width = overlay.width || 20;
  const height = overlay.height || 150;
  const shadow = createShadowFilter(shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY);
  
  return (
    <ShapeWrapper overlay={overlay} shadow={shadow}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <line
          x1={width / 2}
          y1={strokeWidth / 2}
          x2={width / 2}
          y2={height - strokeWidth / 2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={getStrokeStyle(strokeStyle)}
          strokeLinecap="round"
        />
      </svg>
    </ShapeWrapper>
  );
};

const ArrowRightComponent: React.FC<SimpleShapeProps> = ({
  overlay,
  fillColor = "#3B82F6",
  strokeColor = "#1E40AF",
  strokeWidth = 0,
  strokeStyle = "solid",
  shadowColor = "rgba(0,0,0,0.2)",
  shadowBlur = 0,
  shadowOffsetX = 0,
  shadowOffsetY = 0,
}) => {
  const width = overlay.width || 150;
  const height = overlay.height || 60;
  const shadow = createShadowFilter(shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY);
  
  return (
    <ShapeWrapper overlay={overlay} shadow={shadow}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <polygon
          points={`0,${height*0.3} ${width*0.7},${height*0.3} ${width*0.7},${height*0.1} ${width},${height*0.5} ${width*0.7},${height*0.9} ${width*0.7},${height*0.7} 0,${height*0.7}`}
          fill={fillColor}
          stroke={strokeWidth > 0 ? strokeColor : "none"}
          strokeWidth={strokeWidth}
          strokeDasharray={getStrokeStyle(strokeStyle)}
          strokeLinejoin="round"
        />
      </svg>
    </ShapeWrapper>
  );
};

// Star (5-point)
const Star5Component: React.FC<SimpleShapeProps> = ({
  overlay,
  fillColor = "#3B82F6",
  strokeColor = "#1E40AF",
  strokeWidth = 0,
  strokeStyle = "solid",
  shadowColor = "rgba(0,0,0,0.2)",
  shadowBlur = 0,
  shadowOffsetX = 0,
  shadowOffsetY = 0,
}) => {
  const size = Math.min(overlay.width || 100, overlay.height || 100);
  const shadow = createShadowFilter(shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY);
  
  return (
    <ShapeWrapper overlay={overlay} shadow={shadow}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <polygon
          points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"
          fill={fillColor}
          stroke={strokeWidth > 0 ? strokeColor : "none"}
          strokeWidth={strokeWidth}
          strokeDasharray={getStrokeStyle(strokeStyle)}
          strokeLinejoin="round"
          transform={`scale(${(size-strokeWidth)/100})`}
        />
      </svg>
    </ShapeWrapper>
  );
};

// Heart
const HeartComponent: React.FC<SimpleShapeProps> = ({
  overlay,
  fillColor = "#DC2626",
  strokeColor = "#991B1B",
  strokeWidth = 0,
  strokeStyle = "solid",
  shadowColor = "rgba(0,0,0,0.2)",
  shadowBlur = 0,
  shadowOffsetX = 0,
  shadowOffsetY = 0,
}) => {
  const size = Math.min(overlay.width || 100, overlay.height || 100);
  const shadow = createShadowFilter(shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY);
  
  return (
    <ShapeWrapper overlay={overlay} shadow={shadow}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <path
          d="M50,25 C50,25 37.5,12.5 25,25 C12.5,37.5 25,50 50,75 C75,50 87.5,37.5 75,25 C62.5,12.5 50,25 50,25 Z"
          fill={fillColor}
          stroke={strokeWidth > 0 ? strokeColor : "none"}
          strokeWidth={strokeWidth}
          strokeDasharray={getStrokeStyle(strokeStyle)}
          strokeLinejoin="round"
          transform={`scale(${(size-strokeWidth)/100})`}
        />
      </svg>
    </ShapeWrapper>
  );
};

// Export all shape templates
export const shapeStickers = [
  // Basic Shapes
  createBasicShapeTemplate("circle", "Circle", CircleComponent),
  createBasicShapeTemplate("square", "Square", SquareComponent),
  createBasicShapeTemplate("rectangle", "Rectangle", RectangleComponent),
  createBasicShapeTemplate("triangle", "Triangle", TriangleComponent),
  createBasicShapeTemplate("diamond", "Diamond", DiamondComponent),
  createBasicShapeTemplate("pentagon", "Pentagon", PentagonComponent),
  createBasicShapeTemplate("hexagon", "Hexagon", HexagonComponent),
  createBasicShapeTemplate("octagon", "Octagon", OctagonComponent),
  createBasicShapeTemplate("oval", "Oval", OvalComponent),
  createBasicShapeTemplate("rounded-rectangle", "Rounded Rectangle", RoundedRectangleComponent),
  
  // Lines & Arrows
  // createBasicShapeTemplate("horizontal-line", "Horizontal Line", HorizontalLineComponent),
  // createBasicShapeTemplate("vertical-line", "Vertical Line", VerticalLineComponent),
  createBasicShapeTemplate("arrow-right", "Arrow Right", ArrowRightComponent),
  
  // Symbols
  createBasicShapeTemplate("star-5", "Star", Star5Component),
  createBasicShapeTemplate("heart", "Heart", HeartComponent),
];