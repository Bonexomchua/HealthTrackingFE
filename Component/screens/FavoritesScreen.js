import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { endpoints } from "../../Configs/APIs";
import { useNavigation } from "@react-navigation/native";
import { getOrCreateConversation } from "../../Configs/firebaseHelper";

export default function FavoritesScreen() {
  const [loading, setLoading] = useState(true);
  const [experts, setExperts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  // Lấy danh sách chuyên gia từ API
  const fetchExperts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const res = await axios.get(endpoints.getallexpert, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // API đã trả về id rồi nên gán trực tiếp
      setExperts(res.data);
    } catch (error) {
      console.error("Lỗi tải danh sách chuyên gia:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExperts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExperts();
  };

  // Render từng chuyên gia
  const renderExpert = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{
          uri: item.avatar?.trim() || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        }}
        style={styles.avatar}
      />
      <View style={styles.info}>
        <Text style={styles.username}>{item.userName}</Text>
        <Text style={styles.email}>{item.email}</Text>

        <Pressable
          style={styles.chatButton}
          onPress={async () => {
            try {
              const currentUserUid = await AsyncStorage.getItem("UID"); // UID thật của user
              const expertUid = item.id; // UID chuyên gia từ API

              console.log(currentUserUid, expertUid);

              const convRef = await getOrCreateConversation(
                currentUserUid,
                expertUid
              );

              navigation.navigate("ChatScreen", {
                conversationId: convRef.id,
                expertName: item.userName,
              });
            } catch (err) {
              console.error("Lỗi mở chat:", err.message);
            }
          }}
        >
          <Text style={styles.chatText}>💬 Chat</Text>
        </Pressable>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  return (
    <FlatList
      data={experts}
      keyExtractor={(item) => item.id}
      renderItem={renderExpert}
      contentContainerStyle={{ padding: 15 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 15,
  },
  info: {
    flexDirection: "column",
  },
  username: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
    color: "#333",
  },
  email: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  chatButton: {
    backgroundColor: "#4a90e2",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  chatText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
