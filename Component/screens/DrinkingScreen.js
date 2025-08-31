import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
  TouchableOpacity,
} from 'react-native';
import axios, { endpoints } from '../../Configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';

export default function DrinkingScreen() {
  const [amount, setAmount] = useState(0);
  const amountRef = useRef(0);
  const intervalRef = useRef(null);
  const [token, setToken] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [targetWater, setTargetWater] = useState(1500); // mặc định

  const fetchWater = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('accessToken');
      setToken(storedToken);

      const storedTarget = await AsyncStorage.getItem('settingWater');
      if (storedTarget) setTargetWater(parseInt(storedTarget, 10));

      if (!storedToken) {
        console.log('Chưa có token');
        return;
      }

      const res = await axios.get(endpoints.getcurrwater, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      const waterAmount = res.data?.amount || 0;
      setAmount(waterAmount);
      amountRef.current = waterAmount;
    } catch (error) {
      console.error('Lỗi gọi API nước:', error.message);
      setAmount(0);
      amountRef.current = 0;
      Alert.alert('Lỗi', 'Không thể tải dữ liệu uống nước');
    }
  };

  // gọi 1 lần khi vào
  useEffect(() => {
    fetchWater();
  }, []);

  // gọi lại khi quay lại màn hình
  useFocusEffect(
    useCallback(() => {
      fetchWater();
    }, [])
  );

  const handlePressIn = () => {
    intervalRef.current = setInterval(() => {
      setAmount((prev) => {
        const newAmount = Math.min(prev + 10, targetWater);
        amountRef.current = newAmount;
        return newAmount;
      });
    }, 100);
  };

  const handlePressOut = async () => {
    clearInterval(intervalRef.current);

    try {
      if (!token) return;
      await axios.patch(
        endpoints.updatewater,
        { amount: amountRef.current },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('Cập nhật lượng nước thành công');
    } catch (error) {
      console.error('Lỗi khi cập nhật nước:', error.message);
      Alert.alert('Lỗi', 'Không thể cập nhật lượng nước');
    }
  };

  const fetchHistory = async () => {
    try {
      if (!token) return;
      const res = await axios.get(endpoints.getallwater, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const grouped = {};
      res.data.forEach((item) => {
        const dateKey = item.date.split('T')[0];
        grouped[dateKey] = (grouped[dateKey] || 0) + item.amount;
      });

      const newMarked = {};
      Object.entries(grouped).forEach(([date, amount]) => {
        newMarked[date] = { amount };
      });

      setMarkedDates(newMarked);
    } catch (error) {
      console.error('Lỗi tải lịch sử nước:', error.message);
    }
  };

  const openCalendar = () => {
    setModalVisible(true);
    fetchHistory();
  };

  const percent = targetWater
    ? Math.min(Math.round((amount / targetWater) * 100), 100)
    : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.dateBox} onPress={openCalendar}>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('vi-VN')}
        </Text>
      </TouchableOpacity>

      <Text style={styles.title}>Drinking</Text>

      <Pressable
        style={styles.circleButton}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text style={styles.circleText}>
          {amount}/{targetWater} ml
        </Text>
      </Pressable>

      <Text style={styles.percent}>{percent}%</Text>

      <Modal
        visible={modalVisible}
        transparent={false}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Calendar
            dayComponent={({ date, state }) => {
              const dateStr = date.dateString;
              const amt = markedDates[dateStr]?.amount || null;

              return (
                <View style={{ alignItems: 'center', paddingVertical: 6 }}>
                  <Text
                    style={{
                      color: state === 'disabled' ? '#ccc' : '#000',
                      fontWeight: '600',
                    }}
                  >
                    {date.day}
                  </Text>
                  {amt !== null && (
                    <Text style={{ fontSize: 10, color: '#3b7c88' }}>
                      {amt}ml
                    </Text>
                  )}
                </View>
              );
            }}
            markingType={'custom'}
            markedDates={markedDates}
            style={{ borderRadius: 10 }}
          />

          <Pressable
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeText}>Đóng</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    alignItems: 'center',
    paddingTop: 80,
  },
  dateBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderColor: '#888',
  },
  dateText: {
    fontSize: 16,
    color: '#444',
  },
  title: {
    fontSize: 32,
    marginTop: 20,
    fontWeight: '600',
  },
  circleButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#3b7c88',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  circleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
  },
  percent: {
    fontSize: 18,
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    marginTop: 60,
  },
  closeButton: {
    marginTop: 20,
    alignSelf: 'center',
    padding: 10,
    backgroundColor: '#3b7c88',
    borderRadius: 8,
  },
  closeText: {
    color: '#fff',
    fontWeight: '600',
  },
});
