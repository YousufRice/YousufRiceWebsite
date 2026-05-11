import React from 'react';
import { View, TextInput } from 'react-native';

export default function OtpInputNative() {
  return (
    <View>
      <TextInput maxLength={6} keyboardType="number-pad" className="border rounded p-2" />
    </View>
  );
}
