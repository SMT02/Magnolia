import java.util.*;

public class ItemLocations {
    private Map<String, String> itemMap = new HashMap<>();

    // Add an item and its location
    public void addItem(String item, String location) {
        itemMap.put(item, location);
    }

    // Get the location of an item
    public String getLocation(String item) {
        return itemMap.get(item);
    }
}