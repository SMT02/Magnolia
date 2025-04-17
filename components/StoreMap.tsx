import React, { useRef, useEffect, useState } from 'react';
import { 
  View, 
  Animated, 
  PanResponder, 
  Dimensions, 
  Modal, 
  TouchableOpacity, 
  Image,
  Text,
  SafeAreaView,
} from 'react-native';
import Svg, { 
  Path, 
  Rect, 
  Circle, 
  G,
  Text as SvgText,
  Line,
} from 'react-native-svg';
import { ShoppingListItem } from '@/lib/shopping-list-provider';
import icons from '@/constants/icons';

interface Point {
  x: number;
  y: number;
}

interface Node {
  x: number;
  y: number;
  f: number;
  g: number;
  h: number;
  parent?: Node;
}

interface Department {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  sections: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

interface Aisle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  connectedTo: string[];  // IDs of connected aisles
}

export type DepartmentName = 
  | 'FruitsAndVegetables'
  | 'Bakery'
  | 'DairyAndEggs'
  | 'MeatAndSeafood'
  | 'Beverages'
  | 'FrozenFoods'
  | 'PantryStaples'
  | 'SnacksAndSweets'
  | 'HouseholdEssentials';

interface StoreLayout {
  width: number;
  height: number;
  walkablePaths: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  departments: Record<DepartmentName, Department>;
  entrance: Point;
  aisleLabels: Array<{
    id: string;
    x: number;
    y: number;
    label: string;
  }>;
  aisles: Record<string, Aisle>;
  gridSize: number;
}

// Store layout configuration with walkable paths
export const STORE_LAYOUT: StoreLayout = {
  width: 900,
  height: 700,
  walkablePaths: [
    // Main aisles (vertical)
    { x: 150, y: 50, width: 40, height: 500 },  // Left aisle
    { x: 450, y: 50, width: 40, height: 500 },  // Center aisle
    { x: 750, y: 50, width: 40, height: 500 },  // Right aisle
    // Cross aisles (horizontal)
    { x: 150, y: 50, width: 640, height: 40 },  // Top cross aisle
    { x: 150, y: 280, width: 640, height: 40 }, // Middle cross aisle
    { x: 150, y: 510, width: 640, height: 40 }, // Bottom cross aisle
    // Entrance path
    { x: 450, y: 550, width: 40, height: 50 },
  ],
  departments: {
    // Front right when entering
    FruitsAndVegetables: {
      x: 600, y: 50,
      width: 250, height: 180,
      color: "#e8f5e9",
      sections: [
        { x: 600, y: 50, width: 120, height: 180 },
        { x: 730, y: 50, width: 120, height: 180 }
      ]
    },
    // Front left when entering
    Bakery: {
      x: 50, y: 50,
      width: 250, height: 120,
      color: "#fff3e0",
      sections: [
        { x: 50, y: 50, width: 115, height: 120 },
        { x: 175, y: 50, width: 115, height: 120 }
      ]
    },
    // Back wall
    DairyAndEggs: {
      x: 50, y: 400,
      width: 300, height: 100,
      color: "#e3f2fd",
      sections: [
        { x: 50, y: 400, width: 140, height: 100 },
        { x: 200, y: 400, width: 140, height: 100 }
      ]
    },
    // Back right corner
    MeatAndSeafood: {
      x: 600, y: 400,
      width: 250, height: 100,
      color: "#ffebee",
      sections: [
        { x: 600, y: 400, width: 115, height: 100 },
        { x: 725, y: 400, width: 115, height: 100 }
      ]
    },
    // Center aisles near front
    Beverages: {
      x: 200, y: 100,
      width: 200, height: 150,
      color: "#e0f2f1",
      sections: [
        { x: 200, y: 100, width: 90, height: 150 },
        { x: 300, y: 100, width: 90, height: 150 }
      ]
    },
    // Right wall freezer section
    FrozenFoods: {
      x: 600, y: 240,
      width: 250, height: 150,
      color: "#e8eaf6",
      sections: [
        { x: 600, y: 240, width: 115, height: 150 },
        { x: 725, y: 240, width: 115, height: 150 }
      ]
    },
    // Center aisles
    PantryStaples: {
      x: 200, y: 260,
      width: 200, height: 130,
      color: "#fff3e0",
      sections: [
        { x: 200, y: 260, width: 90, height: 130 },
        { x: 300, y: 260, width: 90, height: 130 }
      ]
    },
    // Center aisles near back
    SnacksAndSweets: {
      x: 410, y: 260,
      width: 180, height: 130,
      color: "#fce4ec",
      sections: [
        { x: 410, y: 260, width: 80, height: 130 },
        { x: 500, y: 260, width: 80, height: 130 }
      ]
    },
    // Left wall, last aisles
    HouseholdEssentials: {
      x: 50, y: 180,
      width: 140, height: 210,
      color: "#f5f5f5",
      sections: [
        { x: 50, y: 180, width: 60, height: 210 },
        { x: 120, y: 180, width: 60, height: 210 }
      ]
    }
  },
  entrance: { x: 450, y: 580 },
  aisleLabels: [
    { id: "A1", x: 170, y: 200, label: "Household" },
    { id: "A2", x: 470, y: 200, label: "Center" },
    { id: "A3", x: 770, y: 200, label: "Produce" },
  ],
  aisles: {
    A1: {
      id: "A1",
      x: 150,
      y: 50,
      width: 40,
      height: 500,
      label: "Left Aisle",
      connectedTo: ["A2", "H1", "H2", "H3"]
    },
    A2: {
      id: "A2",
      x: 450,
      y: 50,
      width: 40,
      height: 500,
      label: "Center Aisle",
      connectedTo: ["A1", "A3", "H1", "H2", "H3"]
    },
    A3: {
      id: "A3",
      x: 750,
      y: 50,
      width: 40,
      height: 500,
      label: "Right Aisle",
      connectedTo: ["A2", "H1", "H2", "H3"]
    },
    H1: {
      id: "H1",
      x: 150,
      y: 50,
      width: 640,
      height: 40,
      label: "Top Cross Aisle",
      connectedTo: ["A1", "A2", "A3"]
    },
    H2: {
      id: "H2",
      x: 150,
      y: 280,
      width: 640,
      height: 40,
      label: "Middle Cross Aisle",
      connectedTo: ["A1", "A2", "A3"]
    },
    H3: {
      id: "H3",
      x: 150,
      y: 510,
      width: 640,
      height: 40,
      label: "Bottom Cross Aisle",
      connectedTo: ["A1", "A2", "A3"]
    }
  },
  gridSize: 20
};

interface Props {
  shoppingList: ShoppingListItem[];
  selectedDepartment?: DepartmentName;
  onDepartmentPress?: (department: DepartmentName) => void;
}

const StoreMap = ({ shoppingList, selectedDepartment, onDepartmentPress }: Props) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [lastPinchDistance, setLastPinchDistance] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<View>(null);

  // Center map only in preview mode
  const centerMapForPreview = () => {
    // Only center in preview, not fullscreen
    const previewContainer = { width: 300, height: 225 }; // Approximation of the aspect-[4/3] container
    const centerX = (previewContainer.width - STORE_LAYOUT.width * scale) / 2;
    const centerY = (previewContainer.height - STORE_LAYOUT.height * scale) / 2;
    
    setPosition({ x: centerX, y: centerY });
  };

  useEffect(() => {
    // Center the map on initial mount for preview
    if (!isFullScreen) {
      centerMapForPreview();
    }
  }, []);

  // Pan responder with constrained movement to store bounds
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        setIsDragging(false);
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        
        // Get container dimensions based on fullscreen state
        const containerWidth = isFullScreen ? 
          Dimensions.get('window').width : 
          300; // Approximation of the preview container width
        
        const containerHeight = isFullScreen ? 
          Dimensions.get('window').height - 100 : // Account for header in fullscreen
          225; // Approximation of the preview container height
        
        if (touches.length === 2) {
          // Handle pinch to zoom
          const touch1 = touches[0];
          const touch2 = touches[1];
          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) +
            Math.pow(touch2.pageY - touch1.pageY, 2)
          );

          if (lastPinchDistance) {
            const diff = distance - lastPinchDistance;
            
            // Adjust scale to keep the store within the container
            let newScale;
            if (isFullScreen) {
              const minScale = Math.min(
                containerWidth / STORE_LAYOUT.width,
                containerHeight / STORE_LAYOUT.height
              );
              newScale = Math.max(minScale, Math.min(minScale * 2, scale + diff / 400));
            } else {
              // More limited scale in preview mode
              newScale = Math.max(0.5, Math.min(1.5, scale + diff / 400));
            }
            
            setScale(newScale);
          }
          setLastPinchDistance(distance);
          setIsDragging(true);
        } else if (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2) {
          // Handle pan with constraints to the store edges
          const scaledStoreWidth = STORE_LAYOUT.width * scale;
          const scaledStoreHeight = STORE_LAYOUT.height * scale;
          
          // Calculate the maximum allowed positions to keep the store within view
          // This ensures you can't pan to see outside the store edges
          const minX = Math.min(0, containerWidth - scaledStoreWidth);
          const maxX = 0;
          const minY = Math.min(0, containerHeight - scaledStoreHeight);
          const maxY = 0;
          
          const newX = position.x + gestureState.dx;
          const newY = position.y + gestureState.dy;
          
          setPosition({
            x: Math.min(Math.max(newX, minX), maxX),
            y: Math.min(Math.max(newY, minY), maxY)
          });
          setLastPinchDistance(0);
          setIsDragging(true);
        }
      },
      onPanResponderRelease: (evt) => {
        setLastPinchDistance(0);
        if (!isDragging && evt.nativeEvent.touches.length === 0) {
          // Handle department selection
          const touch = evt.nativeEvent;
          const x = (touch.pageX - position.x) / scale;
          const y = (touch.pageY - position.y) / scale;
          
          Object.entries(STORE_LAYOUT.departments).forEach(([name, dept]) => {
            dept.sections.forEach(section => {
              if (
                x >= section.x && x <= section.x + section.width &&
                y >= section.y && y <= section.y + section.height
              ) {
                onDepartmentPress?.(name as DepartmentName);
              }
            });
          });
        }
        setIsDragging(false);
      },
    })
  ).current;

  // Pulse animation
  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        })
      ]).start(() => pulse());
    };
    pulse();
  }, []);

  // Find nearest aisle point
  const findNearestAislePoint = (point: Point): Point => {
    let nearestPoint = point;
    let minDistance = Infinity;

    // Check each aisle
    Object.values(STORE_LAYOUT.aisles).forEach(aisle => {
      // Check horizontal alignment
      if (point.y >= aisle.y && point.y <= aisle.y + aisle.height) {
        // Check left edge
        const distToLeft = Math.abs(point.x - aisle.x);
        if (distToLeft < minDistance) {
          minDistance = distToLeft;
          nearestPoint = { x: aisle.x, y: point.y };
        }
        // Check right edge
        const distToRight = Math.abs(point.x - (aisle.x + aisle.width));
        if (distToRight < minDistance) {
          minDistance = distToRight;
          nearestPoint = { x: aisle.x + aisle.width, y: point.y };
        }
      }

      // Check vertical alignment
      if (point.x >= aisle.x && point.x <= aisle.x + aisle.width) {
        // Check top edge
        const distToTop = Math.abs(point.y - aisle.y);
        if (distToTop < minDistance) {
          minDistance = distToTop;
          nearestPoint = { x: point.x, y: aisle.y };
        }
        // Check bottom edge
        const distToBottom = Math.abs(point.y - (aisle.y + aisle.height));
        if (distToBottom < minDistance) {
          minDistance = distToBottom;
          nearestPoint = { x: point.x, y: aisle.y + aisle.height };
        }
      }
    });

    return nearestPoint;
  };

  // Get aisle intersection points
  const getAisleIntersections = (): Point[] => {
    const intersections: Point[] = [];
    
    Object.values(STORE_LAYOUT.aisles).forEach(aisle1 => {
      Object.values(STORE_LAYOUT.aisles).forEach(aisle2 => {
        if (aisle1.id !== aisle2.id && aisle1.connectedTo.includes(aisle2.id)) {
          // Find intersection points
          if (aisle1.x <= aisle2.x + aisle2.width &&
              aisle1.x + aisle1.width >= aisle2.x &&
              aisle1.y <= aisle2.y + aisle2.height &&
              aisle1.y + aisle1.height >= aisle2.y) {
            
            // Calculate intersection point
            const x = Math.max(aisle1.x, aisle2.x) + 
                     Math.min(aisle1.x + aisle1.width, aisle2.x + aisle2.width) >> 1;
            const y = Math.max(aisle1.y, aisle2.y) + 
                     Math.min(aisle1.y + aisle1.height, aisle2.y + aisle2.height) >> 1;
            
            intersections.push({ x, y });
          }
        }
      });
    });

    return intersections;
  };

  // Enhanced A* pathfinding implementation
  const heuristic = (a: Point, b: Point): number => {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  };

  const isWalkable = (x: number, y: number): boolean => {
    return Object.values(STORE_LAYOUT.aisles).some(aisle => 
      x >= aisle.x && x <= aisle.x + aisle.width &&
      y >= aisle.y && y <= aisle.y + aisle.height
    );
  };

  const getNeighbors = (node: Node): Node[] => {
    const neighbors: Node[] = [];
    const intersections = getAisleIntersections();
    
    // Add intersection points as potential neighbors
    intersections.forEach(point => {
      if (Math.abs(node.x - point.x) < STORE_LAYOUT.gridSize * 2 &&
          Math.abs(node.y - point.y) < STORE_LAYOUT.gridSize * 2) {
        neighbors.push({
          x: point.x,
          y: point.y,
          f: 0,
          g: 0,
          h: 0
        });
      }
    });

    // Add cardinal directions
    const directions = [
      { dx: 0, dy: -STORE_LAYOUT.gridSize }, // Up
      { dx: STORE_LAYOUT.gridSize, dy: 0 },  // Right
      { dx: 0, dy: STORE_LAYOUT.gridSize },  // Down
      { dx: -STORE_LAYOUT.gridSize, dy: 0 }, // Left
    ];

    for (const dir of directions) {
      const newX = node.x + dir.dx;
      const newY = node.y + dir.dy;

      if (isWalkable(newX, newY)) {
        neighbors.push({
          x: newX,
          y: newY,
          f: 0,
          g: 0,
          h: 0
        });
      }
    }

    return neighbors;
  };

  const findPath = (start: Point, end: Point): string => {
    // Find nearest aisle points for start and end
    const startPoint = findNearestAislePoint(start);
    const endPoint = findNearestAislePoint(end);

    const openSet: Node[] = [];
    const closedSet: Node[] = [];
    const startNode: Node = { ...startPoint, f: 0, g: 0, h: 0 };
    const endNode: Node = { ...endPoint, f: 0, g: 0, h: 0 };

    openSet.push(startNode);

    while (openSet.length > 0) {
      let current = openSet[0];
      let currentIndex = 0;

      // Find node with lowest f score
      openSet.forEach((node, index) => {
        if (node.f < current.f) {
          current = node;
          currentIndex = index;
        }
      });

      // If we reached the end
      if (Math.abs(current.x - endNode.x) < STORE_LAYOUT.gridSize &&
          Math.abs(current.y - endNode.y) < STORE_LAYOUT.gridSize) {
        const path: Point[] = [];
        let temp: Node | undefined = current;
        while (temp) {
          path.push({ x: temp.x, y: temp.y });
          temp = temp.parent;
        }
        
        // Smooth the path
        const smoothedPath = smoothPath(path.reverse());
        
        // Convert path to SVG path string with curves
        return createSmoothSvgPath(smoothedPath);
      }

      // Remove current from openSet and add to closedSet
      openSet.splice(currentIndex, 1);
      closedSet.push(current);

      // Check neighbors
      const neighbors = getNeighbors(current);
      for (const neighbor of neighbors) {
        if (closedSet.some(node => 
          Math.abs(node.x - neighbor.x) < STORE_LAYOUT.gridSize &&
          Math.abs(node.y - neighbor.y) < STORE_LAYOUT.gridSize
        )) {
          continue;
        }

        const gScore = current.g + heuristic(current, neighbor);
        let isNewPath = false;

        const existingNeighbor = openSet.find(node => 
          Math.abs(node.x - neighbor.x) < STORE_LAYOUT.gridSize &&
          Math.abs(node.y - neighbor.y) < STORE_LAYOUT.gridSize
        );

        if (!existingNeighbor) {
          openSet.push(neighbor);
          isNewPath = true;
          neighbor.h = heuristic(neighbor, endNode);
        } else {
          isNewPath = gScore < existingNeighbor.g;
          if (isNewPath) {
            neighbor.g = existingNeighbor.g;
            neighbor.f = existingNeighbor.f;
            neighbor.parent = existingNeighbor.parent;
          }
        }

        if (isNewPath) {
          neighbor.parent = current;
          neighbor.g = gScore;
          neighbor.f = neighbor.g + neighbor.h;
        }
      }
    }

    // No path found
    return "";
  };

  // Path smoothing
  const smoothPath = (path: Point[]): Point[] => {
    if (path.length <= 2) return path;

    const smoothed: Point[] = [path[0]];
    let current = 0;

    while (current < path.length - 1) {
      let furthest = current + 1;
      
      // Look ahead for the furthest visible point
      for (let i = current + 2; i < path.length; i++) {
        if (isLineWalkable(path[current], path[i])) {
          furthest = i;
        }
      }

      smoothed.push(path[furthest]);
      current = furthest;
    }

    return smoothed;
  };

  // Check if a straight line between two points is walkable
  const isLineWalkable = (start: Point, end: Point): boolean => {
    const steps = Math.max(
      Math.abs(end.x - start.x),
      Math.abs(end.y - start.y)
    ) / (STORE_LAYOUT.gridSize / 2);

    for (let i = 0; i <= steps; i++) {
      const x = start.x + (end.x - start.x) * (i / steps);
      const y = start.y + (end.y - start.y) * (i / steps);
      
      if (!isWalkable(x, y)) {
        return false;
      }
    }

    return true;
  };

  // Create smooth SVG path with curves
  const createSmoothSvgPath = (points: Point[]): string => {
    if (points.length < 2) return "";
    if (points.length === 2) {
      return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
    }

    let path = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 1; i < points.length - 1; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];

      // Calculate control points
      const cp1x = p1.x - (p2.x - p0.x) / 6;
      const cp1y = p1.y - (p2.y - p0.y) / 6;
      const cp2x = p1.x + (p2.x - p0.x) / 6;
      const cp2y = p1.y + (p2.y - p0.y) / 6;

      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    return path;
  };

  useEffect(() => {
    if (selectedDepartment && STORE_LAYOUT.departments[selectedDepartment]) {
      const dept = STORE_LAYOUT.departments[selectedDepartment];
      const start = STORE_LAYOUT.entrance;
      const end = {
        x: dept.x + dept.width / 2,
        y: dept.y + dept.height / 2,
      };
      const path = findPath(start, end);
      setCurrentPath(path);
    } else {
      setCurrentPath("");
    }
  }, [selectedDepartment]);

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  const renderMap = () => (
    <Svg 
      width={STORE_LAYOUT.width} 
      height={STORE_LAYOUT.height}
      viewBox={`0 0 ${STORE_LAYOUT.width} ${STORE_LAYOUT.height}`}
      style={{
        transform: [
          { scale },
          { translateX: position.x },
          { translateY: position.y },
        ],
      }}
    >
      {/* Store Outline */}
      <Rect
        x={0}
        y={0}
        width={STORE_LAYOUT.width}
        height={STORE_LAYOUT.height}
        fill="white"
        stroke="#ccc"
        strokeWidth={2}
      />

      {/* Walkable Paths */}
      {STORE_LAYOUT.walkablePaths.map((path, index) => (
        <Rect
          key={`path-${index}`}
          x={path.x}
          y={path.y}
          width={path.width}
          height={path.height}
          fill="#f8f8f8"
          stroke="#eee"
          strokeWidth={1}
        />
      ))}

      {/* Departments with Sections */}
      {Object.entries(STORE_LAYOUT.departments).map(([name, dept]) => (
        <G 
          key={name}
          onPress={() => onDepartmentPress?.(name as DepartmentName)}
        >
          {dept.sections.map((section, index) => (
            <Rect
              key={`${name}-section-${index}`}
              x={section.x}
              y={section.y}
              width={section.width}
              height={section.height}
              fill={selectedDepartment === name ? dept.color : `${dept.color}80`}
              stroke={selectedDepartment === name ? "#32a852" : "#ccc"}
              strokeWidth={selectedDepartment === name ? 2 : 1}
            />
          ))}
          <SvgText
            x={dept.x + dept.width/2}
            y={dept.y + dept.height/2}
            fontSize={12}
            textAnchor="middle"
            fill={selectedDepartment === name ? "#000" : "#666"}
            fontWeight={selectedDepartment === name ? "bold" : "normal"}
          >
            {name}
          </SvgText>
        </G>
      ))}

      {/* Aisle Labels */}
      {STORE_LAYOUT.aisleLabels.map((aisle) => (
        <SvgText
          key={aisle.id}
          x={aisle.x}
          y={aisle.y}
          fontSize={10}
          textAnchor="middle"
          fill="#666"
        >
          {aisle.id}
        </SvgText>
      ))}

      {/* Shopping Path */}
      {currentPath && (
        <Path
          d={currentPath}
          stroke="#32a852"
          strokeWidth={2}
          strokeDasharray="5,5"
          fill="none"
        />
      )}

      {/* Current Location */}
      <AnimatedCircle
        cx={STORE_LAYOUT.entrance.x}
        cy={STORE_LAYOUT.entrance.y}
        r={8}
        fill="#32a852"
        opacity={pulseAnim}
      />
      <Circle
        cx={STORE_LAYOUT.entrance.x}
        cy={STORE_LAYOUT.entrance.y}
        r={4}
        fill="#32a852"
      />

      {/* Entrance Label */}
      <SvgText
        x={STORE_LAYOUT.entrance.x}
        y={STORE_LAYOUT.entrance.y + 20}
        fontSize={10}
        textAnchor="middle"
        fill="#666"
      >
        Entrance
      </SvgText>
    </Svg>
  );

  return (
    <View className="w-full h-full">
      <Modal
        visible={isFullScreen}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setIsFullScreen(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          {/* Header with improved exit button */}
          <View className="z-10 px-4 py-3 bg-white border-b border-gray-100">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-rubik-bold text-black-300">Store Map</Text>
              <TouchableOpacity 
                onPress={() => {
                  setIsFullScreen(false);
                  // Re-center in preview mode when returning
                  setTimeout(() => centerMapForPreview(), 100);
                }}
                className="p-4"
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Image source={icons.rightArrow} className="w-6 h-6 rotate-90" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Map container with constrained view */}
          <View 
            ref={mapRef}
            className="flex-1 bg-white overflow-hidden"
            {...panResponder.panHandlers}
          >
            {renderMap()}
          </View>

          {/* Zoom controls */}
          <View className="absolute bottom-8 right-4 bg-white rounded-lg shadow-lg">
            <TouchableOpacity 
              onPress={() => {
                const containerWidth = Dimensions.get('window').width;
                const containerHeight = Dimensions.get('window').height - 100;
                
                // Calculate minimum scale to fit store in container
                const minScale = Math.min(
                  containerWidth / STORE_LAYOUT.width,
                  containerHeight / STORE_LAYOUT.height
                );
                
                setScale(s => Math.min(minScale * 2, s + 0.1));
              }}
              className="p-4 border-b border-gray-100"
            >
              <Text className="text-2xl font-rubik-bold text-black-300">+</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                const containerWidth = Dimensions.get('window').width;
                const containerHeight = Dimensions.get('window').height - 100;
                
                // Calculate minimum scale to fit store in container
                const minScale = Math.min(
                  containerWidth / STORE_LAYOUT.width,
                  containerHeight / STORE_LAYOUT.height
                );
                
                setScale(s => Math.max(minScale, s - 0.1));
              }}
              className="p-4"
            >
              <Text className="text-2xl font-rubik-bold text-black-300">-</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <TouchableOpacity 
        className="w-full h-full"
        onPress={() => setIsFullScreen(true)}
        {...panResponder.panHandlers}
      >
        {renderMap()}
      </TouchableOpacity>
    </View>
  );
};

export default StoreMap; 