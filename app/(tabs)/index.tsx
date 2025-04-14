import React, { useEffect, useState } from "react";
import { Dimensions, View } from "react-native";
import { Canvas, Circle, interpolateColors } from "@shopify/react-native-skia";
import Slider from "@react-native-community/slider";

import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  SharedValue,
  interpolate,
  useDerivedValue,
  interpolateColor,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");
const cx = width / 2;
const cy = height / 2;

const spherePoints = generateSpherePoints(100, 400);

export default function App() {
  const sliderValue = useSharedValue(0);
  const angle = useSharedValue(0);

  useEffect(() => {
    angle.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 15000, easing: Easing.linear }),
      -1
    );
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Canvas style={{ flex: 1 }}>
        {spherePoints.map((item, index) => (
          <ProjectedDot
            key={index}
            item={item}
            angle={angle}
            valueFrom0To1={sliderValue}
            cx={cx}
            cy={cy}
          />
        ))}
      </Canvas>
      <View style={{ alignItems: "center" }}>
        <Slider
          style={{ width: 200, height: 40 }}
          minimumValue={0}
          maximumValue={1}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="#000000"
          onValueChange={(value) => {
            sliderValue.value = value;
          }}
          value={sliderValue.value}
        />
      </View>
    </View>
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
    const dot = generateRandomDot();
    points.push({
      x: x,
      randomX: dot.randomX * radius * 3,
      y: y,
      randomY: dot.randomY * radius * 3,
      z: z,
      randomZ: dot.randomZ * radius * 3,
    });
  }
  return points;
}

type Dot = {
  randomX: number;
  randomY: number;
  randomZ: number;
};

function generateRandomDot(): Dot {
  const u = Math.random(); // random in 0..1
  const v = Math.random(); // random in 0..1

  const theta = u * 2 * Math.PI;
  const phi = Math.acos(2 * v - 1);
  const r = Math.pow(Math.random(), 1.0 / 3.0);

  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);

  return { randomX: x, randomY: y, randomZ: z };
}

type DotItem = {
  x: number;
  y: number;
  z: number;
  randomX: number;
  randomY: number;
  randomZ: number;
};

type ProjectedDotProps = {
  item: DotItem;
  angle: SharedValue<number>;
  valueFrom0To1: SharedValue<number>; // range: 0 (original) -> 1 (randomized)
  cx: number;
  cy: number;
};

function ProjectedDot({
  item,
  angle,
  valueFrom0To1,
  cx,
  cy,
}: ProjectedDotProps) {
  const sharedCx = useSharedValue(cx);
  const sharedCy = useSharedValue(cy);
  const sharedR = useSharedValue(2); // initial radius

  const startColors = [
    "rgba(34, 193, 195, 0.4)",
    "rgba(34,193,195,0.4)",
    "rgba(63,94,251,1)",
    "rgba(253,29,29,0.4)",
  ];

  const sharedColor = useSharedValue(`rgba(0,255,255,1)`); // initial color

  useDerivedValue(() => {
    const t = valueFrom0To1.value;

    const interpolatedX = interpolate(t, [0, 1], [item.randomX, item.x]);
    const interpolatedY = interpolate(t, [0, 1], [item.randomY, item.y]);
    const interpolatedZ = interpolate(t, [0, 1], [item.randomZ, item.z]);

    const rx =
      interpolatedX * Math.cos(angle.value) -
      interpolatedZ * Math.sin(angle.value);
    const rz =
      interpolatedX * Math.sin(angle.value) +
      interpolatedZ * Math.cos(angle.value);

    const scale = 300 / (300 + rz);

    sharedCx.value = cx + rx * scale;
    sharedCy.value = cy + interpolatedY * scale;
    sharedR.value = scale * 1.5;

    // 🎨 Moving gradient effect from top to bottom over time
    const radius = 500; // your sphere radius
    const normalizedY = (interpolatedY + radius) / (radius * 2); // from 0 to 1

    const scrollY = normalizedY + angle.value / (Math.PI * 2); // move over time
    const animatedY = scrollY % 1; // wrap around
    // console.log(animatedY);
    sharedColor.value = interpolateColor(
      animatedY,
      [0, 0.25, 0.5, 0.75, 1],
      ["#3f69a7", "#43a264", "#4d2a66", "#43a264", "#3f69a7"] // muted purple → muted teal → back
    );

    return t;
  }, [angle, valueFrom0To1]);

  return <Circle cx={sharedCx} cy={sharedCy} r={sharedR} color={sharedColor} />;
}
