import { View, Text, ScrollView, Pressable } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold text-gray-900 mb-4">Yousuf Rice</Text>
      <Text className="text-gray-600 mb-6">Premium quality rice delivered to your doorstep.</Text>
      <Link href="/products" asChild>
        <Pressable className="bg-green-600 rounded-xl p-4 mb-4">
          <Text className="text-white text-center font-semibold">Browse Products</Text>
        </Pressable>
      </Link>
      <Link href="/track-order/123" asChild>
        <Pressable className="bg-gray-100 rounded-xl p-4">
          <Text className="text-gray-800 text-center font-semibold">Track Your Order</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}
