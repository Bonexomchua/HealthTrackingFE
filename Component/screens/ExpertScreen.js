import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { endpoints, BASE_URL } from '../../Configs/APIs';
import {
  Modal, TextInput, ScrollView
} from 'react-native';

export default function ExpertScreen({ navigation }) {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Setting state
  const [settingName, setSettingName] = useState("");
  const [waterAmount, setWaterAmount] = useState("");
  const [foods, setFoods] = useState([""]);

  // Activity list
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const loadAvatar = async () => {
      const savedAvatar = await AsyncStorage.getItem('avatar');
      setAvatarUrl(savedAvatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png");
    };
    loadAvatar();
  }, []);
  const addFoodField = () => setFoods([...foods, ""]);
  const updateFood = (text, index) => {
    const arr = [...foods];
    arr[index] = text;
    setFoods(arr);
  };

  const addActivity = () => {
    setActivities([
      ...activities,
      { name: "", duration: "", rate: "", video: null },
    ]);
  };

  const updateActivity = (index, field, value) => {
    const arr = [...activities];
    arr[index][field] = value;
    setActivities(arr);
  };

  const pickVideo = async (index) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });

    if (!result.canceled) {
      updateActivity(index, "video", result.assets[0]);
    }
  };

  const submitForm = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");

      // 1. Create Setting
      const settingRes = await axios.post(
        BASE_URL + endpoints.createsetting,
        {
          userId: "77d5a723-a3f7-41ad-93e0-8e95dedf832f",
          settingName,
          waterAmount: parseFloat(waterAmount),
          food: foods.filter((f) => f.trim() !== ""),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const settingId = settingRes.data.id;


      // 2. Upload video + create activity
      for (const act of activities) {
        const videoData = new FormData();
        videoData.append("video", {
          uri: act.video.uri,
          type: act.video.mimeType || "video/quicktime",
          name: act.video.fileName || "video.mov",
        });


        const uploadRes = await axios.post(
          BASE_URL + endpoints['uploadvideo'],
          videoData,
          { headers: { 
            Authorization: `Bearer ${token}`} }
        );

        const videoUrl = uploadRes.data.videoUrl;

        //console.log(videoUrl);

        await axios.post(
          BASE_URL + endpoints.createactivity,
          {
            name: act.name,
            userId: "77d5a723-a3f7-41ad-93e0-8e95dedf832f",
            authorId: "8cebcea7-1ff6-4fc8-802a-49cbe3fc121a",
            settingId,
            videoUrl,
            duration: parseInt(act.duration),
            rate: parseInt(act.rate),
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      Alert.alert("Thành công", "Đã tạo setting + bài tập");
      setShowModal(false);
    } catch (err) {
      console.error("Submit error:", err);
      Alert.alert("Lỗi", "Không tạo được setting");
    }
  };


  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Bạn cần cấp quyền truy cập ảnh!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      await uploadAvatar(asset);
    }
  };

  const uploadAvatar = async (asset) => {
    try {
      setUploading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const url = BASE_URL + endpoints['uploadavatar'];


      const formData = new FormData();
      formData.append('avatar', {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || 'avatar.jpg',
      });

      const res = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          //'Content-Type': 'multipart/form-data',
        },
      });

      const newAvatarUrl = res.data.avatarUrl;
      if (!newAvatarUrl) throw new Error("Backend không trả về URL");

      setAvatarUrl(newAvatarUrl);
      await AsyncStorage.setItem('avatar', newAvatarUrl);
      Alert.alert("Upload avatar thành công!");
    } catch (error) {
      console.error("Upload avatar error:", error);
      Alert.alert("Upload avatar thất bại!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chào mừng, Chuyên gia!</Text>
      <Text style={styles.subtitle}>Bạn đã đăng nhập với vai trò chuyên gia.</Text>

      <TouchableOpacity onPress={pickImage}>
        <View>
          <Image
            source={{ uri: avatarUrl?.trim() || "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
            style={styles.avatar}
          />
          {uploading && (
            <ActivityIndicator
              size="small"
              color="#fff"
              style={{
                position: 'absolute',
                top: '40%',
                left: '40%',
              }}
            />
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>Đăng xuất</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.buttonText}>➕ Thêm Setting</Text>
      </TouchableOpacity>

      {/* Modal Form */}
      <Modal visible={showModal} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#1D3557' }}>
          <ScrollView style={{ padding: 20 }}>
            <Text style={styles.title}>Tạo Setting</Text>

            <TextInput
              placeholder="Tên Setting"
              value={settingName}
              onChangeText={setSettingName}
              style={styles.input}
            />
            <TextInput
              placeholder="Lượng nước (ml)"
              value={waterAmount}
              keyboardType="numeric"
              onChangeText={setWaterAmount}
              style={styles.input}
            />

            <Text style={styles.subtitle}>Danh sách Food</Text>
            {foods.map((food, i) => (
              <TextInput
                key={i}
                placeholder={`Món ăn ${i + 1}`}
                value={food}
                onChangeText={(t) => updateFood(t, i)}
                style={styles.input}
              />
            ))}
            <TouchableOpacity onPress={addFoodField}>
              <Text style={styles.addBtn}>+ Thêm món ăn</Text>
            </TouchableOpacity>

            <Text style={styles.subtitle}>Danh sách Bài tập</Text>
            {activities.map((act, i) => (
              <View key={i} style={styles.activityBox}>
                <TextInput
                  placeholder="Tên bài tập"
                  value={act.name}
                  onChangeText={(t) => updateActivity(i, "name", t)}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Thời gian (phút)"
                  value={act.duration}
                  onChangeText={(t) => updateActivity(i, "duration", t)}
                  keyboardType="numeric"
                  style={styles.input}
                />
                <TextInput
                  placeholder="Rate"
                  value={act.rate}
                  onChangeText={(t) => updateActivity(i, "rate", t)}
                  keyboardType="numeric"
                  style={styles.input}
                />
                <TouchableOpacity onPress={() => pickVideo(i)}>
                  <Text style={styles.addBtn}>
                    {act.video ? "✅ Video đã chọn" : "🎥 Chọn video"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={addActivity}>
              <Text style={styles.addBtn}>+ Thêm bài tập</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={submitForm}>
              <Text style={styles.buttonText}>Hoàn thành</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D3557',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f0faeeff',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#A8DADC',
    marginBottom: 32,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#53A69D',
  },
  button: {
    backgroundColor: '#E63946',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#137b1a00",
  },
  addBtn: { color: "#00f", marginBottom: 10 },
  activityBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },

});
