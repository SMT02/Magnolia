import java.util.*;

public class PathFinder {
    // Find the shortest path using Breadth-First Search (BFS)
    public static List<String> findShortestPath(StoreMap store, String start, String end) {
        if (!store.getLocations().contains(start) || !store.getLocations().contains(end)) {
            return Collections.emptyList(); // Invalid locations
        }

        // BFS setup
        Queue<String> queue = new LinkedList<>();
        Map<String, String> parentMap = new HashMap<>(); // To reconstruct the path
        Set<String> visited = new HashSet<>();

        queue.add(start);
        visited.add(start);
        parentMap.put(start, null);

        while (!queue.isEmpty()) {
            String current = queue.poll();

            // If we reach the destination, reconstruct the path
            if (current.equals(end)) {
                return reconstructPath(parentMap, end);
            }

            // Explore adjacent locations
            Map<String, Integer> adjacentLocations = store.getAdjacentLocations(current);
            if (adjacentLocations != null) {
                for (String neighbor : adjacentLocations.keySet()) {
                    if (!visited.contains(neighbor)) {
                        queue.add(neighbor);
                        visited.add(neighbor);
                        parentMap.put(neighbor, current);
                    }
                }
            }
        }

        return Collections.emptyList(); // No path found
    }

    // Reconstruct the path from the parent map
    private static List<String> reconstructPath(Map<String, String> parentMap, String end) {
        List<String> path = new ArrayList<>();
        String current = end;
        while (current != null) {
            path.add(current);
            current = parentMap.get(current);
        }
        Collections.reverse(path); // Reverse to get the correct order
        return path;
    }
}