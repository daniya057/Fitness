import { useEffect, useRef, useState } from "react";
import { Platform, Text, TextInput, View } from "react-native";
import { GhostButton, PrimaryButton } from "../../ui/kit";
import { glassStyle } from "../../ui/Glass";
import { cleanBarcode, lookupBarcode } from "./barcode";

export function BarcodeScan({ onClose, onFood }) {
  const hostRef = useRef(null);
  const [digits, setDigits] = useState("");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("Наведи камеру на штрихкод или введи цифры.");
  const [error, setError] = useState("");

  const onFoodRef = useRef(onFood);
  onFoodRef.current = onFood;

  useEffect(() => {
    const node = hostRef.current;
    if (!node || typeof document === "undefined") {
      setHint("Камера недоступна. Введи цифры с пачки.");
      return undefined;
    }

    const video = document.createElement("video");
    video.setAttribute("playsinline", "true");
    video.setAttribute("autoplay", "true");
    video.setAttribute("muted", "true");
    video.style.width = "100%";
    video.style.height = "220px";
    video.style.objectFit = "cover";
    video.style.borderRadius = "22px";
    node.appendChild(video);

    let controls = null;
    let locked = false;

    const stop = () => {
      try {
        controls?.stop();
      } catch {
        // поток уже закрыт
      }
      controls = null;
      video.remove();
    };

    const lookup = async (code) => {
      if (locked) {
        return;
      }
      locked = true;
      setBusy(true);
      setError("");
      try {
        const food = await lookupBarcode(code);
        stop();
        onFoodRef.current(food);
      } catch (err) {
        locked = false;
        setError(err.message || "Не нашли в базе, поищи названием");
      } finally {
        setBusy(false);
      }
    };

    let cancelled = false;

    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const { BarcodeFormat, DecodeHintType } = await import("@zxing/library");
        if (cancelled) {
          return;
        }
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
        ]);
        const reader = new BrowserMultiFormatReader(hints);
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } }, audio: false },
          video,
          (result) => {
            if (result) {
              const raw = result.getText();
              setDigits(cleanBarcode(raw));
              lookup(raw);
            }
          }
        );
        setHint("Наведи на штрихкод — код подхватится сам.");
      } catch {
        setHint("Нет доступа к камере. Разреши её или введи цифры. Нужен https (ссылка share).");
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  const search = async () => {
    setError("");
    setBusy(true);
    try {
      const food = await lookupBarcode(digits);
      onFood(food);
    } catch (err) {
      setError(err.message || "Не нашли в базе, поищи названием");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="absolute inset-0 z-20 justify-end bg-ink/50">
      <View className="rounded-t-[28px] px-5 pb-8 pt-5" style={glassStyle({ borderRadius: 28, backgroundColor: "rgba(7,20,15,0.94)" })}>
        <Text className="text-[20px] font-semibold text-white">Сканер</Text>
        {Platform.OS === "web" ? (
          <Text className="mt-2 text-[13px] leading-5 text-white/60">
            На телефоне камера ловит код лучше. Здесь можно ввести цифры с пачки.
          </Text>
        ) : null}
        <Text className="mt-2 text-[13px] leading-5 text-white/60">{hint}</Text>
        <View ref={hostRef} className="mt-4 h-[220px] overflow-hidden rounded-[22px]" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
        <TextInput
          value={digits}
          onChangeText={(value) => setDigits(cleanBarcode(value))}
          keyboardType="number-pad"
          placeholder="Цифры с пачки"
          placeholderTextColor="#8A8A8A"
          className="mt-4 rounded-2xl px-4 text-[16px] text-white"
          style={[glassStyle({ variant: "fill", borderRadius: 16 }), { minHeight: 48 }]}
        />
        {error ? <Text className="mt-3 text-[13px] text-accent">{error}</Text> : null}
        <View className="mt-5">
          <PrimaryButton label="Найти" onPress={search} busy={busy} disabled={digits.length < 8} />
        </View>
        <View className="mt-3">
          <GhostButton glass label="Закрыть" onPress={onClose} />
        </View>
      </View>
    </View>
  );
}
