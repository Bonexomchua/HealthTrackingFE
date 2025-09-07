import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Modal,
    ScrollView,
    Alert,
} from "react-native";
import { collection, addDoc, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../Configs/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL, endpoints } from "../../Configs/APIs";
import * as ImagePicker from 'expo-image-picker';

export default function ExpertChatScreen({ route, navigation }) {
    const { conversationId, clientId, clientName } = route.params;
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");

    // Modal state cho thêm Setting
    const [showModal, setShowModal] = useState(false);
    const [settingName, setSettingName] = useState("");
    const [waterAmount, setWaterAmount] = useState("");
    const [foods, setFoods] = useState([""]);
    const [activities, setActivities] = useState([]);


    const flatListRef = useRef(null);

    useEffect(() => {
        const q = query(
            collection(db, "conversations", conversationId, "messages"),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [conversationId]);

    const sendMessage = async () => {
        if (!text.trim()) return;

        const expertUid = await AsyncStorage.getItem("userUid");

        await addDoc(collection(db, "conversations", conversationId, "messages"), {
            sender: expertUid,
            text,
            createdAt: new Date(),
        });

        setText("");
        flatListRef.current?.scrollToEnd({ animated: true });
    };

    // ============== Setting Form ==============
    const addFoodField = () => setFoods([...foods, ""]);
    const updateFood = (text, i) => {
        const arr = [...foods];
        arr[i] = text;
        setFoods(arr);
    };

    const addActivity = () =>
        setActivities([...activities, { name: "", duration: "", rate: "", video: null }]);
    const updateActivity = (i, field, value) => {
        const arr = [...activities];
        arr[i][field] = value;
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
                    userId: clientId,
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
                    BASE_URL + endpoints.uploadvideo,
                    videoData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const videoUrl = uploadRes.data.videoUrl;

                await axios.post(
                    BASE_URL + endpoints.createactivity,
                    {
                        name: act.name,
                        userId: clientId,
                        authorId: await AsyncStorage.getItem("UID"),
                        settingId,
                        videoUrl,
                        duration: parseInt(act.duration),
                        rate: parseInt(act.rate),
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

            Alert.alert("✅ Thành công", "Đã tạo setting + bài tập");
            setShowModal(false);
        } catch (err) {
            console.error("Submit error:", err);
            Alert.alert("❌ Lỗi", "Không tạo được setting");
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>⬅ Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{clientName}</Text>
                <TouchableOpacity onPress={() => setShowModal(true)}>
                    <Text style={styles.addBtn}>➕ Setting</Text>
                </TouchableOpacity>
            </View>

            {/* Chat box */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View
                        style={[
                            styles.message,
                            item.sender === clientId
                                ? styles.clientMsg
                                : styles.expertMsg,
                        ]}
                    >
                        <Text style={styles.msgText}>{item.text}</Text>
                    </View>
                )}
                contentContainerStyle={{ padding: 10 }}
                onContentSizeChange={() =>
                    flatListRef.current?.scrollToEnd({ animated: true })
                }
            />

            {/* Input */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={styles.inputRow}>
                    <TextInput
                        value={text}
                        onChangeText={setText}
                        style={styles.input}
                        placeholder="Nhập tin nhắn..."
                    />
                    <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
                        <Text style={{ color: "#fff" }}>Gửi</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Modal thêm setting */}
            <Modal visible={showModal} animationType="slide">
                <ScrollView style={{ flex: 1, backgroundColor: "#1D3557", padding: 20, marginTop: 20 }}>
                    <Text style={styles.title}>Tạo Setting cho {clientName}</Text>
                    <TextInput
                        placeholder="Tên Setting"
                        placeholderTextColor="#8d8d8dff"
                        value={settingName}
                        onChangeText={setSettingName}
                        style={styles.inputModal}
                    />
                    <TextInput
                        placeholder="Lượng nước (ml)"
                        placeholderTextColor="#8d8d8dff"
                        value={waterAmount}
                        keyboardType="numeric"
                        onChangeText={setWaterAmount}
                        style={styles.inputModal}
                    />

                    <Text style={styles.subtitle}>Danh sách Food</Text>
                    {foods.map((food, i) => (
                        <TextInput
                            key={i}
                            placeholder={`Món ăn ${i + 1}`}
                            placeholderTextColor="#8d8d8dff"
                            value={food}
                            onChangeText={(t) => updateFood(t, i)}
                            style={styles.inputModal}
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
                                placeholderTextColor="#8d8d8dff"
                                value={act.name}
                                onChangeText={(t) => updateActivity(i, "name", t)}
                                style={styles.inputModal}
                            />
                            <TextInput
                                placeholder="Thời gian (phút)"
                                placeholderTextColor="#8d8d8dff"
                                value={act.duration}
                                onChangeText={(t) => updateActivity(i, "duration", t)}
                                keyboardType="numeric"
                                style={styles.inputModal}
                            />
                            <TextInput
                                placeholder="Rate"
                                placeholderTextColor="#8d8d8dff"
                                value={act.rate}
                                onChangeText={(t) => updateActivity(i, "rate", t)}
                                keyboardType="numeric"
                                style={styles.inputModal}
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

                    <TouchableOpacity style={styles.sendBtn} onPress={submitForm}>
                        <Text style={{ color: "#fff" }}>Hoàn thành</Text>
                    </TouchableOpacity>
                </ScrollView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#1D3557" },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
        backgroundColor: "#457b9d",
        marginTop: 35,
    },
    backBtn: { color: "#fff", fontSize: 16 },
    headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
    addBtn: { color: "#ffdd00", fontSize: 16 },
    message: {
        padding: 10,
        borderRadius: 10,
        marginVertical: 4,
        maxWidth: "70%",
    },
    clientMsg: { backgroundColor: "#f1faee", alignSelf: "flex-start" },
    expertMsg: { backgroundColor: "#a8dadc", alignSelf: "flex-end" },
    msgText: { fontSize: 16 },
    inputRow: {
        flexDirection: "row",
        padding: 10,
        borderTopWidth: 1,
        borderColor: "#ccc",
        backgroundColor: "#fff",
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 20,
        paddingHorizontal: 12,
        marginRight: 8,
    },
    sendBtn: {
        backgroundColor: "#E63946",
        paddingHorizontal: 20,
        justifyContent: "center",
        borderRadius: 16,
        height: 40,
        alignSelf: "center",
        paddingHorizontal: 12,
        marginTop: 18,
    },
    // modal
    title: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 16 },
    subtitle: { fontSize: 16, color: "#A8DADC", marginBottom: 12 },
    inputModal: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        backgroundColor: "#fff",
    },
    activityBox: {
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
        backgroundColor: "#f9f9f9",
    },
});
