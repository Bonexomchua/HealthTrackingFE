import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { endpoints } from '../../Configs/APIs';
import { Calendar } from 'react-native-calendars';

export default function SleepingScreen() {
  const [isSleeping, setIsSleeping] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0); // giây
  const intervalRef = useRef(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [markedDates, setMarkedDates] = useState({});

  // bật/tắt tính giờ ngủ
  const toggleSleep = async () => {
    if (isSleeping) {
      // bấm lần 2 -> dừng
      clearInterval(intervalRef.current);
      const endTime = new Date();
      const total = Math.floor((endTime - startTime) / 1000);

      setElapsed(total);

      const hours = total / 3600;
      if (hours < 1) {
        Alert.alert('Cảnh báo', 'Bạn nên ngủ thêm!');
      } else {
        try {
          const storedToken = await AsyncStorage.getItem('accessToken');
          if (!storedToken) {
            Alert.alert('Lỗi', 'Chưa có token đăng nhập');
            return;
          }

          await axios.post(
            endpoints.addsleep,
            {
              timeStart: startTime.toISOString(),
              timeEnd: endTime.toISOString(),
            },
            { headers: { Authorization: `Bearer ${storedToken}` } }
          );

          Alert.alert('Thành công', `Đã ghi nhận giấc ngủ ${hours.toFixed(1)}h`);
        } catch (err) {
          console.error('Lỗi update sleep:', err.message);
          Alert.alert('Lỗi', 'Không thể lưu giấc ngủ');
        }
      }
      setStartTime(null);
    } else {
      // bấm lần 1 -> bắt đầu ngủ
      const now = new Date();
      setStartTime(now);
      setElapsed(0);

      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }

    setIsSleeping((prev) => !prev);
  };

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(
      2,
      '0'
    )}:${String(secs).padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  // lấy lịch sử sleep
  const fetchHistory = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('accessToken');
      if (!storedToken) return;

      const res = await axios.get(endpoints.getallsleep, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      const grouped = {};
      res.data.forEach((item) => {
        const dateKey = item.timeStart.split('T')[0];
        const start = new Date(item.timeStart);
        const end = new Date(item.timeEnd);
        const duration = Math.floor((end - start) / 60000); // phút
        grouped[dateKey] = (grouped[dateKey] || 0) + duration;
      });

      const newMarked = {};
      Object.entries(grouped).forEach(([date, duration]) => {
        newMarked[date] = { duration };
      });

      setMarkedDates(newMarked);
    } catch (error) {
      console.error('Lỗi tải lịch sử sleep:', error.message);
    }
  };

  const openCalendar = () => {
    setModalVisible(true);
    fetchHistory();
  };

  return (
    <View style={styles.container}>
      {/* Ô ngày tháng bấm để mở lịch */}
      <TouchableOpacity style={styles.dateBox} onPress={openCalendar}>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('vi-VN')}
        </Text>
      </TouchableOpacity>

      <Text style={styles.title}>Sleeping</Text>

      <Pressable style={styles.circleButton} onPress={toggleSleep}>
        <Text style={styles.circleText}>
          {isSleeping ? 'Ngủ...' : formatTime(elapsed)}
        </Text>
      </Pressable>

      <Text style={styles.status}>
        {isSleeping ? 'Đang trong trạng thái ngủ...' : 'Đã dừng'}
      </Text>

      {/* Modal hiển thị Calendar */}
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
              const duration = markedDates[dateStr]?.duration || null;

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
                  {duration !== null && (
                    <Text style={{ fontSize: 10, color: '#4caf50' }}>
                      {(duration / 60).toFixed(1)} giờ
                    </Text>
                  )}
                </View>
              );
            }}
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
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  circleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  status: {
    fontSize: 18,
    marginTop: 20,
    color: '#666',
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
    backgroundColor: '#4a90e2',
    borderRadius: 8,
  },
  closeText: {
    color: '#fff',
    fontWeight: '600',
  },
});
