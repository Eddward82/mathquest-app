import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { firestore } from "../../src/lib/firebase";
import { useAuthStore } from "../../src/store/authStore";
import { COLORS } from "../../src/constants/theme";

interface LeaderEntry {
  uid: string;
  display_name: string;
  total_xp: number;
  current_level: number;
}

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const MEDAL_ICONS: ("award" | "award" | "award")[] = ["award", "award", "award"];

function getRankColor(rank: number): string {
  if (rank === 1) return "#FFD700";
  if (rank === 2) return "#C0C0C0";
  if (rank === 3) return "#CD7F32";
  return "#9CA3AF";
}

function getLevelLabel(level: number): string {
  if (level >= 20) return "Master";
  if (level >= 10) return "Expert";
  if (level >= 5) return "Pro";
  return "Learner";
}

export default function LeaderboardScreen() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myRank, setMyRank] = useState<number | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const snap = await firestore()
        .collection("users")
        .orderBy("total_xp", "desc")
        .limit(50)
        .get();

      const data: LeaderEntry[] = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          uid: doc.id,
          display_name: d.display_name ?? d.username ?? d.email?.split("@")[0] ?? "Anonymous",
          total_xp: d.total_xp ?? 0,
          current_level: d.current_level ?? 1,
        };
      });

      setEntries(data);

      if (user) {
        const rank = data.findIndex((e) => e.uid === user.id);
        setMyRank(rank >= 0 ? rank + 1 : null);
      }
    } catch {
      // Offline — keep stale list
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const renderItem = ({ item, index }: { item: LeaderEntry; index: number }) => {
    const rank = index + 1;
    const isMe = item.uid === user?.id;
    const rankColor = getRankColor(rank);

    return (
      <View style={[styles.row, isMe && styles.rowMe]}>
        {/* Rank */}
        <View style={styles.rankBox}>
          {rank <= 3 ? (
            <Feather name="award" size={20} color={rankColor} />
          ) : (
            <Text style={[styles.rankNum, { color: rankColor }]}>{rank}</Text>
          )}
        </View>

        {/* Avatar initial */}
        <View style={[styles.avatar, isMe && styles.avatarMe]}>
          <Text style={styles.avatarText}>
            {item.display_name[0]?.toUpperCase() ?? "?"}
          </Text>
        </View>

        {/* Name + level */}
        <View style={styles.nameCol}>
          <Text style={[styles.name, isMe && styles.nameMe]} numberOfLines={1}>
            {isMe ? `${item.display_name} (You)` : item.display_name}
          </Text>
          <Text style={styles.levelLabel}>
            Lvl {item.current_level} · {getLevelLabel(item.current_level)}
          </Text>
        </View>

        {/* XP pill */}
        <View style={styles.xpPill}>
          <Text style={styles.xpEmoji}>⚡</Text>
          <Text style={styles.xpNum}>{item.total_xp.toLocaleString()}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, "#8B5CF6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSub}>Top 50 by XP earned</Text>
        {myRank !== null && (
          <View style={styles.myRankBadge}>
            <Feather name="user" size={13} color={COLORS.primary} />
            <Text style={styles.myRankText}>Your rank: #{myRank}</Text>
          </View>
        )}
      </LinearGradient>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Loading rankings...</Text>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyEmoji}>🏆</Text>
          </View>
          <Text style={styles.emptyTitle}>Be the first on the board!</Text>
          <Text style={styles.emptySub}>No one has earned XP yet. Complete lessons to claim the #1 spot.</Text>
          <TouchableOpacity onPress={() => router.replace("/(tabs)/learn")} style={styles.emptyBtn}>
            <LinearGradient colors={[COLORS.primary, "#8B5CF6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyBtnGrad}>
              <Feather name="book-open" size={15} color="#FFFFFF" />
              <Text style={styles.emptyBtnText}>Start Learning</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.uid}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F5FF" },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: "center",
    gap: 4,
  },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#FFFFFF", letterSpacing: 0.3 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: "600" },
  myRankBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 10,
  },
  myRankText: { fontSize: 13, fontWeight: "800", color: COLORS.primary },

  loader: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loaderText: { fontSize: 14, color: "#6B7280", fontWeight: "600" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: 32 },
  emptyIconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#C7D2FE",
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: "900", color: "#111827", textAlign: "center" },
  emptySub: { fontSize: 14, color: "#6B7280", fontWeight: "500", textAlign: "center", lineHeight: 21 },
  emptyBtn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  emptyBtnGrad: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 13 },
  emptyBtnText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },

  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 10 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  rowMe: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: "#EEF2FF",
  },

  rankBox: { width: 28, alignItems: "center" },
  rankNum: { fontSize: 15, fontWeight: "900" },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarMe: { backgroundColor: COLORS.primary },
  avatarText: { fontSize: 17, fontWeight: "800", color: "#374151" },

  nameCol: { flex: 1 },
  name: { fontSize: 14, fontWeight: "700", color: "#1F2937" },
  nameMe: { color: COLORS.primary },
  levelLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "600", marginTop: 2 },

  xpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FEFCE8",
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  xpEmoji: { fontSize: 11 },
  xpNum: { fontSize: 13, fontWeight: "900", color: "#92400E" },
});
