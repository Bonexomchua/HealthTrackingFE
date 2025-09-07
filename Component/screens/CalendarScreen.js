import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { endpoints } from "../../Configs/APIs";

export default function CalendarScreen() {
  const [loading, setLoading] = useState(true);
  const [waterData, setWaterData] = useState({});
  const [exerciseData, setExerciseData] = useState({});
  const [sleepData, setSleepData] = useState({});

  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d.toLocaleDateString("sv-SE"));
    }
    return days;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const [resWater, resExercise, resSleep] = await Promise.all([
        axios.get(endpoints.getweekwater, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(endpoints.getweekexercise, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(endpoints.getweeksleep, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      console.log(resWater.data);
      const waterGrouped = {};
      resWater.data.forEach((w) => {
        const dateKey = new Date(w.date).toLocaleDateString("sv-SE");
        waterGrouped[dateKey] = (waterGrouped[dateKey] || 0) + w.amount;
      });

      const exerciseGrouped = {};
      resExercise.data.forEach((e) => {
        const dateKey = new Date(e.date).toLocaleDateString("sv-SE");
        exerciseGrouped[dateKey] =
          (exerciseGrouped[dateKey] || 0) + e.duration;
      });

      const sleepGrouped = {};
      resSleep.data.forEach((s) => {
        const dateKey = new Date(s.date).toLocaleDateString("sv-SE");
        const start = new Date(s.timeStart);
        const end = new Date(s.timeEnd);
        const hours = (end - start) / 3600000;
        sleepGrouped[dateKey] = (sleepGrouped[dateKey] || 0) + hours;
      });

      setWaterData(waterGrouped);
      setExerciseData(exerciseGrouped);
      setSleepData(sleepGrouped);
    } catch (error) {
      console.error("Lỗi tải thống kê:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const days = getLast7Days();

  const getAverage = (data) => {
    const values = days.map((d) => data[d] || 0); // đảm bảo luôn có 7 ngày
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const renderRow = (label, data, unit, color) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.circleContainer}>
        {days.map((d) => {
          const value = data[d];
          return (
            <View
              key={d}
              style={[
                styles.circle,
                { backgroundColor: value ? color : "#ccc" },
              ]}
            >
              <Text style={styles.circleText}>
                {value ? (unit === "h" ? value.toFixed(1) : value) : ""}
              </Text>
            </View>
          );
        })}
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

  const avgWater = getAverage(waterData);
  const avgExercise = getAverage(exerciseData);
  const avgSleep = getAverage(sleepData);

  return (
    <ScrollView style={styles.container}>
      {renderRow("💧 Water", waterData, "ml", "#4a90e2")}
      {renderRow("🏃 Exercise", exerciseData, "min", "#ff9800")}
      {renderRow("😴 Sleep", sleepData, "h", "#4caf50")}

      {/* Phần cảnh báo tổng kết bên dưới */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>📊 Thống kê trung bình 7 ngày</Text>
        <Text style={styles.summaryText}>
          💧 Nước: {avgWater.toFixed(0)} ml/ngày{" "}
          {avgWater < 1500 ? "⚠️ Uống quá ít" : ""}
        </Text>
        <Text style={styles.summaryText}>
          🏃 Tập: {avgExercise.toFixed(0)} phút/ngày{" "}
          {avgExercise < 30 ? "⚠️ Tập quá ít" : ""}
        </Text>
        <Text style={styles.summaryText}>
          😴 Ngủ: {avgSleep.toFixed(1)} h/ngày{" "}
          {avgSleep < 6
            ? "⚠️ Ngủ quá ít"
            : avgSleep > 9
              ? "⚠️ Ngủ quá nhiều"
              : ""}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f6f6f6" },
  row: { marginBottom: 20 },
  label: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  circleContainer: { flexDirection: "row", justifyContent: "space-between" },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  circleText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  summary: {
    marginTop: 30,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 6,
  },
});
