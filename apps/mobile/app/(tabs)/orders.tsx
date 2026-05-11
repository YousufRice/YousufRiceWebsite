import { View, Text, FlatList } from 'react-native';

const dummyOrders = [
  { id: 'ORD-001', status: 'delivered', total: 4750 },
  { id: 'ORD-002', status: 'out_for_delivery', total: 9000 },
];

export default function OrdersScreen() {
  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold text-gray-900 mb-4">My Orders</Text>
      <FlatList
        data={dummyOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-200">
            <Text className="font-semibold text-gray-800">{item.id}</Text>
            <Text className="text-gray-600 capitalize">{item.status.replace(/_/g, ' ')}</Text>
            <Text className="text-green-600 font-bold">Rs. {item.total}</Text>
          </View>
        )}
      />
    </View>
  );
}
