import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { BASE_URL, endpoints } from "../../Configs/APIs";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../Configs/firebaseConfig";
import { getOrCreateConversation } from "../../Configs/firebaseHelper";

export default function ExpertScreen({ navigation }) {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Conversations
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [chatUsers, setChatUsers] = useState([]);

  useEffect(() => {
    const loadAvatar = async () => {
      const savedAvatar = await AsyncStorage.getItem("avatar");
      setAvatarUrl(
        savedAvatar ||
        "https://cdn-icons-png.flaticon.com/512/149/149071.png"
      );
    };
    loadAvatar();
  }, []);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      const expertUid = await AsyncStorage.getItem("UID");
      if (!expertUid) return;

      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", expertUid)
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const convs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setConversations(convs);

        // Lấy list userId (khác expert)
        let userIds = [];
        convs.forEach((c) => {
          const others = c.participants.filter((p) => p !== expertUid);
          userIds.push(...others);
        });
        userIds = [...new Set(userIds)]; // unique

        if (userIds.length > 0) {
          try {
            const token = await AsyncStorage.getItem("accessToken");
            const res = await axios.post(
              BASE_URL + endpoints["getusernamebyids"],
              userIds,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            // res.data = [{id, userName}]
            setChatUsers(res.data);
          } catch (err) {
            console.error("Load usernames error:", err);
          }
        }
        setLoading(false);
      });

      return () => unsubscribe();
    };

    loadConversations();
  }, []);

  // ============== Avatar ==============
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Bạn cần cấp quyền truy cập ảnh!");
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
      const token = await AsyncStorage.getItem("accessToken");
      const url = BASE_URL + endpoints["uploadavatar"];

      const formData = new FormData();
      formData.append("avatar", {
        uri: asset.uri,
        type: asset.mimeType || "image/jpeg",
        name: asset.fileName || "avatar.jpg",
      });

      const res = await axios.post(url, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newAvatarUrl = res.data.avatarUrl;
      if (!newAvatarUrl) throw new Error("Backend không trả về URL");

      setAvatarUrl(newAvatarUrl);
      await AsyncStorage.setItem("avatar", newAvatarUrl);
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
      <Text style={styles.subtitle}>
        Bạn đã đăng nhập với vai trò chuyên gia.
      </Text>

      <TouchableOpacity onPress={pickImage}>
        <View>
          <Image
            source={{
              uri:
                avatarUrl?.trim() ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            }}
            style={styles.avatar}
          />
          {uploading && (
            <ActivityIndicator
              size="small"
              color="#fff"
              style={{ position: "absolute", top: "40%", left: "40%" }}
            />
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.buttonText}>Đăng xuất</Text>
      </TouchableOpacity>

      {/* Danh sách user chat */}
      <Text style={[styles.subtitle, { marginTop: 20 }]}>
        Danh sách User đã chat
      </Text>
      {loading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : (
        <FlatList
          data={chatUsers}
          keyExtractor={(item) => item.id}  // có id là ngon
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.userBox}
              onPress={async () => {
                const expertid = await AsyncStorage.getItem("UID");
                console.log(expertid, item.id);
                const conversation = await getOrCreateConversation(expertid, item.id);
                navigation.navigate("ExpertChatScreen", {
                  conversationId: conversation.id,
                  clientId: item.id,
                  clientName: item.userName,
                })
              }}
            >
              <Text style={styles.userText}>{item.userName}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1D3557",
    alignItems: "center",
    padding: 24,
  },
  title: { fontSize: 28, fontWeight: "bold", color: "#f0faeeff", marginBottom: 16 },
  subtitle: { fontSize: 16, color: "#A8DADC", marginBottom: 12 },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#53A69D",
  },
  button: {
    backgroundColor: "#E63946",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  userBox: {
    width: "100%",
    padding: 14,
    backgroundColor: "#457b9d",
    borderRadius: 8,
    marginBottom: 10,
  },
  userText: { color: "#fff", fontSize: 16 },
});
