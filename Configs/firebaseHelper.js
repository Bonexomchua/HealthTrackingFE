// firebaseHelper.js
import { db } from "./firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Lấy UID hiện tại (tạo mới nếu chưa có)
 */
export const getCurrentUserUid = async () => {
  let uid = await AsyncStorage.getItem("UID");
  if (!uid) {
    uid = "user-" + Date.now();
    await AsyncStorage.setItem("UID", uid);
    console.log("Tạo UID mới:", uid);
  } else {
    console.log("Đang dùng UID:", uid);
  }
  return uid;
};

/**
 * Tìm hoặc tạo conversation giữa 2 user
 */
export const getOrCreateConversation = async (userId, expertId) => {
  // Tìm conversation chứa cả 2
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", userId)
  );

  const snapshot = await getDocs(q);

  let conversation = null;
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.participants.includes(expertId)) {
      conversation = { id: doc.id, ...data };
    }
  });

  // Nếu đã tồn tại thì trả về
  if (conversation) return conversation;

  // Nếu chưa có thì tạo mới
  const newConvRef = await addDoc(collection(db, "conversations"), {
    participants: [userId, expertId],
    createdAt: serverTimestamp(),
  });

  return { id: newConvRef.id, participants: [userId, expertId] };
};
