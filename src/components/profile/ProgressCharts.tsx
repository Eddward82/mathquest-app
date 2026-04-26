import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Rect, Line, Circle, Path, Text as SvgText, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { COLORS } from "../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 64; // card padding
const BAR_HEIGHT = 160;
const LINE_HEIGHT = 140;

// ─── XP Bar Chart ─────────────────────────────────────────────────────────────

interface XPBarChartProps {
  // Array of { label, xp } for last 7 days
  data: { label: string; xp: number }[];
}

export const XPBarChart: React.FC<XPBarChartProps> = ({ data }) => {
  if (data.length === 0) return <EmptyChart message="Complete lessons to see your XP history" />;

  const maxXP = Math.max(...data.map((d) => d.xp), 1);
  const barWidth = (CHART_WIDTH - 20) / data.length - 6;
  const gap = 6;

  return (
    <View style={styles.chartWrap}>
      <Svg width={CHART_WIDTH} height={BAR_HEIGHT + 24}>
        <Defs>
          <SvgGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLORS.primary} stopOpacity="1" />
            <Stop offset="1" stopColor="#8B5CF6" stopOpacity="0.7" />
          </SvgGradient>
        </Defs>

        {/* Baseline */}
        <Line x1={0} y1={BAR_HEIGHT} x2={CHART_WIDTH} y2={BAR_HEIGHT} stroke="#E2E8F0" strokeWidth={1.5} />

        {data.map((d, i) => {
          const barH = maxXP > 0 ? (d.xp / maxXP) * (BAR_HEIGHT - 20) : 0;
          const x = i * (barWidth + gap) + 10;
          const y = BAR_HEIGHT - barH;
          const isToday = i === data.length - 1;

          return (
            <React.Fragment key={i}>
              <Rect
                x={x} y={y}
                width={barWidth} height={barH}
                rx={5} ry={5}
                fill={isToday ? "url(#barGrad)" : "#C4B5FD"}
                opacity={d.xp === 0 ? 0.25 : 1}
              />
              {d.xp > 0 && (
                <SvgText
                  x={x + barWidth / 2} y={y - 4}
                  textAnchor="middle" fontSize="9" fontWeight="700"
                  fill={COLORS.primary}
                >
                  {d.xp}
                </SvgText>
              )}
              <SvgText
                x={x + barWidth / 2} y={BAR_HEIGHT + 16}
                textAnchor="middle" fontSize="10" fontWeight="600"
                fill={isToday ? COLORS.primary : "#9CA3AF"}
              >
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

// ─── Accuracy Line Chart ──────────────────────────────────────────────────────

interface AccuracyLineChartProps {
  // Array of accuracy % per lesson completed (last 10)
  data: { label: string; accuracy: number }[];
}

export const AccuracyLineChart: React.FC<AccuracyLineChartProps> = ({ data }) => {
  if (data.length < 2) return <EmptyChart message="Complete more lessons to see your accuracy trend" />;

  const stepX = (CHART_WIDTH - 20) / (data.length - 1);
  const points = data.map((d, i) => ({
    x: 10 + i * stepX,
    y: LINE_HEIGHT - (d.accuracy / 100) * (LINE_HEIGHT - 20),
    acc: d.accuracy,
    label: d.label,
  }));

  // Build SVG path
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Fill area under line
  const fillD = `${pathD} L ${points[points.length - 1].x} ${LINE_HEIGHT} L ${points[0].x} ${LINE_HEIGHT} Z`;

  return (
    <View style={styles.chartWrap}>
      <Svg width={CHART_WIDTH} height={LINE_HEIGHT + 24}>
        <Defs>
          <SvgGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLORS.primary} stopOpacity="0.18" />
            <Stop offset="1" stopColor={COLORS.primary} stopOpacity="0" />
          </SvgGradient>
        </Defs>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((pct) => {
          const y = LINE_HEIGHT - (pct / 100) * (LINE_HEIGHT - 20);
          return (
            <React.Fragment key={pct}>
              <Line x1={0} y1={y} x2={CHART_WIDTH} y2={y} stroke="#F1F5F9" strokeWidth={1} />
              <SvgText x={0} y={y - 2} fontSize="8" fill="#CBD5E1" fontWeight="600">{pct}%</SvgText>
            </React.Fragment>
          );
        })}

        {/* Fill area */}
        <Path d={fillD} fill="url(#lineAreaGrad)" />

        {/* Line */}
        <Path d={pathD} stroke={COLORS.primary} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots + labels */}
        {points.map((p, i) => {
          const isLast = i === points.length - 1;
          return (
            <React.Fragment key={i}>
              <Circle cx={p.x} cy={p.y} r={isLast ? 5 : 3.5}
                fill={isLast ? COLORS.primary : "#FFFFFF"}
                stroke={COLORS.primary} strokeWidth={2}
              />
              {isLast && (
                <SvgText x={p.x} y={p.y - 9} textAnchor="middle" fontSize="9" fontWeight="800" fill={COLORS.primary}>
                  {p.acc}%
                </SvgText>
              )}
              <SvgText x={p.x} y={LINE_HEIGHT + 16} textAnchor="middle" fontSize="9" fontWeight="600" fill="#9CA3AF">
                {p.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

// ─── Topic Progress Bars ──────────────────────────────────────────────────────

interface TopicProgressBarsProps {
  data: { label: string; emoji: string; completed: number; total: number; color: string }[];
}

export const TopicProgressBars: React.FC<TopicProgressBarsProps> = ({ data }) => {
  if (data.every((d) => d.completed === 0)) {
    return <EmptyChart message="Start lessons to track your topic progress" />;
  }

  return (
    <View style={styles.barsWrap}>
      {data.map((item, i) => {
        const pct = item.total > 0 ? (item.completed / item.total) * 100 : 0;
        return (
          <View key={i} style={styles.barRow}>
            <Text style={styles.barEmoji}>{item.emoji}</Text>
            <View style={styles.barInfo}>
              <View style={styles.barLabelRow}>
                <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
                <Text style={[styles.barPct, { color: item.color }]}>{Math.round(pct)}%</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: item.color }]} />
              </View>
              <Text style={styles.barSub}>{item.completed}/{item.total} lessons</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

// ─── Empty state ─────────────────────────────────────────────────────────────

const EmptyChart: React.FC<{ message: string }> = ({ message }) => (
  <View style={styles.emptyChart}>
    <Text style={styles.emptyChartEmoji}>📊</Text>
    <Text style={styles.emptyChartText}>{message}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  chartWrap: { paddingVertical: 8, alignItems: "flex-start" },

  barsWrap: { gap: 14, paddingVertical: 4 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  barEmoji: { fontSize: 20, width: 28, textAlign: "center" },
  barInfo: { flex: 1, gap: 4 },
  barLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  barLabel: { fontSize: 13, fontWeight: "700", color: "#111827", flex: 1 },
  barPct: { fontSize: 12, fontWeight: "800", marginLeft: 8 },
  barTrack: { height: 7, backgroundColor: "#F1F5F9", borderRadius: 99, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 99, minWidth: 4 },
  barSub: { fontSize: 10, color: "#9CA3AF", fontWeight: "600" },

  emptyChart: { alignItems: "center", gap: 6, paddingVertical: 24 },
  emptyChartEmoji: { fontSize: 32 },
  emptyChartText: { fontSize: 12, color: "#9CA3AF", textAlign: "center", fontWeight: "500" },
});
