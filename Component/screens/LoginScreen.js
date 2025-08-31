import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import axios, { endpoints } from '../../Configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hàm tạo UID giả cho mỗi user trên thiết bị
const getCurrentUserUid = async () => {
  let uid = await AsyncStorage.getItem('userUid');
  if (!uid) {
    uid = 'user-' + Date.now(); // UID duy nhất
    await AsyncStorage.setItem('userUid', uid);
  }
  return uid;
};

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      // 1️⃣ Login API của bạn
      const res = await axios.post(endpoints.login, {
        username,
        password,
      });

      console.log('Đăng nhập thành công:', res.data);

      const token = res.data?.result.token;
      const role = res.data?.result.role;
      const settingId = String(res.data?.result.currentsetting);
      const uid = String(res.data?.result.uid);
      const avatar = String(res.data?.result.avatarUrl);

      // Lưu token + role + settingId
      await AsyncStorage.setItem('accessToken', token);
      await AsyncStorage.setItem('userRole', role);
      await AsyncStorage.setItem('settingId', settingId);
      await AsyncStorage.setItem('UID',uid);
      await AsyncStorage.setItem('avatar',avatar);


      // 3️⃣ Điều hướng theo role
      if (role === 'User') {
        navigation.navigate('Main'); // màn hình cho user
      } else if (role === 'Expert') {
        navigation.navigate('ExpertScreen'); // màn hình cho chuyên gia
      }
    } catch (err) {
      console.error('Lỗi đăng nhập:', err);
      Alert.alert('Lỗi khi gọi API:', err.response?.data || err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập username"
        value={username}
        onChangeText={setUsername}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập mật khẩu"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.linkRight}>
        <Text style={styles.linkText}>Forgot password</Text>
      </TouchableOpacity>

      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.bottomLink}>
          Don't have account? Register now
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#356859',
    padding: 24,
    justifyContent: 'center',
  },
  label: {
    color: '#fff',
    marginBottom: 4,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  linkRight: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  linkText: {
    color: '#fff',
    textDecorationLine: 'underline',
    fontSize: 12,
  },
  button: {
    backgroundColor: '#53A69D',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 24,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  bottomLink: {
    color: '#fff',
    fontSize: 12,
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: 20,
  },
});
