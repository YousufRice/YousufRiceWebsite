import { View, Text, Pressable } from 'react-native';

export default function ProfileScreen() {
  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold text-gray-900 mb-4">Profile</Text>
      <Pressable className="bg-gray-100 rounded-xl p-4 mb-3">
        <Text className="text-gray-800 font-semibold">Edit Profile</Text>
      </Pressable>
      <Pressable className="bg-gray-100 rounded-xl p-4 mb-3">
        <Text className="text-gray-800 font-semibold">My Addresses</Text>
      </Pressable>
      <Pressable className="bg-red-50 rounded-xl p-4">
        <Text className="text-red-600 font-semibold">Logout</Text>
      </Pressable>
    </View>
  );
}
