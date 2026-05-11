import { View, Text, Pressable } from 'react-native';

export default function CartScreen() {
  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold text-gray-900 mb-4">Shopping Cart</Text>
      <Text className="text-gray-500">Your cart is empty.</Text>
      <Pressable className="bg-green-600 rounded-xl p-4 mt-6">
        <Text className="text-white text-center font-semibold">Checkout</Text>
      </Pressable>
    </View>
  );
}
