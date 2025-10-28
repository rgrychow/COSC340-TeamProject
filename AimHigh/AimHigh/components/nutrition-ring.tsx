import React from "react";
import Svg, { Circle } from "react-native-svg";
import { View, Text } from "react-native";

function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

export function Ring({
  size = 96,
  stroke = 10,
  value,
  target,
  color = "#FF6A00",
  warnColor = "#FF4D4F",
  track = "#222",
  label,
  sublabel,
  overCap = 0.5,
}: {
  size?: number;
  stroke?: number;
  value: number;
  target: number;
  color?: string;
  warnColor?: string;
  track?: string;
  label: string;
  sublabel?: string;
  overCap?: number;
}) {
  const ratio = Math.max(0, target > 0 ? value / target : 0);
  const pct = Math.min(1, ratio);
  const over = Math.max(0, Math.min(ratio - 1, overCap));

  const r = Math.max(0.001, (size - stroke) / 2);
  const c = 2 * Math.PI * r;
  const epsilon = 0.0001;

  const mainOffset = pct <= 0 ? c - epsilon : pct >= 1 ? epsilon : c * (1 - pct);

  const overLen = over * c;

  const pctText = over > 0 ? `100% +${Math.round(over * 100)}%` : `${Math.round(pct * 100)}%`;
  const centerColor = over > 0 ? warnColor : "#eee";

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={track}
            strokeWidth={stroke}
            fill="none"
            />
            {/* Progress */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={color}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={[c, c]}
              strokeDashoffset={mainOffset}
//              transform={[{ rotate: "-180deg" }]}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
//              orginX={size / 2}
//              orginY={size / 2}
            />

            {over > 0 && overLen > 0 && (
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={warnColor}
                strokeWidth={stroke}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={[overLen, c]}
                strokeDashoffset={0}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            )}
          </Svg>

          <Text
            style={{
              position: "absolute",
              top: size / 2 - 12,
              left: 0,
              right: 0,
              textAlign: "center",
              color: "#eee",
              fontWeight: "800",
              fontSize: 14,
            }}
          >
            {Math.round(pct * 100)}%
          </Text>
        </View>

        <Text style={{ color: "#eee", fontWeight: "700", marginTop: 8 }}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={{ color: "#bdbdbd", fontSize: 12, marginTop: 2 }}>
            {sublabel}
          </Text>
        ) : null}
      </View>
  );
}
