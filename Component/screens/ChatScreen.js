import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { db } from "../../Configs/firebaseConfig";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { serverTimestamp } from "firebase/firestore";

export default function ChatScreen({ route }) {
  const { conversationId, expertName } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [currentUserUid, setCurrentUserUid] = useState(null);

  useEffect(() => {
    const fetchUid = async () => {
      const uid = await AsyncStorage.getItem("userUid");
      setCurrentUserUid(uid);
    };
    fetchUid();
  }, []);

  useEffect(() => {
    const messagesRef = collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [conversationId]);

  const handleSend = async () => {
    if (!text.trim() || !currentUserUid) return;

    const messagesRef = collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );

    await addDoc(messagesRef, {
      text,
      sender: currentUserUid,
      createdAt: serverTimestamp(), // ✅ Firestore timestamp chuẩn
    });

    setText("");
  };

  const renderItem = ({ item }) => {
    const isMe = item.sender === currentUserUid;
    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.messageRight : styles.messageLeft,
        ]}
      >
        <Text style={isMe ? styles.textRight : styles.textLeft}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{expertName}</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Nhập tin nhắn..."
          />
          <Pressable style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendText}>Gửi</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9f9f9" },
  header: {
    padding: 16,
    backgroundColor: "#4a90e2",
    alignItems: "center",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  messageContainer: {
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
    maxWidth: "70%",
  },
  messageLeft: {
    alignSelf: "flex-start",
    backgroundColor: "#e6e6e6",
  },
  messageRight: {
    alignSelf: "flex-end",
    backgroundColor: "#4a90e2",
  },
  textLeft: { color: "#000" },
  textRight: { color: "#fff" },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: "#fff",
  },
  sendButton: {
    backgroundColor: "#4a90e2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendText: { color: "#fff", fontWeight: "600" },
});
