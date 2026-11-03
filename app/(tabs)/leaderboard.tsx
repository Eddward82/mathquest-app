import React, { useState, useCallback, useEffect } from "react";
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
import Svg, { Path } from "react-native-svg";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  FadeInDown,
} from "react-native-reanimated";
import { router, useFocusEffect } from "expo-router";
import { firestore, Collections } from "../../src/lib/firebase";
import { rankFromHigherScoreCount } from "../../src/lib/rankMath";
import { useAuthStore } from "../../src/store/authStore";
import { LEVEL_NAMES } from "../../src/constants/theme";

interface LeaderEntry {
  uid: string;
  display_name: string;
  total_xp: number;
  current_level: number;
}

const BRAND = "#5D48E8";
const INK = "#0F172A";
const MUTED = "#64748B";
const FAINT = "#94A3B8";
const LINE = "#E2E8F0";

// Avatar tints for everyone outside the podium, picked by uid so they're stable.
const AVATAR_TINTS = [
  { bg: "#F1F5F9", fg: "#334155", border: "#E2E8F0" },
  { bg: "#FFF1F2", fg: "#E11D48", border: "#FFE4E6" },
  { bg: "#F0FDFA", fg: "#0D9488", border: "#CCFBF1" },
  { bg: "#F0F9FF", fg: "#0284C7", border: "#E0F2FE" },
  { bg: "#FFFBEB", fg: "#B45309", border: "#FEF3C7" },
  { bg: "#ECFDF5", fg: "#059669", border: "#D1FAE5" },
];

function tintFor(uid: string) {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) | 0;
  return AVATAR_TINTS[Math.abs(h) % AVATAR_TINTS.length];
}

function levelLine(level: number) {
  return `Lvl ${level} • ${LEVEL_NAMES[level] ?? "Mathlete"}`;
}

function initial(name: string) {
  return name.trim()[0]?.toUpperCase() ?? "?";
}

/** "Olubunmi Ogunlusi" → "Olubunmi O." so podium names fit. */
function shortName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export default function LeaderboardScreen() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myXP, setMyXP] = useState<number | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      // Public entries only — users/{uid} holds private fields (email) and is
      // readable by its owner alone.
      const leaderboard = firestore().collection(Collections.leaderboard);
      const [snap, ownSnap] = await Promise.all([
        leaderboard.orderBy("total_xp", "desc").limit(50).get(),
        user ? leaderboard.doc(user.id).get() : Promise.resolve(null),
      ]);

      const data: LeaderEntry[] = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          uid: doc.id,
          display_name: d.display_name ?? "Anonymous",
          total_xp: d.total_xp ?? 0,
          current_level: d.current_level ?? 1,
        };
      });

      setEntries(data);

      if (user && ownSnap?.exists) {
        const ownXP = ownSnap.data()?.total_xp;
        if (typeof ownXP === "number") {
          // Count only matching index entries; do not download the full
          // leaderboard just to calculate a user's rank.
          const higherXP = await leaderboard
            .where("total_xp", ">", ownXP)
            .countFromServer()
            .get();
          setMyRank(rankFromHigherScoreCount(higherXP.data().count));
          setMyXP(ownXP);
        } else {
          setMyRank(null);
          setMyXP(null);
        }
      } else if (user) {
        setMyRank(null);
        setMyXP(null);
      }
    } catch {
      // Offline — keep stale list
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Tab screens stay mounted, so refetch every time the tab gains focus —
  // otherwise XP earned elsewhere never shows until the app restarts.
  useFocusEffect(
    useCallback(() => {
      fetchLeaderboard();
    }, [fetchLeaderboard]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  const myName = user?.username ?? "You";

  const renderItem = ({ item, index }: { item: LeaderEntry; index: number }) => (
    <RankRow entry={item} rank={index + 4} isMe={item.uid === user?.id} />
  );

  const header = (
    <View style={styles.headerWrap}>
      {/* Headline */}
      <Animated.View entering={FadeInDown.springify()} style={styles.headline}>
        <View style={styles.leaguePill}>
          <LiveDot />
          <Text style={styles.leaguePillText}>GLOBAL • ALL TIME</Text>
        </View>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Top 50 mathematicians by XP</Text>
      </Animated.View>

      {/* Podium */}
      <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.podium}>
        <PodiumSpot entry={podium[1]} place={2} isMe={podium[1]?.uid === user?.id} />
        <PodiumSpot entry={podium[0]} place={1} isMe={podium[0]?.uid === user?.id} />
        <PodiumSpot entry={podium[2]} place={3} isMe={podium[2]?.uid === user?.id} />
      </Animated.View>

      {/* Your rank banner */}
      {user && (
        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <YourRankBanner
            name={myName}
            rank={myRank}
            xp={myXP}
            podium={podium}
          />
        </Animated.View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={BRAND} />
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
            <LinearGradient colors={["#7C3AED", BRAND, "#4F46E5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyBtnGrad}>
              <Feather name="book-open" size={15} color="#FFFFFF" />
              <Text style={styles.emptyBtnText}>Start Learning</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(item) => item.uid}
          renderItem={renderItem}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[BRAND]}
              tintColor={BRAND}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

// ── LiveDot ───────────────────────────────────────────────────────────────────

const LiveDot: React.FC = () => {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(withTiming(0.4, { duration: 1000 }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.liveDot, style]} />;
};

// ── Crown ─────────────────────────────────────────────────────────────────────

const Crown: React.FC = () => {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withTiming(-5, { duration: 700, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View style={[styles.crown, style]}>
      <Svg width={28} height={28} viewBox="0 0 24 24">
        <Path
          d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5m14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"
          fill="#FBBF24"
        />
      </Svg>
    </Animated.View>
  );
};

// ── PodiumSpot ────────────────────────────────────────────────────────────────

const PODIUM_STYLE = {
  1: {
    ring: ["#FBBF24", "#FCD34D", "#FEF08A"] as const,
    badge: ["#FBBF24", "#EAB308"] as const,
    badgeText: INK,
  },
  2: {
    ring: ["#E2E8F0", "#F1F5F9"] as const,
    badge: ["#CBD5E1", "#94A3B8"] as const,
    badgeText: INK,
  },
  3: {
    ring: ["#E9C9A3", "#F7E7D4"] as const,
    badge: ["#D97706", "#B45309"] as const,
    badgeText: "#FFFFFF",
  },
};

const PodiumSpot: React.FC<{ entry?: LeaderEntry; place: 1 | 2 | 3; isMe: boolean }> = ({ entry, place, isMe }) => {
  const champ = place === 1;
  const look = PODIUM_STYLE[place];
  const size = champ ? 80 : 64;

  return (
    <View style={[styles.podiumCol, champ && styles.podiumColChamp]}>
      {champ && <Crown />}
      <View style={styles.podiumAvatarWrap}>
        <LinearGradient
          colors={look.ring}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.podiumRing,
            { width: size, height: size, borderRadius: champ ? 22 : 16, padding: champ ? 4 : 2 },
            champ ? styles.podiumRingChamp : place === 2 ? styles.podiumRingSilver : styles.podiumRingBronze,
          ]}
        >
          {champ ? (
            <LinearGradient
              colors={["#7C3AED", "#4338CA"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.podiumInner, { borderRadius: 18 }, styles.podiumInnerChamp]}
            >
              <Text style={styles.podiumInitialChamp}>{entry ? initial(entry.display_name) : "?"}</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.podiumInner, { borderRadius: 13, backgroundColor: place === 2 ? "#E2E8F0" : "#FFFBEB" }]}>
              <Text style={[styles.podiumInitial, { color: place === 2 ? "#475569" : "#78350F" }]}>
                {entry ? initial(entry.display_name) : "?"}
              </Text>
            </View>
          )}
        </LinearGradient>
        <LinearGradient
          colors={look.badge}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.placeBadge, champ && styles.placeBadgeChamp]}
        >
          <Text style={[styles.placeBadgeText, { color: look.badgeText }, champ && { fontSize: 12 }]}>{place}</Text>
        </LinearGradient>
      </View>

      {entry ? (
        <>
          <Text style={[styles.podiumName, champ && { fontWeight: "800" }]} numberOfLines={1}>
            {isMe ? "You" : shortName(entry.display_name)}
          </Text>
          <Text style={[styles.podiumLevel, champ && styles.podiumLevelChamp]} numberOfLines={1}>
            {levelLine(entry.current_level)}
          </Text>
          <View style={[styles.xpPill, styles.podiumXp, champ && styles.xpPillChamp]}>
            <Text style={styles.xpPillIcon}>⚡</Text>
            <Text style={[styles.xpPillText, champ && styles.xpPillTextChamp]}>{entry.total_xp.toLocaleString()}</Text>
          </View>
        </>
      ) : (
        <>
          <Text style={[styles.podiumName, { color: FAINT }]}>Open spot</Text>
          <Text style={styles.podiumLevel}>Could be you</Text>
        </>
      )}
    </View>
  );
};

// ── YourRankBanner ────────────────────────────────────────────────────────────

const YourRankBanner: React.FC<{
  name: string;
  rank: number | null;
  xp: number | null;
  podium: LeaderEntry[];
}> = ({ name, rank, xp, podium }) => {
  let message: React.ReactNode;
  if (rank === null || xp === null) {
    message = "Complete a lesson to join the leaderboard!";
  } else if (rank === 1) {
    message = "You're #1 — defend your crown!";
  } else if (rank <= 3) {
    const ahead = podium[rank - 2];
    const gap = ahead ? Math.max(1, ahead.total_xp - xp) : null;
    message = gap
      ? <>On the podium! <Text style={styles.bannerHighlight}>{gap} XP</Text> to reach #{rank - 1}.</>
      : "You're on the podium!";
  } else {
    const third = podium[2];
    const gap = third ? Math.max(1, third.total_xp - xp) : null;
    message = gap
      ? <>Just <Text style={styles.bannerHighlight}>{gap.toLocaleString()} XP</Text> to claim the Top 3 podium!</>
      : "Keep going to reach the podium!";
  }

  return (
    <LinearGradient
      colors={["#7C3AED", BRAND, "#4F46E5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.banner}
    >
      <View style={styles.bannerOrb} />
      <View style={styles.bannerAvatar}>
        <Text style={styles.bannerAvatarText}>{initial(name)}</Text>
      </View>
      <View style={styles.bannerText}>
        <View style={styles.bannerTopRow}>
          <View style={styles.bannerRankTag}>
            <Text style={styles.bannerRankText}>{rank ? `YOUR RANK #${rank}` : "UNRANKED"}</Text>
          </View>
          <Text style={styles.bannerName} numberOfLines={1}>• {name}</Text>
        </View>
        <Text style={styles.bannerMsg}>{message}</Text>
      </View>
      <View style={styles.bannerXp}>
        <Text style={styles.bannerXpLabel}>TOTAL</Text>
        <Text style={styles.bannerXpValue}>⚡ {(xp ?? 0).toLocaleString()}</Text>
      </View>
    </LinearGradient>
  );
};

// ── RankRow ───────────────────────────────────────────────────────────────────

const RankRow: React.FC<{ entry: LeaderEntry; rank: number; isMe: boolean }> = ({ entry, rank, isMe }) => {
  const tint = tintFor(entry.uid);
  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <Text style={[styles.rankNum, isMe && { color: BRAND }]}>{rank}</Text>
      <View
        style={[
          styles.rowAvatar,
          isMe
            ? { backgroundColor: "#7C3AED", borderColor: "#7C3AED" }
            : { backgroundColor: tint.bg, borderColor: tint.border },
        ]}
      >
        <Text style={[styles.rowAvatarText, { color: isMe ? "#FFFFFF" : tint.fg }]}>{initial(entry.display_name)}</Text>
      </View>
      <View style={styles.rowText}>
        <View style={styles.rowNameLine}>
          <Text style={styles.rowName} numberOfLines={1}>{entry.display_name}</Text>
          {isMe && (
            <View style={styles.youTag}>
              <Text style={styles.youTagText}>YOU</Text>
            </View>
          )}
        </View>
        <Text style={[styles.rowLevel, isMe && { color: MUTED }]}>{levelLine(entry.current_level)}</Text>
      </View>
      <View style={[styles.xpPill, isMe && styles.xpPillMe]}>
        <Text style={styles.xpPillIcon}>⚡</Text>
        <Text style={[styles.xpPillText, isMe && { color: "#78350F" }]}>{entry.total_xp.toLocaleString()}</Text>
      </View>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F8FC" },

  loader: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loaderText: { fontSize: 14, color: MUTED, fontWeight: "600" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: 32 },
  emptyIconCircle: {
    width: 100, height: 100, borderRadius: 32,
    backgroundColor: "#F2EFFF", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#DDD6FE",
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: INK, textAlign: "center" },
  emptySub: { fontSize: 14, color: MUTED, fontWeight: "500", textAlign: "center", lineHeight: 21 },
  emptyBtn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  emptyBtnGrad: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 13 },
  emptyBtnText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },

  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 10 },
  headerWrap: { paddingTop: 12, paddingBottom: 6, gap: 16 },

  // Headline
  headline: { alignItems: "center" },
  leaguePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: "rgba(237,233,254,0.7)",
    borderWidth: 1,
    borderColor: "rgba(221,214,254,0.5)",
    marginBottom: 6,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" },
  leaguePillText: { fontSize: 11, fontWeight: "700", color: BRAND, letterSpacing: 0.8 },
  title: { fontSize: 24, fontWeight: "800", color: INK, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: MUTED, fontWeight: "500", marginTop: 2 },

  // Podium
  podium: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingTop: 16,
  },
  podiumCol: { flex: 1, alignItems: "center" },
  podiumColChamp: { transform: [{ translateY: -8 }] },
  crown: { marginBottom: 4 },
  podiumAvatarWrap: { marginBottom: 8 },
  podiumRing: { alignItems: "stretch", justifyContent: "center" },
  podiumRingChamp: {
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  podiumRingSilver: {
    borderWidth: 2,
    borderColor: "#CBD5E1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  podiumRingBronze: {
    borderWidth: 2,
    borderColor: "rgba(180,83,9,0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  podiumInner: { flex: 1, alignItems: "center", justifyContent: "center" },
  podiumInnerChamp: { borderWidth: 1, borderColor: "rgba(253,230,138,0.6)" },
  podiumInitial: { fontSize: 18, fontWeight: "700" },
  podiumInitialChamp: { fontSize: 24, fontWeight: "800", color: "#FFFFFF" },
  placeBadge: {
    position: "absolute",
    bottom: -8,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  placeBadgeChamp: { width: 28, height: 28, borderRadius: 14, bottom: -10 },
  placeBadgeText: { fontSize: 11, fontWeight: "900" },
  podiumName: { fontSize: 12, fontWeight: "700", color: INK, marginTop: 6, maxWidth: "100%" },
  podiumLevel: { fontSize: 10, color: FAINT, fontWeight: "500" },
  podiumLevelChamp: { color: "#7C3AED", fontWeight: "600" },
  podiumXp: { marginTop: 6 },

  // XP pill (shared)
  xpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  xpPillChamp: { backgroundColor: "rgba(251,191,36,0.2)", borderColor: "rgba(251,191,36,0.5)" },
  xpPillMe: { backgroundColor: "#FEF3C7", borderColor: "#FCD34D" },
  xpPillIcon: { fontSize: 11 },
  xpPillText: { fontSize: 12, fontWeight: "700", color: "#92400E" },
  xpPillTextChamp: { fontWeight: "900", color: "#78350F" },

  // Your rank banner
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  bannerOrb: {
    position: "absolute", right: -16, bottom: -16,
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  bannerAvatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center",
  },
  bannerAvatarText: { fontSize: 16, fontWeight: "800", color: BRAND },
  bannerText: { flex: 1 },
  bannerTopRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  bannerRankTag: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  bannerRankText: { fontSize: 11, fontWeight: "800", color: "#FCD34D", letterSpacing: 0.6 },
  bannerName: { flexShrink: 1, fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "500" },
  bannerMsg: { fontSize: 11, color: "#EDE9FE", fontWeight: "500", marginTop: 4, lineHeight: 15 },
  bannerHighlight: { fontWeight: "800", color: "#FCD34D" },
  bannerXp: {
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  bannerXpLabel: { fontSize: 10, fontWeight: "600", color: "#DDD6FE" },
  bannerXpValue: { fontSize: 12, fontWeight: "900", color: "#FCD34D" },

  // Rank rows
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: LINE,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  rowMe: {
    backgroundColor: "#F5F3FF",
    borderWidth: 2,
    borderColor: "rgba(93,72,232,0.4)",
  },
  rankNum: { width: 22, textAlign: "center", fontSize: 14, fontWeight: "800", color: FAINT },
  rowAvatar: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  rowAvatarText: { fontSize: 14, fontWeight: "700" },
  rowText: { flex: 1 },
  rowNameLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowName: { flexShrink: 1, fontSize: 14, fontWeight: "700", color: INK },
  youTag: { backgroundColor: BRAND, borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1 },
  youTagText: { fontSize: 9, fontWeight: "900", color: "#FFFFFF", letterSpacing: 0.4 },
  rowLevel: { fontSize: 11, color: FAINT, fontWeight: "500", marginTop: 1 },
});
