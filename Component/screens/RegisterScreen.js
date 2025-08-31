import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import axios, { endpoints } from '../../Configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('male');
  const [birthday, setBirthday] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu không khớp');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Lỗi', 'Email không hợp lệ');
      return;
    }

    try {
      // 1. Gọi API đăng ký
      await axios.post(endpoints.register, {
        userName: username,
        fullName: fullName,
        gender,
        birthday,
        email,
        password,
        role,
      });

      // 2. Gọi API login để lấy token
      const loginRes = await axios.post(endpoints.login, {
        username: username,
        password: password,
      });

      const token = loginRes.data?.result.token;
      if (!token) throw new Error('Không lấy được token');

      // 3. Lưu token và username
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('username', username);

      Alert.alert('Thành công', 'Đăng ký & đăng nhập thành công! Tiếp tục nhập thông tin cơ thể.');
      navigation.navigate('RegisterStep2');

    } catch (error) {
      console.error('Lỗi:', error);
      Alert.alert('Lỗi', error.response?.data || error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Username</Text>
      <TextInput style={styles.input} value={username} onChangeText={setUsername} />

      <Text style={styles.label}>Full Name</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.radioContainer}>
        <TouchableOpacity style={styles.radioButton} onPress={() => setGender('male')}>
          <View style={styles.radioCircle}>
            {gender === 'male' && <View style={styles.radioDot} />}
          </View>
          <Text style={styles.radioLabel}>Nam</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.radioButton} onPress={() => setGender('female')}>
          <View style={styles.radioCircle}>
            {gender === 'female' && <View style={styles.radioDot} />}
          </View>
          <Text style={styles.radioLabel}>Nữ</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Birthday (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={birthday} onChangeText={setBirthday} />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />

      <Text style={styles.label}>Confirm Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <Text style={[styles.label, { marginTop: 16 }]}>Chọn vai trò</Text>
      <View style={styles.radioContainer}>
        <TouchableOpacity style={styles.radioButton} onPress={() => setRole('user')}>
          <View style={styles.radioCircle}>
            {role === 'user' && <View style={styles.radioDot} />}
          </View>
          <Text style={styles.radioLabel}>Người dùng</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.radioButton} onPress={() => setRole('expert')}>
          <View style={styles.radioCircle}>
            {role === 'expert' && <View style={styles.radioDot} />}
          </View>
          <Text style={styles.radioLabel}>Chuyên gia</Text>
        </TouchableOpacity>
      </View>

      <Pressable style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </Pressable>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.bottomLink}>Đã có tài khoản? Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#356859', padding: 24, justifyContent: 'center' },
  label: { color: '#fff', marginBottom: 4, marginTop: 16 },
  input: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  radioContainer: { flexDirection: 'row', marginTop: 8, gap: 16 },
  radioButton: { flexDirection: 'row', alignItems: 'center' },
  radioCircle: {
    height: 18, width: 18, borderRadius: 9, borderWidth: 2, borderColor: '#fff',
    justifyContent: 'center', alignItems: 'center', marginRight: 6
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  radioLabel: { color: '#fff', fontSize: 14 },
  button: {
    backgroundColor: '#53A69D', paddingVertical: 14, alignItems: 'center',
    borderRadius: 10, marginTop: 24, shadowColor: '#000', shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 3
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  bottomLink: { color: '#fff', fontSize: 12, textDecorationLine: 'underline', textAlign: 'center', marginTop: 20 },
});
