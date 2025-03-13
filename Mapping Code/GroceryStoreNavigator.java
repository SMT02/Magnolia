import java.util.Scanner;

public class GroceryStoreNavigator {
    public static void main(String[] args) {
        StoreMap store = new StoreMap();
        ItemLocations items = new ItemLocations();
        Scanner scanner = new Scanner(System.in);

        // Define the store layout and aisles
        store.addLocation("Entrance");
        store.addLocation("Fruits and Vegetables");
        store.addLocation("Bakery");
        store.addLocation("Beverages");
        store.addLocation("Pantry Staples");
        store.addLocation("Snacks and Sweets");
        store.addLocation("Household Essentials");
        store.addLocation("Meat and Seafood");
        store.addLocation("Frozen Foods");
        store.addLocation("Dairy and Eggs");

        // Define paths between locations (bidirectional)
        store.addPath("Entrance", "Fruits and Vegetables", 10);
        store.addPath("Fruits and Vegetables", "Bakery", 5);
        store.addPath("Bakery", "Beverages", 5);
        store.addPath("Beverages", "Pantry Staples", 5);
        store.addPath("Pantry Staples", "Snacks and Sweets", 5);
        store.addPath("Snacks and Sweets", "Household Essentials", 5);
        store.addPath("Household Essentials", "Meat and Seafood", 5);
        store.addPath("Meat and Seafood", "Frozen Foods", 5);
        store.addPath("Frozen Foods", "Dairy and Eggs", 5);

        // Add sample items and their locations
        items.addItem("Milk", "Dairy and Eggs");
        items.addItem("Bread", "Bakery");
        items.addItem("Ice Cream", "Frozen Foods");

        // Ask the user for their current location
        System.out.print("Enter your current location: ");
        String currentLocation = scanner.nextLine();

        // Keep asking for an item until a valid one is entered
        while (true) {
            System.out.print("Enter the item you're looking for (or type 'exit' to quit): ");
            String item = scanner.nextLine();

            // Allow the user to exit the loop
            if (item.equalsIgnoreCase("exit")) {
                System.out.println("Exiting the program. Goodbye!");
                break;
            }

            // Find the item's location
            String itemLocation = items.getLocation(item);
            if (itemLocation == null) {
                System.out.println("Item not found in the store. Please try again.");
            } else {
                // Find the shortest path to the item
                List<String> path = PathFinder.findShortestPath(store, currentLocation, itemLocation);
                if (path.isEmpty()) {
                    System.out.println("No path found to the item.");
                } else {
                    System.out.println("Path to " + item + ": " + String.join(" -> ", path));
                }
                break; // Exit the loop after finding a valid item
            }
        }
    }
}