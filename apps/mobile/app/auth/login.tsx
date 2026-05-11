import { View, Text, TextInput, Pressable } from 'react-native';

export default function LoginScreen() {
  return (
    <View className="flex-1 bg-white p-6 justify-center">
      <Text className="text-2xl font-bold text-gray-900 mb-6 text-center">Welcome Back</Text>
      <TextInput placeholder="Phone Number" keyboardType="phone-pad" className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200" />
      <Pressable className="bg-green-600 rounded-xl p-4 mb-4">
        <Text className="text-white text-center font-semibold">Send OTP</Text>
      </Pressable>
      <Pressable>
        <Text className="text-green-600 text-center">Don't have an account? Register</Text>
      </Pressable>
    </View>
  );
}
