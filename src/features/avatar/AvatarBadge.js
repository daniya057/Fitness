import { Image, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import { AccentGlow } from "../../ui/Glass";
import { wornLook } from "./looks";

const SIZES = {
  sm: { box: 40, icon: 18, spark: 10 },
  lg: { box: 88, icon: 40, spark: 16 },
};

export function AvatarBadge({ user, size = "sm", hollow = false }) {
  const pack = SIZES[size] || SIZES.sm;
  const { face, ring } = wornLook(user);
  const Icon = face.Icon;
  const layers = ring.layers || [ring.color];
  const step = size === "lg" ? 4 : 3;
  const pad = Math.max(0, (layers.length - 1) * step);
  const inner = pack.box - 8;
  const photo = !hollow && user?.avatarFace === "photo" && user?.avatarPhoto;

  return (
    <View className="items-center justify-center" style={{ width: pack.box + pad, height: pack.box + pad }}>
      {ring.glow ? <AccentGlow size={pack.box + 18} color={ring.glow} /> : null}
      {layers.map((color, index) => {
        const inset = index * step;
        const dim = pack.box + pad - inset * 2;
        return (
          <View
            key={`${ring.id}-${index}`}
            pointerEvents="none"
            style={{
              position: "absolute",
              top: inset,
              left: inset,
              width: dim,
              height: dim,
              borderRadius: dim / 2,
              borderWidth: ring.width || 2,
              borderColor: color,
            }}
          />
        );
      })}
      <View
        className="items-center justify-center overflow-hidden rounded-full"
        style={{
          width: inner,
          height: inner,
          borderRadius: 999,
          backgroundColor: hollow ? "transparent" : "rgba(7,20,15,0.72)",
        }}
      >
        {photo ? (
          <Image source={{ uri: user.avatarPhoto }} style={{ width: inner, height: inner }} />
        ) : hollow ? null : (
          <Icon size={pack.icon} color={face.ink} strokeWidth={1.8} />
        )}
      </View>
      {ring.sparkle ? (
        <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0 }}>
          <Sparkles size={pack.spark} color="#FFD54F" strokeWidth={1.8} />
        </View>
      ) : null}
    </View>
  );
}
