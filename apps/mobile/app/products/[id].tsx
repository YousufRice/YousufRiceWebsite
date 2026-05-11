import { View, Text, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold text-gray-900 mb-2">Product {id}</Text>
      <Text className="text-gray-600 mb-4">Premium quality rice with tier-based pricing.</Text>
      <View className="bg-gray-50 rounded-xl p-4 mb-4">
        <Text className="text-gray-700">2-4 kg: Rs. 475/kg</Text>
        <Text className="text-gray-700">5-9 kg: Rs. 450/kg</Text>
        <Text className="text-gray-700">10+ kg: Rs. 425/kg</Text>
      </View>
      <Pressable className="bg-green-600 rounded-xl p-4">
        <Text className="text-white text-center font-semibold">Add to Cart</Text>
      </Pressable>
    </ScrollView>
  );
}
