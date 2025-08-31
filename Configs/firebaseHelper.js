import { db } from "./firebaseConfig";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { serverTimestamp } from "firebase/firestore";

/**
 * Lấy UID hiện tại (tạo mới nếu chưa có)
 */
export const getCurrentUserUid = async () => {
  let uid = await AsyncStorage.getItem('userUid');
  if (!uid) {
    uid = 'user-' + Date.now();
    await AsyncStorage.setItem('userUid', uid);
  }
  return uid;
};

/**
 * Tìm conversation giữa 2 user, nếu chưa có thì tạo mới
 * @param {string} uid1 - user hiện tại
 * @param {string} uid2 - uid của chuyên gia
 * @returns {DocumentReference} - ref đến conversation
 */
export const getOrCreateConversation = async (uid1, uid2) => {
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", uid1)
  );

  const snap = await getDocs(q);

  // Kiểm tra xem có conversation nào với uid2 chưa
for (const d of snap.docs) {
  const participants = d.data().participants;
  if (participants.includes(uid2)) return d.ref;
}

  // Nếu chưa có, tạo mới
  const convRef = await addDoc(collection(db, "conversations"), {
    participants: [uid1, uid2],
    createdAt: new Date()
  });

  return convRef;
};
