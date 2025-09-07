import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, Pressable, StyleSheet, ActivityIndicator,
    TouchableOpacity, LayoutAnimation, Platform, UIManager, ScrollView,
    Modal, TextInput, Image,
    Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { endpoints, BASE_URL } from '../../Configs/APIs';
import { launchImageLibrary } from 'react-native-image-picker';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [weight, setWeight] = useState(null);
    const [height, setHeight] = useState(null);
    const [bmi, setBmi] = useState(null);
    const [settings, setSettings] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [currentSettingId, setCurrentSettingId] = useState(null);

    const [avatarUrl, setAvatarUrl] = useState(null); // thêm avatar state

    // modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [inputWeight, setInputWeight] = useState('');
    const [inputHeight, setInputHeight] = useState('');

    //Khai báo setting mặc định
    const defaultSettings = [
        {
            id: -1,
            settingName: "Cơ bản(mặc định)",
            waterAmount: 2000,
            exerciseDuration: 30,
            exerciseRate: 2,
            food: ["Ăn đủ chất"]
        },
        {
            id: -2,
            settingName: "Giảm cân(mặc định)",
            waterAmount: 2500,
            exerciseDuration: 45,
            exerciseRate: 7,
            food: ["Hạn chế đồ chiên, nướng, đồ ngọt", "Ưu tiên trứng, rau xanh, thịt nạc, cá hồi"]
        },
        {
            id: -3,
            settingName: "Tăng cân(mặc định)",
            waterAmount: 1500,
            exerciseDuration: 20,
            exerciseRate: 4,
            food: ["Ăn thịt đỏ, cá, trứng, sữa, trái bơ", "Chia nhiều bữa nhỏ"]
        },
    ];

    if (Platform.OS === 'android') {
        UIManager.setLayoutAnimationEnabledExperimental &&
            UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    const fetchMetrics = useCallback(async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const savedSettingId = await AsyncStorage.getItem('settingId');
            const savedAvatar = await AsyncStorage.getItem('avatar');
            setAvatarUrl(savedAvatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png");

            // Nếu chưa có settingId thì mặc định chọn -1
            if (savedSettingId) {
                setCurrentSettingId(Number(savedSettingId));
            } else {
                setCurrentSettingId(-1);
                await AsyncStorage.setItem('settingId', String(-1));
            }

            if (!token) {
                console.error('Token not found');
                setLoading(false);
                return;
            }

            // Lấy metric
            const metricUrl = BASE_URL + endpoints['getlatestmetric'];
            const res = await axios.get(metricUrl, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000
            });

            const data = Array.isArray(res.data) ? res.data : [];
            const weightObj = data.find(item => item.type === 'weight');
            const heightObj = data.find(item => item.type === 'height');

            const w = weightObj?.value || null;
            const h = heightObj?.value || null;

            setWeight(w);
            setHeight(h);
            setBmi(w && h ? (w / Math.pow(h / 100, 2)).toFixed(1) : null);

            // Lấy settings từ API rồi merge với default
            const settingsUrl = BASE_URL + endpoints['getallsetting'];
            const resSettings = await axios.get(settingsUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSettings([...defaultSettings, ...resSettings.data]);

        } catch (error) {
            console.error('Error fetching data:', error.message || error);
        } finally {
            setLoading(false);
        }
    }, []);


    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Bạn cần cấp quyền truy cập ảnh!');
            return;
        }

        let img = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        //console.log(img);

        if (!img.cancelled) {
            const file = img.assets[0];
            await uploadAvatar(file);
        }
    };

    const uploadAvatar = async (asset) => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const url = BASE_URL + endpoints['uploadavatar'];

            const formData = new FormData();

            console.log(asset.uri);

            formData.append('avatar', {
                uri: asset.uri,
                type: 'image/jpeg',
                name: 'avatar.jpg',
            });

            formData._parts.forEach(([key, value]) => {
                console.log(key, value);
            });

            const res = await axios.post(url, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    //'Content-Type': 'multipart/form-data',
                },
            });

            const data = await res.data;
            console.log(res.data);
            const newAvatarUrl = data.avatarUrl;

            setAvatarUrl(newAvatarUrl);
            await AsyncStorage.setItem('avatar', newAvatarUrl);

            alert("Upload avatar thành công!");
        } catch (error) {
            console.error("Upload avatar error:", error);
            alert("Upload avatar thất bại!");
        }
    };


    const updateCurrentSetting = async (id) => {
        try {
            // Nếu id là setting mặc định (id < 0) thì chỉ đổi local, không gọi API
            if (id < 0) {
                setCurrentSettingId(id);
                await AsyncStorage.setItem('settingId', String(id));
                alert("Đã chọn setting mặc định!");
                return;
            }

            const token = await AsyncStorage.getItem('accessToken');
            const url = BASE_URL + endpoints['updatecurrentsetting'];

            await axios.patch(url, null, {
                headers: { Authorization: `Bearer ${token}` },
                params: { settingID: id }
            });

            const selectedSetting = settings.find(s => s.id === id);
            await AsyncStorage.setItem('settingId', String(id));
            if (selectedSetting) {
                await AsyncStorage.setItem('settingWater', String(selectedSetting.waterAmount));
            }
            setCurrentSettingId(id);
            navigation.reset({
                index: 0,
                routes: [{ name: "Main" }], // màn hình gốc app
            });
            alert("Cập nhật setting thành công!");
        } catch (error) {
            console.error('Error updating setting:', error.message || error);
            alert("Cập nhật thất bại!");
        }
    };


    const createMetric = async () => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const url = BASE_URL + endpoints['createmetric'];

            await axios.post(
                url,
                { userId: null, date: null, type: "weight", value: parseFloat(inputWeight) },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await axios.post(
                url,
                { userId: null, date: null, type: "height", value: parseFloat(inputHeight) },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setModalVisible(false);
            fetchMetrics(); // load lại sau khi cập nhật
            alert("Cập nhật cân nặng, chiều cao thành công!");
        } catch (error) {
            console.error('Error creating metric:', error.message || error);
            alert("Cập nhật thất bại!");
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    const getBmiStatus = (bmiValue) => {
        if (!bmiValue) return '';
        const value = parseFloat(bmiValue);
        if (value < 18.5) return 'Gầy';
        if (value < 25) return 'Bình Thường';
        if (value < 30) return 'Thừa Cân';
        if (value < 35) return 'Béo Phì I';
        return 'Béo Phì II';
    };

    const toggleExpand = (id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    const bmiStatus = getBmiStatus(bmi);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#53A69D" />
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1 }}>
            <View style={styles.container}>
                <Text style={styles.title}>Profile Screen</Text>

                <TouchableOpacity onPress={pickImage}>
                    <Image
                        source={{
                            uri: avatarUrl?.trim() ? avatarUrl : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        }}
                        style={styles.avatar}
                    />
                </TouchableOpacity>

                <MetricBox label="Cân nặng" value={weight ? `${weight} kg` : '—'} />
                <MetricBox label="Chiều cao" value={height ? `${height} cm` : '—'} />
                <MetricBox label="BMI" value={bmi ? `${bmi} (${bmiStatus})` : '—'} />

                {/* nút cập nhật */}
                <Pressable
                    style={[styles.button, { marginTop: 10 }]}
                    onPress={() => {
                        setInputWeight(weight ? String(weight) : '');
                        setInputHeight(height ? String(height) : '');
                        setModalVisible(true);
                    }}
                >
                    <Text style={styles.buttonText}>Cập nhật cân nặng & chiều cao</Text>
                </Pressable>

                <Text style={[styles.metricLabel, { marginTop: 20 }]}>Danh sách Setting:</Text>
                {settings.map(setting => {
                    const isCurrent = setting.id === currentSettingId;
                    return (
                        <View
                            key={setting.id}
                            style={[
                                styles.settingCard,
                                isCurrent && styles.currentSettingCard
                            ]}
                        >
                            <TouchableOpacity onPress={() => toggleExpand(setting.id)}>
                                <Text style={styles.settingTitle}>
                                    {setting.settingName} {isCurrent && '(Đang sử dụng)'}
                                </Text>
                            </TouchableOpacity>
                            {expandedId === setting.id && (
                                <View style={styles.settingDetails}>
                                    <Text>Nước uống: {setting.waterAmount} ml</Text>
                                    <Text>Thời gian tập: {setting.exerciseDuration} phút</Text>
                                    <Text>Cường độ tập: {setting.exerciseRate}</Text>
                                    <Text>Món ăn: {setting.food.join(', ')}</Text>

                                    <Pressable
                                        style={[
                                            styles.button,
                                            isCurrent && { backgroundColor: '#aaa' }
                                        ]}
                                        onPress={() => !isCurrent && updateCurrentSetting(setting.id)}
                                        disabled={isCurrent}
                                    >
                                        <Text style={styles.buttonText}>
                                            {isCurrent ? 'Đang sử dụng' : 'Sử dụng'}
                                        </Text>
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    );
                })}

                <Pressable
                    style={styles.button}
                    onPress={async () => {
                        try {
                            await AsyncStorage.clear(); // 🔥 xóa sạch dữ liệu trong AsyncStorage
                            navigation.navigate('Login');
                        } catch (e) {
                            console.error('Lỗi khi clear AsyncStorage:', e);
                        }
                    }}
                >
                    <Text style={styles.buttonText}>Logout</Text>
                </Pressable>

                <Pressable
                    style={[styles.button, { backgroundColor: '#888', marginTop: 10 }]}
                    onPress={fetchMetrics}
                >
                    <Text style={styles.buttonText}>Tải lại</Text>
                </Pressable>
            </View>

            {/* Popup cập nhật */}
            <Modal
                transparent
                animationType="slide"
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.title}>Cập nhật thông số</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            placeholder="Cân nặng (kg)"
                            value={inputWeight}
                            onChangeText={setInputWeight}
                        />
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            placeholder="Chiều cao (cm)"
                            value={inputHeight}
                            onChangeText={setInputHeight}
                        />
                        <Pressable style={styles.button} onPress={createMetric}>
                            <Text style={styles.buttonText}>Xác nhận</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.button, { backgroundColor: '#888', marginTop: 10 }]}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.buttonText}>Hủy</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

function MetricBox({ label, value }) {
    return (
        <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>{label}</Text>
            <Text style={styles.metricValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 40,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#53A69D',
    },
    metricBox: {
        width: '80%',
        padding: 15,
        marginVertical: 8,
        backgroundColor: '#E8F4F2',
        borderRadius: 10,
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: 16,
        color: '#555',
    },
    metricValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 5,
    },
    settingCard: {
        width: '80%',
        backgroundColor: '#E8F4F2',
        borderRadius: 8,
        marginVertical: 6,
        padding: 12,
    },
    currentSettingCard: {
        backgroundColor: '#C3E6CB',
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    settingDetails: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
    },
    button: {
        backgroundColor: '#53A69D',
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderRadius: 10,
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalBox: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginTop: 10,
    },
});
