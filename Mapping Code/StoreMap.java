import java.util.*;

public class StoreMap {
    private Map<String, Map<String, Integer>> adjacencyList = new HashMap<>();

    // Add a location to the store map
    public void addLocation(String location) {
        adjacencyList.putIfAbsent(location, new HashMap<>());
    }

    // Add a bidirectional path between two locations with a distance
    public void addPath(String from, String to, int distance) {
        adjacencyList.get(from).put(to, distance);
        adjacencyList.get(to).put(from, distance); // Bidirectional path
    }

    // Get adjacent locations for a given location
    public Map<String, Integer> getAdjacentLocations(String location) {
        return adjacencyList.get(location);
    }

    // Get all locations in the store
    public Set<String> getLocations() {
        return adjacencyList.keySet();
    }
}