import {
  Alert,
  Image,
  ImageSourcePropType,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Share,
  Linking,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import * as ImagePicker from 'expo-image-picker';
import { ID } from "appwrite";
import { logout, account, storage, config } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { useShoppingList } from "@/lib/shopping-list-provider";

import icons from "@/constants/icons";

interface SettingsItemProp {
  icon: ImageSourcePropType;
  title: string;
  onPress?: () => void;
  textStyle?: string;
  showArrow?: boolean;
  subtitle?: string;
}

const SettingsItem = ({
  icon,
  title,
  onPress,
  textStyle,
  showArrow = true,
  subtitle,
}: SettingsItemProp) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex flex-row items-center justify-between py-3"
  >
    <View className="flex flex-row items-center gap-3">
      <Image source={icon} className="size-6" />
      <View>
        <Text className={`text-lg font-rubik-medium text-black-300 ${textStyle}`}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-sm font-rubik text-black-100">{subtitle}</Text>
        )}
      </View>
    </View>

    {showArrow && <Image source={icons.rightArrow} className="size-5" />}
  </TouchableOpacity>
);

const EditProfileModal = ({ visible, onClose, onSave, initialName }: {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  initialName: string;
}) => {
  const [name, setName] = useState(initialName);

  // rounded-t-3xl Why? in the second view where the border now is
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <View className="bg-white border-t border-gray-100 p-5"> 
          <View className="flex-row justify-between items-center mb-5 ">
            <Text className="text-xl font-rubik-bold text-black-300">Edit Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <Image source={icons.rightArrow} className="size-8 rotate-90" />
            </TouchableOpacity>
          </View>

          <Text className="text-sm font-rubik text-black-200 mb-2">Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            className="bg-gray-50 p-3 rounded-xl font-rubik text-black-300 mb-5 caret-green-600"
            placeholder="Enter your name"
          />

          <TouchableOpacity
            className="bg-primary-300 p-4 rounded-xl"
            onPress={() => {
              if (name.trim()) {
                onSave(name);
                onClose();
              }
            }}
          >
            <Text className="text-white font-rubik-bold text-center">Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const Profile = () => {
  const { user, refetch } = useGlobalContext();
  const { shoppingList } = useShoppingList();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const handleLogout = async () => {
    const result = await logout();
    if (result) {
      Alert.alert("Success", "Logged out successfully");
      refetch();
    } else {
      Alert.alert("Error", "Failed to logout");
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: "Check out Magnolia - The smart shopping assistant that helps you shop smarter!",
        title: "Share Magnolia",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleNotifications = () => {
    Alert.alert(
      "Notifications",
      "Would you like to receive notifications?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => {
            Alert.alert("Success", "Notifications enabled!");
          },
        },
      ]
    );
  };

  const handleSupport = async () => {
    const email = "support@magnolia.com";
    const subject = "Support Request";
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    
    const canOpen = await Linking.canOpenURL(mailtoUrl);
    if (canOpen) {
      await Linking.openURL(mailtoUrl);
    } else {
      Alert.alert("Error", "Could not open email client");
    }
  };

  const handlePrivacy = () => {
    Alert.alert(
      "Privacy Policy",
      "Our privacy policy can be found on our website. Would you like to view it?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "View",
          onPress: () => {
            Linking.openURL("https://magnolia.com/privacy");
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      "About Magnolia",
      "Magnolia v1.0.0\n\nYour smart shopping assistant that helps you shop smarter and save time. Created with ❤️",
      [{ text: "OK" }]
    );
  };

  const handleImagePick = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photos');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        try {
          const asset = result.assets[0];
          
          // Create file object in the format Appwrite expects
          const file = {
            uri: asset.uri,
            type: 'image/jpeg',
            name: 'profile.jpg',
            size: asset.fileSize || 0,
          };

          // Upload new image
          const uploadedFile = await storage.createFile(
            config.bucketId!,
            ID.unique(),
            file
          );

          // Get the file URL
          const fileUrl = storage.getFileView(config.bucketId!, uploadedFile.$id);

          // Update user's preferences
          await account.updatePrefs({
            avatar: fileUrl.href
          });

          // Refresh user data
          refetch();
          Alert.alert('Success', 'Profile picture updated successfully!');
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert('Error', 'Failed to upload image. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleNameUpdate = async (newName: string) => {
    try {
      await account.updateName(newName);
      refetch();
      Alert.alert('Success', 'Name updated successfully!');
    } catch (error) {
      console.error('Error updating name:', error);
      Alert.alert('Error', 'Failed to update name. Please try again.');
    }
  };

  return (
    <SafeAreaView className="h-full bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 px-5"
      >
        <View className="flex flex-row items-center justify-between py-5" style={{ marginTop: 58}}>
          <Text className="text-xl font-rubik-bold">Profile</Text>
          <TouchableOpacity onPress={handleNotifications}>
            <Image source={icons.bell} className="size-6" />
          </TouchableOpacity>
        </View>

        <View className="flex flex-row justify-center mt-5">
          <View className="flex flex-col items-center relative mt-5">
            <View>
              <Image
                source={{ uri: user?.avatar }}
                className="size-44 relative rounded-full"
              />
              <TouchableOpacity 
                className="absolute bottom-0 right-0 bg-primary-300 rounded-full p-2"
                onPress={() => Alert.alert("Coming Soon", "Profile picture editing will be available in a future update!")}
              >
                <Image source={icons.edit} className="size-5" tintColor="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              className="flex-row items-center mt-4" 
              onPress={() => setIsEditModalVisible(true)}
            >
              <Text className="text-2xl font-rubik-bold">{user?.name}</Text>
              <Image source={icons.edit} className="size-5 ml-2" />
            </TouchableOpacity>
            <Text className="text-sm font-rubik text-black-100 mt-1">{user?.email}</Text>
          </View>
        </View>

        <View className="flex flex-col mt-10 px-2">
          <SettingsItem 
            icon={icons.calendar} 
            title="My Lists" 
            subtitle={`${shoppingList.length} items in current list`}
            onPress={() => router.push("/list")}
          />
          <SettingsItem 
            icon={icons.wallet} 
            title="Payment Methods"
            subtitle="Add or manage payment methods"
            onPress={() => Alert.alert("Coming Soon", "Payment management will be available in a future update!")}
          />
        </View>

        <View className="flex flex-col mt-5 border-t pt-5 px-2 border-primary-200">
          <SettingsItem 
            icon={icons.people} 
            title="Share App" 
            onPress={handleShare}
          />
          <SettingsItem 
            icon={icons.info} 
            title="Support" 
            onPress={handleSupport}
          />
          <SettingsItem 
            icon={icons.shield} 
            title="Privacy Policy" 
            onPress={handlePrivacy}
          />
          <SettingsItem 
            icon={icons.info} 
            title="About" 
            onPress={handleAbout}
          />
        </View>

        <View className="flex flex-col border-t mt-5 pt-5 px-2 border-primary-200">
          <SettingsItem
            icon={icons.logout}
            title="Logout"
            textStyle="text-danger"
            showArrow={false}
            onPress={handleLogout}
          />
        </View>

        <EditProfileModal
          visible={isEditModalVisible}
          onClose={() => setIsEditModalVisible(false)}
          onSave={handleNameUpdate}
          initialName={user?.name || ''}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;