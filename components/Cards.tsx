<<<<<<< HEAD
import icons from "@/app/constants/icons";
import images from "@/app/constants/images";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { Models } from "react-native-appwrite";
=======
import icons from "@/constants/icons";
import images from "@/constants/images";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { Models } from "react-native-appwrite";
import { storage } from "@/lib/appwrite";
>>>>>>> AdamDatabaseBranch2

interface Props {
  item: Models.Document;
  onPress?: () => void;
}

<<<<<<< HEAD
export const FeaturedCard = ({ item, onPress }: Props) => {
=======
const getImageUrl = (bucketId: string, fileId: string) => {
  return storage.getFilePreview(bucketId, fileId).href;
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

>>>>>>> AdamDatabaseBranch2
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex flex-col items-start w-60 h-80 relative"
    >
<<<<<<< HEAD
      <Image source={{ uri: item.image }} className="size-full rounded-2xl" />
=======
      <Image source={{ uri: imageUrl }} className="size-full rounded-2xl" />
>>>>>>> AdamDatabaseBranch2

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
        <Text
          className="text-xl font-rubik-extrabold text-white"
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text className="text-base font-rubik text-white" numberOfLines={1}>
<<<<<<< HEAD
          {item.address}
=======
          {categoryDisplayName}
>>>>>>> AdamDatabaseBranch2
        </Text>

        <View className="flex flex-row items-center justify-between w-full">
          <Text className="text-xl font-rubik-extrabold text-white">
<<<<<<< HEAD
            ${item.price}
=======
            ${item.price.toFixed(2)}
>>>>>>> AdamDatabaseBranch2
          </Text>
          <Image source={icons.heart} className="size-5" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const Card = ({ item, onPress }: Props) => {
<<<<<<< HEAD
=======
  const imageUrl = getImageUrl("67bac197000f761b18ca", item.imageId);
  const categoryDisplayName = categoryDisplayNames[item.category] || item.category;

>>>>>>> AdamDatabaseBranch2
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

<<<<<<< HEAD
      <Image source={{ uri: item.image }} className="w-full h-40 rounded-lg" />
=======
      <Image source={{ uri: imageUrl }} className="w-full h-40 rounded-lg" />
>>>>>>> AdamDatabaseBranch2

      <View className="flex flex-col mt-2">
        <Text className="text-base font-rubik-bold text-black-300">
          {item.name}
        </Text>
        <Text className="text-xs font-rubik text-black-100">
<<<<<<< HEAD
          {item.address}
=======
          {categoryDisplayName}
>>>>>>> AdamDatabaseBranch2
        </Text>

        <View className="flex flex-row items-center justify-between mt-2">
          <Text className="text-base font-rubik-bold text-primary-300">
<<<<<<< HEAD
            ${item.price}
=======
            ${item.price.toFixed(2)}
>>>>>>> AdamDatabaseBranch2
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