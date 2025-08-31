import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { endpoints } from '../../Configs/APIs';

export default function RegisterStep2({ navigation }) {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  const handleInitBodyMetric = async () => {
    if (!height || !weight) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ chiều cao và cân nặng');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');

      const res = await axios.post(
        endpoints['createmetric'],
        {
          userId: null,
          date: null,
          type: "weight",
          value: parseFloat(weight),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

            const res2 = await axios.post(
        endpoints['createmetric'],
        {
          userId: null,
          date: null,
          type: "height",
          value: parseFloat(height),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('Init bodymetric thành công:', res.data);
      Alert.alert('Thành công', 'Thông tin cơ thể đã được lưu!');
      navigation.navigate('Main');
    } catch (error) {
      console.error('Lỗi init bodymetric:', error);
      Alert.alert('Lỗi', error.response?.data || error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Chiều cao (cm)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={height} onChangeText={setHeight} />

      <Text style={styles.label}>Cân nặng (kg)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={weight} onChangeText={setWeight} />

      <Pressable style={styles.button} onPress={handleInitBodyMetric}>
        <Text style={styles.buttonText}>Hoàn tất</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#356859', padding: 24, justifyContent: 'center' },
  label: { color: '#fff', marginBottom: 4, marginTop: 16 },
  input: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  button: {
    backgroundColor: '#53A69D', paddingVertical: 14, alignItems: 'center',
    borderRadius: 10, marginTop: 24, shadowColor: '#000', shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 3
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
