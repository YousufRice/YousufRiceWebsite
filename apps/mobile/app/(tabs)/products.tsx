import { View, Text, FlatList, Pressable } from 'react-native';
import { Link } from 'expo-router';

const dummyProducts = [
  { id: '1', name: 'Every Grain XXXL', price: 475 },
  { id: '2', name: 'Steam Rice Platinum', price: 495 },
];

export default function ProductsScreen() {
  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold text-gray-900 mb-4">Products</Text>
      <FlatList
        data={dummyProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={`/products/${item.id}`} asChild>
            <Pressable className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-200">
              <Text className="text-lg font-semibold text-gray-800">{item.name}</Text>
              <Text className="text-green-600 font-bold">Rs. {item.price}/kg</Text>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}
