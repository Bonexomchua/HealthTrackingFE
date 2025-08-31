import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { endpoints } from '../../Configs/APIs';
import { Calendar } from 'react-native-calendars';
import { Video } from 'expo-av';
import Checkbox from 'expo-checkbox';

export default function ExerciseScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // giây
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [token, setToken] = useState(null);

  // ⬇️ thêm state lưu activity
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (selectedActivity) {
      setTimeLeft(selectedActivity.duration * 60);
    } else {
      setTimeLeft(0);
    }
  }, [selectedActivity]);

  // bật/tắt đếm giờ
  const toggleTimer = async () => {
    if (!selectedActivity) {
      Alert.alert("Chọn 1 bài tập trước!");
      return;
    }

    if (isRunning) {
      clearInterval(intervalRef.current);

      try {
        const storedToken = await AsyncStorage.getItem('accessToken');
        if (!storedToken) {
          Alert.alert('Lỗi', 'Chưa có token đăng nhập');
          return;
        }
        const totalMinutes = selectedActivity.duration; // phút gốc
        const remainingMinutes = Math.ceil(timeLeft / 60); // còn lại (làm tròn lên)
        const practicedMinutes = totalMinutes - remainingMinutes;
        // gửi duration của activity
        await axios.patch(
          `${endpoints.updateexercise}?duration=${practicedMinutes}`,
          {},
          { headers: { Authorization: `Bearer ${storedToken}` } }
        );

        Alert.alert('Thành công', `Đã hoàn thành ${selectedActivity.name} ${practicedMinutes} phút`);
      } catch (err) {
        console.error('Lỗi update exercise:', err.message);
        Alert.alert('Lỗi', 'Không thể cập nhật bài tập');
      }
    } else {
      let totalSec = selectedActivity.duration * 60;
      setTimeLeft(totalSec);

      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    setIsRunning((prev) => !prev);
  };



  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  // lấy lịch sử tập luyện
  const fetchHistory = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('accessToken');
      if (!storedToken) return;

      const res = await axios.get(endpoints.getallexercise, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      const grouped = {};
      res.data.forEach((item) => {
        const dateKey = item.date.split('T')[0];
        grouped[dateKey] = (grouped[dateKey] || 0) + item.duration;
      });

      const newMarked = {};
      Object.entries(grouped).forEach(([date, duration]) => {
        newMarked[date] = { duration };
      });

      setMarkedDates(newMarked);
    } catch (error) {
      console.error('Lỗi tải lịch sử exercise:', error.message);
    }
  };

  const openCalendar = () => {
    setModalVisible(true);
    fetchHistory();
  };

  // ⬇️ gọi API getuseractivity khi load màn
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('accessToken');
        const settingId = await AsyncStorage.getItem('settingId');
        if (!storedToken) return;

        const res = await axios.get(`${endpoints.getuseractivity}?settingId=${settingId}`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        setActivities(res.data); // lưu danh sách
      } catch (err) {
        console.error('Lỗi load activity:', err.message);
      }
    };

    fetchActivities();
  }, []);

  return (
    <View style={styles.container}>
      {/* Ô ngày tháng bấm để mở lịch */}
      <TouchableOpacity style={styles.dateBox} onPress={openCalendar}>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('vi-VN')}
        </Text>
      </TouchableOpacity>

      <Text style={styles.title}>Exercise</Text>

      <Pressable style={styles.circleButton} onPress={toggleTimer}>
        <Text style={styles.circleText}>{formatTime(timeLeft)}</Text>
      </Pressable>

      <Text style={styles.status}>
        {isRunning ? 'Đang tập luyện...' : 'Đã dừng'}
      </Text>

      {/* Danh sách activity */}
      <FlatList
        data={activities}
        keyExtractor={(item, index) => index.toString()}
        style={{ marginTop: 20, width: '90%' }}
        extraData={selectedActivity}
        renderItem={({ item }) => (
          <View style={styles.activityCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Checkbox
                value={selectedActivity?.id === item.id}
                onValueChange={(checked) => {
                  if (checked) {
                    setSelectedActivity(item); // chọn
                  } else {
                    setSelectedActivity(null); // bỏ chọn
                  }
                }}
                color={selectedActivity?.id === item.id ? '#4caf50' : undefined}
              />
              <Text style={{ marginLeft: 8, fontWeight: '600' }}>{item.name}</Text>
            </View>
            <Text style={styles.activityTitle}>{item.name}</Text>
            <Text>⏱ Thời gian: {item.duration} phút</Text>
            <Text>📅 Tần suất: {item.rate} lần/tuần</Text>

            {item.videoUrl && (
              <Video
                source={{ uri: item.videoUrl }}
                style={styles.video}
                useNativeControls
                resizeMode="contain"
              />
            )}
          </View>
        )}
      />

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
                      {duration} phút
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
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  circleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 24,
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
    backgroundColor: '#4caf50',
    borderRadius: 8,
  },
  closeText: {
    color: '#fff',
    fontWeight: '600',
  },
  activityCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  video: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 10,
  },
});
