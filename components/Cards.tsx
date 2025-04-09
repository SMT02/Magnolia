import icons from "@/constants/icons";
import images from "@/constants/images";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { Models } from "react-native-appwrite";
import { storage } from "@/lib/appwrite";

interface Props {
  item: Models.Document;
  onPress?: () => void;
}

// ✅ Use getFileView instead of getFilePreview (avoids image transformation error)
const getImageUrl = (bucketId: string, fileId?: string) => {
  if (!fileId) return null;
  return storage.getFileView(bucketId, fileId).href;
};

const categoryDisplayNames: { [key: string]: string } = {
  FruitsAndVegetables: "Fruits & Vegetables",
  MeatAndSeafood: "Meat & Seafood",
  DairyAndEggs: "Dairy & Eggs",
  Bakery: "Bakery",
  Beverages: "Beverages",
  FrozenFoods: "Frozen Foods",
  PantryStaples: "Pantry Staples",
  SnacksAndSweets: "Snacks & Sweets",
  HouseholdEssentials: "Household Essentials",
};

export const FeaturedCard = ({ item, onPress }: Props) => {
  const imageUrl = getImageUrl("67bac197000f761b18ca", item.imageId);
  const categoryDisplayName = categoryDisplayNames[item.category] || item.category;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex flex-col items-start w-60 h-80 relative"
    >
      {imageUrl && (
        <Image source={{ uri: imageUrl }} className="size-full rounded-2xl" />
      )}

      <Image
        source={images.cardGradient}
        className="size-full rounded-2xl absolute bottom-0"
      />

      <View className="flex flex-row items-center bg-white/90 px-3 py-1.5 rounded-full absolute top-5 right-5">
        <Image source={icons.star} className="size-3.5" />
        <Text className="text-xs font-rubik-bold text-primary-300 ml-1">
          {item.rating}
        </Text>
      </View>

      <View className="flex flex-col items-start absolute bottom-5 inset-x-5">
        <Text className="text-xl font-rubik-extrabold text-white" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-base font-rubik text-white" numberOfLines={1}>
          {categoryDisplayName}
        </Text>

        <View className="flex flex-row items-center justify-between w-full">
          <Text className="text-xl font-rubik-extrabold text-white">
            ${item.price.toFixed(2)}
          </Text>
          <Image source={icons.heart} className="size-5" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const Card = ({ item, onPress }: Props) => {
  const imageUrl = getImageUrl("67bac197000f761b18ca", item.imageId);

  const categoryDisplayName = categoryDisplayNames[item.category] || item.category;

  return (
    <TouchableOpacity
      className="flex-1 w-full mt-4 px-3 py-4 rounded-lg bg-white shadow-lg shadow-black-100/70 relative"
      onPress={onPress}
    >
      <View className="flex flex-row items-center absolute px-2 top-5 right-5 bg-white/90 p-1 rounded-full z-50">
        <Image source={icons.star} className="size-2.5" />
        <Text className="text-xs font-rubik-bold text-primary-300 ml-0.5">
          {item.rating}
        </Text>
      </View>

      {imageUrl && (
        <Image source={{ uri: imageUrl }} className="w-full h-40 rounded-lg" />
      )}

      <View className="flex flex-col mt-2">
        <Text className="text-base font-rubik-bold text-black-300">
          {item.name}
        </Text>
        <Text className="text-xs font-rubik text-black-100">
          {categoryDisplayName}
        </Text>

        <View className="flex flex-row items-center justify-between mt-2">
          <Text className="text-base font-rubik-bold text-primary-300">
            ${item.price.toFixed(2)}
          </Text>
          <Image
            source={icons.heart}
            className="w-5 h-5 mr-2"
            tintColor="#191D31"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};
