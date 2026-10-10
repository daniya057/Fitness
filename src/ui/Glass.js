import { useEffect } from "react";
import { Platform, View } from "react-native";
import { getPalette } from "./theme";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export const GLASS_BG = "#07140F";

const LENS_ID = "lg-lens-clear";

function roundedSdf(nx, ny) {
  const radius = 0.2;
  const half = 0.5 - radius;
  const qx = Math.abs(nx - 0.5) - half;
  const qy = Math.abs(ny - 0.5) - half;
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  const inside = Math.min(Math.max(qx, qy), 0);
  return outside + inside - radius;
}

function rimMapUrl() {
  const size = 160;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const image = context.createImageData(size, size);
  const band = 0.24;
  const sample = (px, py) => roundedSdf(px, py);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = (x + 0.5) / size;
      const ny = (y + 0.5) / size;
      const dist = sample(nx, ny);
      let dx = 128;
      let dy = 128;
      if (dist < 0 && dist > -band) {
        const eps = 0.006;
        const gx = sample(nx + eps, ny) - sample(nx - eps, ny);
        const gy = sample(nx, ny + eps) - sample(nx, ny - eps);
        const len = Math.hypot(gx, gy) || 1;
        const edge = 1 - -dist / band;
        const push = edge * 127;
        dx = Math.max(0, Math.min(255, 128 + (gx / len) * push));
        dy = Math.max(0, Math.min(255, 128 + (gy / len) * push));
      }
      const index = (y * size + x) * 4;
      image.data[index] = dx;
      image.data[index + 1] = dy;
      image.data[index + 2] = 128;
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

function ensureLens() {
  if (Platform.OS !== "web" || typeof document === "undefined" || !document.body) {
    return false;
  }
  const previous = document.getElementById("lg-lens-svg");
  if (previous) {
    previous.remove();
  }
  if (typeof CSS !== "undefined" && !CSS.supports("backdrop-filter", `url(#${LENS_ID})`)) {
    return false;
  }
  try {
  const href = rimMapUrl();
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("id", "lg-lens-svg");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  svg.innerHTML = `<filter id="${LENS_ID}" filterUnits="objectBoundingBox" primitiveUnits="objectBoundingBox" x="-0.12" y="-0.12" width="1.24" height="1.24" color-interpolation-filters="sRGB">
    <feImage href="${href}" result="map" x="0" y="0" width="1" height="1" preserveAspectRatio="none"/>
    <feDisplacementMap in="SourceGraphic" in2="map" scale="-0.55" xChannelSelector="R" yChannelSelector="G" result="bent"/>
    <feDisplacementMap in="SourceGraphic" in2="map" scale="-0.46" xChannelSelector="R" yChannelSelector="G" result="bendR"/>
    <feDisplacementMap in="SourceGraphic" in2="map" scale="-0.64" xChannelSelector="R" yChannelSelector="G" result="bendB"/>
    <feColorMatrix in="bendR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red"/>
    <feColorMatrix in="bent" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green"/>
    <feColorMatrix in="bendB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue"/>
    <feBlend in="red" in2="green" mode="screen" result="rg"/>
    <feBlend in="rg" in2="blue" mode="screen"/>
  </filter>`;
  document.body.appendChild(svg);
  return true;
  } catch {
    return false;
  }
}

let lensOn = null;

function onPhone() {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    return true;
  }
  if (typeof navigator === "undefined") {
    return false;
  }
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function isSafariWeb() {
  if (Platform.OS !== "web" || typeof navigator === "undefined") {
    return false;
  }
  const ua = navigator.userAgent || "";
  return /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|EdgiOS|Android/i.test(ua);
}

function usesFrost() {
  return onPhone() || isSafariWeb();
}

function lensEnabled() {
  if (usesFrost()) {
    return false;
  }
  if (lensOn == null) {
    lensOn = ensureLens();
  }
  return lensOn;
}

function materialShadow(thick, frost) {
  if (frost) {
    if (thick) {
      return "0 28px 64px rgba(0,0,0,0.46), inset 0 1px 1px rgba(255,255,255,0.78), inset 0 8px 22px rgba(255,255,255,0.1), inset 0 -12px 20px rgba(255,255,255,0.05), inset 1px 0 1px rgba(255,255,255,0.3), inset -1px 0 1px rgba(255,255,255,0.2)";
    }
    return "0 12px 28px rgba(0,0,0,0.32), inset 0 1px 1px rgba(255,255,255,0.7), inset 0 6px 14px rgba(255,255,255,0.08), inset 0 -1px 1px rgba(255,255,255,0.16), inset 1px 0 1px rgba(255,255,255,0.22), inset -1px 0 1px rgba(255,255,255,0.16)";
  }
  if (thick) {
    return "0 28px 64px rgba(0,0,0,0.46), inset 0 1px 1px rgba(255,255,255,0.62), inset 0 -10px 18px rgba(255,255,255,0.05), inset 1px 0 1px rgba(255,255,255,0.22), inset -1px 0 1px rgba(255,255,255,0.16)";
  }
  return "0 12px 28px rgba(0,0,0,0.32), inset 0 1px 1px rgba(255,255,255,0.5), inset 0 -1px 1px rgba(255,255,255,0.14), inset 1px 0 1px rgba(255,255,255,0.16), inset -1px 0 1px rgba(255,255,255,0.12)";
}

export function glassStyle(extra) {
  const input = extra || {};
  const variant = input.variant === "fill" ? "fill" : "material";
  const rest = { ...input };
  delete rest.variant;
  const radius = Number(rest.borderRadius);
  const thick = variant === "material" && (Number.isFinite(radius) ? radius >= 24 : true);

  const tone = getPalette();

  if (variant === "fill") {
    return {
      backgroundColor: tone.fill,
      borderWidth: 1,
      borderColor: tone.line,
      ...rest,
    };
  }

  const frost = usesFrost();
  const filter = frost
    ? "blur(22px) saturate(1.85) brightness(1.08)"
    : "blur(4px) saturate(1.25) brightness(1.03)";
  const lens = lensEnabled() ? `url(#${LENS_ID}) ${filter}` : filter;

  return {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: tone.line,
    ...(Platform.OS === "web"
      ? {
          backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.01) 50%, rgba(255,255,255,0.02))",
          boxShadow: materialShadow(thick, frost),
          backdropFilter: lens,
          WebkitBackdropFilter: lens,
          ...(frost ? { isolation: "isolate" } : null),
        }
      : {
          backgroundColor: "rgba(255,255,255,0.1)",
          borderColor: "rgba(255,255,255,0.28)",
          shadowColor: "#000000",
          shadowOpacity: 0.4,
          shadowRadius: thick ? 24 : 12,
          shadowOffset: { width: 0, height: thick ? 16 : 8 },
          elevation: thick ? 10 : 6,
        }),
    ...rest,
  };
}

function Glow() {
  const opacity = useSharedValue(0.22);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.45, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: -36,
          alignSelf: "center",
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: "rgba(80, 230, 150, 0.2)",
        },
        Platform.OS === "web" ? { filter: "blur(36px)" } : null,
        style,
      ]}
    />
  );
}

export function AccentGlow({ size = 120, pulse = false, color = "rgba(125,255,179,0.5)" }) {
  const opacity = useSharedValue(pulse ? 0.62 : 1);

  useEffect(() => {
    if (!pulse) {
      return;
    }
    opacity.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [pulse, opacity]);

  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: "50%",
          left: "50%",
          width: size,
          height: size,
          marginTop: -size / 2,
          marginLeft: -size / 2,
          borderRadius: size / 2,
          backgroundColor: color,
          ...(Platform.OS === "web"
            ? {
                filter: "blur(20px)",
                boxShadow: `0 0 ${Math.round(size * 0.4)}px ${Math.round(size * 0.14)}px ${color}`,
              }
            : {
                shadowColor: "#7DFFB3",
                shadowOpacity: 0.95,
                shadowRadius: Math.round(size * 0.38),
                shadowOffset: { width: 0, height: 0 },
              }),
        },
        fade,
      ]}
    />
  );
}

export function GlassPanel({ children, style, delay = 0, glow = false }) {
  return (
    <Animated.View
      entering={
        onPhone()
          ? FadeIn.duration(380).delay(delay)
          : FadeInDown.duration(520).delay(delay).springify().damping(18).stiffness(150)
      }
      style={[glassStyle({ borderRadius: 28, ...(Platform.OS === "web" ? { overflow: "hidden" } : null) }), style]}
    >
      {glow ? <Glow /> : null}
      {children}
    </Animated.View>
  );
}

export function AmbientWash() {
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [drift]);

  const left = useAnimatedStyle(() => ({
    opacity: 0.45 + drift.value * 0.35,
    transform: [{ translateX: -16 + drift.value * 36 }, { translateY: drift.value * 28 }],
  }));
  const right = useAnimatedStyle(() => ({
    opacity: 0.3 + (1 - drift.value) * 0.3,
    transform: [{ translateX: 12 - drift.value * 28 }, { translateY: -drift.value * 20 }],
  }));

  const blob = {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: getPalette().orb,
  };

  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}>
      <Animated.View
        style={[
          blob,
          { top: -80, left: -40, width: 280, height: 280 },
          Platform.OS === "web" ? { filter: "blur(28px)" } : null,
          left,
        ]}
      />
      <Animated.View
        style={[
          blob,
          { top: 280, right: -70, width: 240, height: 240, backgroundColor: getPalette().orbDeep },
          Platform.OS === "web" ? { filter: "blur(36px)" } : null,
          right,
        ]}
      />
    </View>
  );
}

export function screenEnter() {
  "worklet";
  return {
    initialValues: {
      opacity: 0,
    },
    animations: {
      opacity: withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }),
    },
  };
}

export function movePill(shared, next) {
  shared.value = withSpring(next, { damping: 18, stiffness: 190, mass: 0.7 });
}
