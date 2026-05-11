import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';

export default function CheckoutScreen() {
  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold text-gray-900 mb-4">Checkout</Text>
      <TextInput placeholder="Full Name" className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-200" />
      <TextInput placeholder="Phone Number" keyboardType="phone-pad" className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-200" />
      <TextInput placeholder="Delivery Address" multiline className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-200 h-20" />
      <View className="bg-gray-50 rounded-xl p-4 mb-4">
        <Text className="text-gray-700 font-semibold">Order Summary</Text>
        <Text className="text-gray-600">Total: Rs. 0</Text>
      </View>
      <Pressable className="bg-green-600 rounded-xl p-4">
        <Text className="text-white text-center font-semibold">Place Order (COD)</Text>
      </Pressable>
    </ScrollView>
  );
}
