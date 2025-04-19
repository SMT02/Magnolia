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
  Platform
} from 'react-native';
import Svg, { 
  Path, 
  Rect, 
  Circle, 
  G,
  Text as SvgText,
  Line,
  Defs,
  ClipPath
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
  currentNavigationDepartment: DepartmentName | null;
}

// Store layout configuration with walkable paths
export const STORE_LAYOUT: StoreLayout = {
  width: 900,
  height: 700,
  walkablePaths: [
    // Main aisles (vertical)
    { x: 120, y: 50, width: 60, height: 500 },  // Left aisle
    { x: 430, y: 50, width: 60, height: 500 },  // Center aisle
    { x: 740, y: 50, width: 60, height: 500 },  // Right aisle
    // Cross aisles (horizontal)
    { x: 120, y: 50, width: 680, height: 60 },  // Top cross aisle
    { x: 120, y: 270, width: 680, height: 60 }, // Middle cross aisle
    { x: 120, y: 490, width: 680, height: 60 }, // Bottom cross aisle
    // Entrance path
    { x: 430, y: 550, width: 60, height: 80 },
  ],
  departments: {
    // Front right when entering
    FruitsAndVegetables: {
      x: 620, y: 50,
      width: 230, height: 170,
      color: "#e8f5e9",
      sections: [
        { x: 620, y: 50, width: 110, height: 170 },
        { x: 740, y: 50, width: 110, height: 170 }
      ]
    },
    // Front left when entering
    Bakery: {
      x: 50, y: 50,
      width: 230, height: 110,
      color: "#fff3e0",
      sections: [
        { x: 50, y: 50, width: 110, height: 110 },
        { x: 170, y: 50, width: 110, height: 110 }
      ]
    },
    // Back wall
    DairyAndEggs: {
      x: 50, y: 400,
      width: 280, height: 90,
      color: "#e3f2fd",
      sections: [
        { x: 50, y: 400, width: 130, height: 90 },
        { x: 190, y: 400, width: 130, height: 90 }
      ]
    },
    // Back right corner
    MeatAndSeafood: {
      x: 620, y: 400,
      width: 230, height: 90,
      color: "#ffebee",
      sections: [
        { x: 620, y: 400, width: 110, height: 90 },
        { x: 740, y: 400, width: 110, height: 90 }
      ]
    },
    // Center aisles near front
    Beverages: {
      x: 190, y: 110,
      width: 230, height: 150,
      color: "#e0f2f1",
      sections: [
        { x: 190, y: 110, width: 110, height: 150 },
        { x: 310, y: 110, width: 110, height: 150 }
      ]
    },
    // Right wall freezer section
    FrozenFoods: {
      x: 620, y: 230,
      width: 230, height: 160,
      color: "#e8eaf6",
      sections: [
        { x: 620, y: 230, width: 110, height: 160 },
        { x: 740, y: 230, width: 110, height: 160 }
      ]
    },
    // Center aisles
    PantryStaples: {
      x: 190, y: 330,
      width: 230, height: 150,
      color: "#fff3e0",
      sections: [
        { x: 190, y: 330, width: 110, height: 150 },
        { x: 310, y: 330, width: 110, height: 150 }
      ]
    },
    // Center aisles near back
    SnacksAndSweets: {
      x: 500, y: 330,
      width: 230, height: 150,
      color: "#fce4ec",
      sections: [
        { x: 500, y: 330, width: 110, height: 150 },
        { x: 620, y: 330, width: 110, height: 150 }
      ]
    },
    // Left wall, last aisles
    HouseholdEssentials: {
      x: 50, y: 170,
      width: 130, height: 220,
      color: "#f5f5f5",
      sections: [
        { x: 50, y: 170, width: 60, height: 220 },
        { x: 120, y: 170, width: 60, height: 220 }
      ]
    }
  },
  entrance: { x: 450, y: 600 },
  aisleLabels: [
    { id: "A1", x: 150, y: 200, label: "Household" },
    { id: "A2", x: 460, y: 200, label: "Center" },
    { id: "A3", x: 770, y: 200, label: "Produce" },
  ],
  aisles: {
    A1: {
      id: "A1",
      x: 120,
      y: 50,
      width: 60,
      height: 500,
      label: "Left Aisle",
      connectedTo: ["A2", "H1", "H2", "H3"]
    },
    A2: {
      id: "A2",
      x: 430,
      y: 50,
      width: 60,
      height: 500,
      label: "Center Aisle",
      connectedTo: ["A1", "A3", "H1", "H2", "H3"]
    },
    A3: {
      id: "A3",
      x: 740,
      y: 50,
      width: 60,
      height: 500,
      label: "Right Aisle",
      connectedTo: ["A2", "H1", "H2", "H3"]
    },
    H1: {
      id: "H1",
      x: 120,
      y: 50,
      width: 680,
      height: 60,
      label: "Top Cross Aisle",
      connectedTo: ["A1", "A2", "A3"]
    },
    H2: {
      id: "H2",
      x: 120,
      y: 270,
      width: 680,
      height: 60,
      label: "Middle Cross Aisle",
      connectedTo: ["A1", "A2", "A3"]
    },
    H3: {
      id: "H3",
      x: 120,
      y: 490,
      width: 680,
      height: 60,
      label: "Bottom Cross Aisle",
      connectedTo: ["A1", "A2", "A3"]
    }
  },
  gridSize: 15,
  currentNavigationDepartment: null,
};

interface Props {
  shoppingList: ShoppingListItem[];
  selectedDepartment?: DepartmentName;
  onDepartmentPress?: (department: DepartmentName) => void;
  currentNavigationItem?: ShoppingListItem | null;
  isFullScreen?: boolean;
  setIsFullScreen?: (isFullScreen: boolean) => void;
}

const StoreMap = ({ 
  shoppingList, 
  selectedDepartment, 
  onDepartmentPress, 
  currentNavigationItem,
  isFullScreen: externalIsFullScreen,
  setIsFullScreen: externalSetIsFullScreen
}: Props) => {
  const [scale, setScale] = useState(0.8);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [internalIsFullScreen, setInternalIsFullScreen] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [lastPanCoords, setLastPanCoords] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPinchDistance, setLastPinchDistance] = useState(0);
  const [initialTouchDistance, setInitialTouchDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(0);
  const mapRef = useRef<View>(null);
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  // Use external or internal fullscreen state based on what's provided
  const isFullScreen = externalIsFullScreen !== undefined ? externalIsFullScreen : internalIsFullScreen;
  const setIsFullScreen = externalSetIsFullScreen || setInternalIsFullScreen;

  // Initialize state for map view
  useEffect(() => {
    // Initialize with a proper scale and centered position
    centerMapForPreview();
  }, []);
  
  // Center the map in preview mode
  const centerMapForPreview = () => {
    const containerWidth = Dimensions.get('window').width - 40; // Adjust for margins
    const containerHeight = 500; // Approx height in preview mode
    
    // Calculate minimum scale to fit store in container
    const scaleX = containerWidth / STORE_LAYOUT.width;
    const scaleY = containerHeight / STORE_LAYOUT.height;
    const newScale = Math.min(scaleX, scaleY) * 0.85; // 85% to leave some margin
    
    // Calculate center position to position the store in the middle
    const posX = (containerWidth - STORE_LAYOUT.width * newScale) / 2 / newScale;
    const posY = (containerHeight - STORE_LAYOUT.height * newScale) / 2 / newScale;
    
    // Set initial scale and bounded position
    setScale(newScale);
    setPosition(constrainToBoundary({ x: posX, y: posY }, newScale));
  };

  // Calculate distance between two touches
  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Get midpoint between two touches for zoom origin
  const getMidpoint = (touches: any[]) => {
    if (touches.length < 2) {
      return { x: 0, y: 0 };
    }
    
    return {
      x: (touches[0].pageX + touches[1].pageX) / 2,
      y: (touches[0].pageY + touches[1].pageY) / 2,
    };
  };

  // Improved pan responder with smoother handling and pinch zoom
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only trigger for deliberate movements
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: (event) => {
        setIsDragging(true);
        setLastPanCoords({ x: 0, y: 0 });

        // Handle pinch to zoom start
        const touches = event.nativeEvent.touches || [];
        if (touches.length === 2) {
          const distance = getDistance(touches);
          setLastPinchDistance(distance);
          setInitialTouchDistance(distance);
          setInitialScale(scale);
        }
      },
      onPanResponderMove: (event, gestureState) => {
        const touches = event.nativeEvent.touches || [];
        
        // Handle pinch-to-zoom with two fingers
        if (touches.length === 2) {
          const distance = getDistance(touches);
          const midpoint = getMidpoint(touches);
          
          if (lastPinchDistance > 0) {
            // Calculate scale change with reduced sensitivity
            const scaleFactor = distance / initialTouchDistance;
            const newScale = Math.max(0.5, Math.min(2.0, initialScale * scaleFactor));
            
            // Calculate the point on the map under the midpoint of the touch
            const mapX = (midpoint.x - position.x) / scale;
            const mapY = (midpoint.y - position.y) / scale;
            
            // Adjust position to keep the touch midpoint stationary
            const newPosition = {
              x: midpoint.x - mapX * newScale,
              y: midpoint.y - mapY * newScale,
            };
            
            // Apply boundary constraints
            const boundedPosition = constrainToBoundary(newPosition, newScale);
            
            setScale(newScale);
            setPosition(boundedPosition);
          }
          
          setLastPinchDistance(distance);
        } 
        // Handle single finger panning
        else if (touches.length === 1) {
          const { dx, dy } = gestureState;
          
          // Calculate delta from last position with reduced sensitivity for smoother panning
          const deltaX = (dx - lastPanCoords.x) * 0.8;
          const deltaY = (dy - lastPanCoords.y) * 0.8;
          
          // Apply movement damping for smoother motion
          const newPosition = {
            x: position.x + deltaX / scale,
            y: position.y + deltaY / scale,
          };
          
          // Apply boundary constraints
          const boundedPosition = constrainToBoundary(newPosition, scale);
          
          setPosition(boundedPosition);
          setLastPanCoords({ x: dx, y: dy });
        }
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        setLastPinchDistance(0);
        
        // Bounce-back if map is dragged too far out of bounds
        const boundedPosition = constrainToBoundary(position, scale);
        if (boundedPosition.x !== position.x || boundedPosition.y !== position.y) {
          // Animate to new bounded position
          setPosition(boundedPosition);
        }
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
    // Check if point is on walkable paths
    return STORE_LAYOUT.walkablePaths.some(path => 
      x >= path.x && x <= path.x + path.width &&
      y >= path.y && y <= path.y + path.height
    );
  };

  const isPointInDepartment = (x: number, y: number): boolean => {
    // Check if point is within a department
    return Object.values(STORE_LAYOUT.departments).some(dept => {
      return dept.sections.some(section => 
        x >= section.x && x <= section.x + section.width &&
        y >= section.y && y <= section.y + section.height
      );
    });
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
      // Add diagonal directions for smoother paths
      { dx: STORE_LAYOUT.gridSize, dy: -STORE_LAYOUT.gridSize },  // Upper-right
      { dx: STORE_LAYOUT.gridSize, dy: STORE_LAYOUT.gridSize },   // Lower-right
      { dx: -STORE_LAYOUT.gridSize, dy: STORE_LAYOUT.gridSize },  // Lower-left
      { dx: -STORE_LAYOUT.gridSize, dy: -STORE_LAYOUT.gridSize }  // Upper-left
    ];

    for (const dir of directions) {
      const newX = node.x + dir.dx;
      const newY = node.y + dir.dy;

      // Check if the new position is walkable and NOT inside a department
      if (isWalkable(newX, newY) && !isPointInDepartment(newX, newY)) {
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

  // Generate multiple paths to each department based on shopping list
  const generateShoppingPaths = (shoppingList: ShoppingListItem[], departments: DepartmentName[]): string[] => {
    if (shoppingList.length === 0) return [];
    
    // Group items by department
    const departmentGroups: Record<string, ShoppingListItem[]> = {};
    shoppingList.forEach(item => {
      if (!departmentGroups[item.category]) {
        departmentGroups[item.category] = [];
      }
      departmentGroups[item.category].push(item);
    });
    
    // Define an optimal order to visit departments (match the aisle layout)
    const optimalOrder: DepartmentName[] = [
      'FruitsAndVegetables',
      'Bakery',
      'Beverages',
      'PantryStaples',
      'SnacksAndSweets',
      'HouseholdEssentials',
      'FrozenFoods',
      'DairyAndEggs',
      'MeatAndSeafood'
    ];
    
    // Filter and sort departments with items
    const departmentsToVisit = optimalOrder
      .filter(dept => departmentGroups[dept]?.length > 0);
    
    if (departmentsToVisit.length === 0) return [];
    
    // Generate paths from entrance to each department
    const paths: string[] = [];
    let start = STORE_LAYOUT.entrance;
    
    // Visit each department in the optimal order
    departmentsToVisit.forEach((dept, index) => {
      const deptInfo = STORE_LAYOUT.departments[dept];
      const nextPoint = {
        x: deptInfo.x + deptInfo.width / 2,
        y: deptInfo.y + deptInfo.height / 2
      };
      
      // Generate path from current point to this department
      const segmentPath = findPath(start, nextPoint);
      paths.push(segmentPath);
      
      // Update current point for next segment
      start = nextPoint;
    });
    
    return paths;
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
        // Skip if already in closed set
        if (closedSet.some(node => 
          Math.abs(node.x - neighbor.x) < STORE_LAYOUT.gridSize / 2 &&
          Math.abs(node.y - neighbor.y) < STORE_LAYOUT.gridSize / 2
        )) {
          continue;
        }

        // Calculate g score (movement cost)
        // Use Euclidean distance for diagonal movement cost
        const dx = neighbor.x - current.x;
        const dy = neighbor.y - current.y;
        const moveCost = Math.sqrt(dx * dx + dy * dy);
        const gScore = current.g + moveCost;
        
        // Check if this is a new path or a better path
        let isNewPath = false;

        const existingNeighbor = openSet.find(node => 
          Math.abs(node.x - neighbor.x) < STORE_LAYOUT.gridSize / 2 &&
          Math.abs(node.y - neighbor.y) < STORE_LAYOUT.gridSize / 2
        );

        if (!existingNeighbor) {
          // New node, add to open set
          neighbor.h = heuristic(neighbor, endNode);
          isNewPath = true;
          openSet.push(neighbor);
        } else {
          // Check if this path to the neighbor is better
          isNewPath = gScore < existingNeighbor.g;
          if (isNewPath) {
            existingNeighbor.g = gScore;
            existingNeighbor.f = existingNeighbor.g + existingNeighbor.h;
            existingNeighbor.parent = current;
          }
          continue;
        }

        if (isNewPath) {
          // Update the neighbor
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

  // Determine which department should be highlighted for navigation
  const navigationDepartment = currentNavigationItem?.category as DepartmentName;
  
  // Use effect to update paths when current navigation item changes
  useEffect(() => {
    if (currentNavigationItem) {
      // Update current navigation department
      STORE_LAYOUT.currentNavigationDepartment = currentNavigationItem.category as DepartmentName;
      
      // If we have a selected department and current navigation item, generate path to it
      if (selectedDepartment) {
        const paths = generateShoppingPaths(shoppingList, [currentNavigationItem.category as DepartmentName]);
        setCurrentPath(paths[0]);
      }
    } else {
      STORE_LAYOUT.currentNavigationDepartment = null;
    }
  }, [currentNavigationItem, selectedDepartment]);

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  // Color departments based on shopping list
  const getDepartmentStyle = (deptName: string) => {
    const dept = STORE_LAYOUT.departments[deptName as DepartmentName];
    const hasItems = shoppingList.some(item => item.category === deptName);
    const isSelected = selectedDepartment === deptName;
    const isNavigationTarget = navigationDepartment === deptName;
    
    let fillColor = dept.color;
    let strokeColor = "#ccc";
    let strokeWidth = 1;
    
    if (isSelected) {
      fillColor = dept.color;
      strokeColor = "#32a852";
      strokeWidth = 2;
    } else if (hasItems) {
      fillColor = dept.color;
      strokeColor = "#32a852";
      strokeWidth = 1.5;
    } else if (isNavigationTarget) {
      fillColor = 'rgba(255, 215, 0, 0.5)'; // Gold color for current target
      strokeColor = '#FF6B6B';
      strokeWidth = 2;
    } else {
      fillColor = `${dept.color}80`; // 50% opacity
    }
    
    return {
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth
    };
  };
  
  // Handle double tap to zoom in
  const doubleTapRef = useRef<NodeJS.Timeout | null>(null);
  const handleTap = (event: any) => {
    // Persist the event to prevent React from reusing/nullifying it
    if (event && typeof event.persist === 'function') {
      event.persist();
    }
    
    if (!isFullScreen) {
      setIsFullScreen(true);
      return;
    }

    if (doubleTapRef.current) {
      // This is a double tap
      clearTimeout(doubleTapRef.current);
      doubleTapRef.current = null;
      
      // Get tap coordinates and zoom in centered on that point
      if (!event || !event.nativeEvent) {
        return;
      }
      
      const locationX = event.nativeEvent.locationX || 0;
      const locationY = event.nativeEvent.locationY || 0;
      
      // Convert screen coordinates to map coordinates
      const mapX = (locationX - position.x) / scale;
      const mapY = (locationY - position.y) / scale;
      
      // Zoom in
      setScale(prev => Math.min(prev * 1.5, 2.0));
      
      // Adjust position to keep tapped point centered
      setPosition(prev => ({
        x: prev.x - (mapX * scale * 0.5),
        y: prev.y - (mapY * scale * 0.5)
      }));
    } else {
      // This might be a single tap or the first tap of a double tap
      doubleTapRef.current = setTimeout(() => {
        doubleTapRef.current = null;
        
        // This was a single tap - handle department selection if needed
        if (!isDragging && onDepartmentPress) {
          if (!event || !event.nativeEvent) {
            return;
          }
          
          const locationX = event.nativeEvent.locationX || 0;
          const locationY = event.nativeEvent.locationY || 0;
          
          // Convert screen coordinates to map coordinates
          const mapX = (locationX - position.x) / scale;
          const mapY = (locationY - position.y) / scale;
          
          // Check if tap is on a department
          Object.entries(STORE_LAYOUT.departments).forEach(([name, dept]) => {
            dept.sections.forEach(section => {
              if (
                mapX >= section.x && mapX <= section.x + section.width &&
                mapY >= section.y && mapY <= section.y + section.height
              ) {
                onDepartmentPress(name as DepartmentName);
              }
            });
          });
        }
      }, 300);
    }
  };
  
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
      {/* Define clip path to prevent viewing outside store boundaries */}
      <Defs>
        <ClipPath id="storeClip">
          <Rect
            x={0}
            y={0}
            width={STORE_LAYOUT.width}
            height={STORE_LAYOUT.height}
          />
        </ClipPath>
      </Defs>
      
      {/* Background to ensure no white space is visible */}
      <Rect
        x={-1000}
        y={-1000}
        width={STORE_LAYOUT.width + 2000}
        height={STORE_LAYOUT.height + 2000}
        fill="#f0f0f0"
      />
      
      {/* Store content with clip path applied */}
      <G clipPath="url(#storeClip)">
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

        {/* Shopping Path - Render BELOW departments */}
        {currentPath && (
          <Path
            d={currentPath}
            stroke="#32a852"
            strokeWidth={4}
            strokeDasharray="8,8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Departments with Sections */}
        {Object.entries(STORE_LAYOUT.departments).map(([name, dept]) => {
          const style = getDepartmentStyle(name);
          return (
            <G 
              key={name}
            >
              {dept.sections.map((section, index) => (
                <Rect
                  key={`${name}-section-${index}`}
                  x={section.x}
                  y={section.y}
                  width={section.width}
                  height={section.height}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={style.strokeWidth}
                />
              ))}
              <SvgText
                x={dept.x + dept.width/2}
                y={dept.y + dept.height/2}
                fontSize={12}
                fontWeight={selectedDepartment === name ? "bold" : "normal"}
                textAnchor="middle"
                fill={selectedDepartment === name ? "#000" : "#666"}
              >
                {name.replace(/([A-Z])/g, ' $1').trim()}
              </SvgText>
              
              {/* Show item count if there are items in this department */}
              {shoppingList.filter(item => item.category === name).length > 0 && (
                <G>
                  <Circle
                    cx={dept.x + 20}
                    cy={dept.y + 20}
                    r={12}
                    fill="#32a852"
                  />
                  <SvgText
                    x={dept.x + 20}
                    y={dept.y + 24}
                    fontSize={10}
                    textAnchor="middle"
                    fill="white"
                    fontWeight="bold"
                  >
                    {shoppingList.filter(item => item.category === name).length}
                  </SvgText>
                </G>
              )}
            </G>
          );
        })}

        {/* Aisle Labels */}
        {STORE_LAYOUT.aisleLabels.map((aisle) => (
          <G key={aisle.id}>
            <Circle
              cx={aisle.x}
              cy={aisle.y}
              r={15}
              fill="#e0e0e0"
            />
            <SvgText
              x={aisle.x}
              y={aisle.y + 4}
              fontSize={10}
              fontWeight="bold"
              textAnchor="middle"
              fill="#666"
            >
              {aisle.id}
            </SvgText>
          </G>
        ))}

        {/* Path endpoint markers - to make the route more visible */}
        {currentPath && shoppingList.length > 0 && (
          <G>
            {/* Destination markers for departments with items */}
            {Object.entries(STORE_LAYOUT.departments)
              .filter(([name]) => shoppingList.some(item => item.category === name))
              .map(([name, dept]) => (
                <Circle
                  key={`dest-${name}`}
                  cx={dept.x + dept.width/2}
                  cy={dept.y + dept.height/2}
                  r={7}
                  fill="#32a852"
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
          </G>
        )}

        {/* Current Location */}
        <AnimatedCircle
          cx={STORE_LAYOUT.entrance.x}
          cy={STORE_LAYOUT.entrance.y}
          r={10}
          fill="#32a852"
          opacity={pulseAnim}
        />
        <Circle
          cx={STORE_LAYOUT.entrance.x}
          cy={STORE_LAYOUT.entrance.y}
          r={5}
          fill="#32a852"
        />

        {/* Entrance Label */}
        <SvgText
          x={STORE_LAYOUT.entrance.x}
          y={STORE_LAYOUT.entrance.y + 25}
          fontSize={10}
          fontWeight="bold"
          textAnchor="middle"
          fill="#666"
        >
          Entrance
        </SvgText>
      </G>
    </Svg>
  );

  // For map controls, add smooth zooming functions
  const zoomIn = () => {
    // Smoothly zoom in centered on the current view
    const newScale = Math.min(scale * 1.2, 2.0);
    
    // Get center of current view
    const viewWidth = Dimensions.get('window').width;
    const viewHeight = Dimensions.get('window').height;
    const centerX = viewWidth / 2;
    const centerY = viewHeight / 2;
    
    // Calculate map coordinates under the center point
    const mapX = (centerX - position.x) / scale;
    const mapY = (centerY - position.y) / scale;
    
    // Adjust position to keep center point stationary
    const newPosition = {
      x: centerX - mapX * newScale,
      y: centerY - mapY * newScale,
    };
    
    // Apply boundary constraints
    const boundedPosition = constrainToBoundary(newPosition, newScale);
    
    setScale(newScale);
    setPosition(boundedPosition);
  };
  
  const zoomOut = () => {
    // Smoothly zoom out centered on the current view
    const newScale = Math.max(scale / 1.2, 0.5);
    
    // Get center of current view
    const viewWidth = Dimensions.get('window').width;
    const viewHeight = Dimensions.get('window').height;
    const centerX = viewWidth / 2;
    const centerY = viewHeight / 2;
    
    // Calculate map coordinates under the center point
    const mapX = (centerX - position.x) / scale;
    const mapY = (centerY - position.y) / scale;
    
    // Adjust position to keep center point stationary
    const newPosition = {
      x: centerX - mapX * newScale,
      y: centerY - mapY * newScale,
    };
    
    // Apply boundary constraints
    const boundedPosition = constrainToBoundary(newPosition, newScale);
    
    setScale(newScale);
    setPosition(boundedPosition);
  };

  // Add this after the panResponder definition
  // Function to constrain position to the store boundaries
  const constrainToBoundary = (pos: { x: number, y: number }, currentScale: number): { x: number, y: number } => {
    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height;
    
    // Calculate the scaled dimensions of the map
    const scaledMapWidth = STORE_LAYOUT.width * currentScale;
    const scaledMapHeight = STORE_LAYOUT.height * currentScale;
    
    // Ensure the map always fills the screen
    // This prevents seeing outside the map boundaries
    const minX = Math.min(0, windowWidth - scaledMapWidth);
    const maxX = 0;
    const minY = Math.min(0, windowHeight - scaledMapHeight);
    const maxY = 0;
    
    return {
      x: Math.max(minX, Math.min(maxX, pos.x)),
      y: Math.max(minY, Math.min(maxY, pos.y)),
    };
  };

  return (
    <View className="w-full h-full">
      <TouchableOpacity 
        onPress={(event) => {
          if (event && typeof event.persist === 'function') {
            event.persist();
          }
          handleTap(event);
        }}
        className="w-full h-full"
      >
        {renderMap()}
        
        {/* Expand button */}
        <TouchableOpacity
          onPress={() => setIsFullScreen(true)}
          className="absolute bottom-4 right-4 bg-white rounded-full p-2 shadow-md"
          style={{
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1.5,
          }}
        >
          <Text className="font-rubik text-primary-300">Expand Map</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      <Modal
        visible={isFullScreen}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setIsFullScreen(false)}
      >
        <SafeAreaView className="flex-1 bg-gray-100">
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
            className="flex-1 bg-gray-100 overflow-hidden justify-center items-center"
            style={{
              paddingHorizontal: 8,
              paddingVertical: 8,
            }}
            onTouchStart={(event) => {
              if (event && typeof event.persist === 'function') {
                event.persist();
              }
              handleTap(event);
            }}
            {...panResponder.panHandlers}
          >
            <View
              className="border-2 border-gray-300 rounded-lg overflow-hidden"
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#f0f0f0',
              }}
            >
              {renderMap()}
            </View>
          </View>

          {/* Legend and zoom controls */}
          <View className="absolute bottom-24 right-4 bg-white rounded-lg shadow-lg p-3">
            <Text className="text-sm font-rubik-medium mb-2">Legend</Text>
            <View className="flex-row items-center mb-1">
              <View className="w-3 h-3 bg-primary-300 rounded-full mr-2" />
              <Text className="text-xs font-rubik">Items in cart</Text>
            </View>
            <View className="flex-row items-center mb-1">
              <View className="w-3 h-3 bg-gray-200 rounded-full mr-2" />
              <Text className="text-xs font-rubik">Aisle marker</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-6 h-1 bg-primary-300 mr-2" style={{ borderStyle: 'dashed', borderWidth: 1 }} />
              <Text className="text-xs font-rubik">Suggested path</Text>
            </View>
          </View>

          {/* Zoom controls with improved behavior */}
          <View className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg">
            <TouchableOpacity 
              onPress={zoomIn}
              className="p-3 border-b border-gray-100"
            >
              <Text className="text-xl font-rubik-bold">+</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={zoomOut}
              className="p-3"
            >
              <Text className="text-xl font-rubik-bold">-</Text>
            </TouchableOpacity>
          </View>
          
          {/* Center map button */}
          <TouchableOpacity 
            onPress={centerMapForPreview}
            className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg"
            style={{
              elevation: 3,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 1.5,
            }}
          >
            <Text className="font-rubik text-primary-300">Center Map</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default StoreMap; 