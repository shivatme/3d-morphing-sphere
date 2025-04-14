import React, { useEffect } from "react";
import { Dimensions } from "react-native";
import { Canvas, Circle, Skia } from "@shopify/react-native-skia";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useDerivedValue,
  useFrameCallback,
  useAnimatedReaction,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useState } from "react";

const { width, height } = Dimensions.get("window");
const cx = width / 2;
const cy = height / 2;

const spherePoints = generateSpherePoints(100, 50);

export default function App() {
  const angle = useSharedValue(0);

  useEffect(() => {
    angle.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 10000, easing: Easing.linear }),
      -1
    );
  }, []);
  // useEffect(() => {
  //   // console.log(angle.value);
  // }, [angle.value]);

  const anh = useSharedValue(0);
  useFrameCallback((frameInfo) => {
    // console.log(frameInfo);
    anh.value = angle.value;
  });
  const projectedPoints = useDerivedValue(() => {
    const a = anh.value;
    return spherePoints.map(({ x, y, z }) => {
      const rx = x * Math.cos(a) - z * Math.sin(a);
      const rz = x * Math.sin(a) + z * Math.cos(a);
      const scale = 300 / (300 + rz);
      return {
        x: cx + rx * scale,
        y: cy + y * scale,
        r: 2 * scale,
        alpha: scale,
      };
    });
  });

  return (
    <Canvas style={{ flex: 1 }}>
      {projectedPoints.value.map((p, i) => (
        <Circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.r}
          color={`rgba(0, 255, 255, 1)`}
        />
      ))}
    </Canvas>
  );
}

function generateSpherePoints(radius: number, count: number) {
  const points = [];
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const x = radius * Math.cos(theta) * Math.sin(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi);
    const z = radius * Math.cos(phi);
    points.push({ x, y, z });
  }
  return points;
}
