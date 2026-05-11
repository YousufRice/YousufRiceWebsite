import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function TrackOrderScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold text-gray-900 mb-4">Track Order</Text>
      <Text className="text-gray-600 mb-2">Order ID: {id}</Text>
      <View className="bg-green-50 rounded-xl p-4 mb-3 border border-green-200">
        <Text className="text-green-800 font-semibold">Order Placed</Text>
      </View>
      <View className="bg-green-50 rounded-xl p-4 mb-3 border border-green-200">
        <Text className="text-green-800 font-semibold">Accepted</Text>
      </View>
      <View className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-200">
        <Text className="text-gray-600">Out for Delivery</Text>
      </View>
      <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <Text className="text-gray-600">Delivered</Text>
      </View>
    </View>
  );
}
