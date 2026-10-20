import { View } from "react-native";
import Svg, { Circle, Rect, Text as SvgText } from "react-native-svg";

function kindOf(title) {
  const key = String(title || "").trim();
  if (key === "Жим в тренажёре" || key === "Сведение рук в тренажёре") {
    return "chest";
  }
  if (key === "Жим от плеч в тренажёре") {
    return "shoulder";
  }
  if (key === "Тяга верхнего блока" || key === "Пуловер на блоке" || key === "Тяга к лицу на блоке") {
    return "pulldown";
  }
  if (key === "Тяга нижнего блока") {
    return "row";
  }
  if (key === "Жим ногами") {
    return "legpress";
  }
  if (key === "Разгибание ног" || key === "Сгибание ног" || key === "Разведение ног" || key === "Скручивания в тренажёре") {
    return "seated";
  }
  if (key === "Гиперэкстензия") {
    return "hyper";
  }
  return "";
}

function Frame({ children }) {
  return (
    <View className="items-center">
      <Svg width={220} height={148} viewBox="0 0 220 148">
        <Rect x="8" y="8" width="204" height="132" rx="18" fill="rgba(255,255,255,0.06)" />
        {children}
      </Svg>
    </View>
  );
}

function Chest() {
  return (
    <Frame>
      <Rect x="78" y="38" width="64" height="78" rx="10" fill="rgba(143,220,184,0.22)" />
      <Rect x="78" y="38" width="18" height="78" rx="6" fill="rgba(143,220,184,0.55)" />
      <Circle cx="110" cy="78" r="14" fill="rgba(255,255,255,0.85)" />
      <Rect x="36" y="68" width="28" height="10" rx="4" fill="#8FDCB8" />
      <Rect x="156" y="68" width="28" height="10" rx="4" fill="#8FDCB8" />
      <SvgText x="86" y="28" fill="rgba(255,255,255,0.55)" fontSize="10">
        спинка
      </SvgText>
      <SvgText x="28" y="96" fill="rgba(255,255,255,0.55)" fontSize="10">
        рукояти
      </SvgText>
      <SvgText x="98" y="128" fill="rgba(255,255,255,0.7)" fontSize="11">
        ты
      </SvgText>
    </Frame>
  );
}

function Shoulder() {
  return (
    <Frame>
      <Rect x="86" y="52" width="48" height="62" rx="10" fill="rgba(143,220,184,0.22)" />
      <Rect x="86" y="52" width="14" height="62" rx="5" fill="rgba(143,220,184,0.55)" />
      <Circle cx="110" cy="78" r="12" fill="rgba(255,255,255,0.85)" />
      <Rect x="58" y="28" width="14" height="36" rx="4" fill="#8FDCB8" />
      <Rect x="148" y="28" width="14" height="36" rx="4" fill="#8FDCB8" />
      <SvgText x="92" y="24" fill="rgba(255,255,255,0.55)" fontSize="10">
        рукояти у плеч
      </SvgText>
    </Frame>
  );
}

function Pulldown() {
  return (
    <Frame>
      <Rect x="40" y="22" width="140" height="8" rx="4" fill="#8FDCB8" />
      <Rect x="106" y="30" width="8" height="28" fill="rgba(255,255,255,0.35)" />
      <Rect x="78" y="70" width="64" height="50" rx="10" fill="rgba(143,220,184,0.22)" />
      <Circle cx="110" cy="88" r="12" fill="rgba(255,255,255,0.85)" />
      <Rect x="70" y="118" width="80" height="8" rx="4" fill="rgba(143,220,184,0.55)" />
      <SvgText x="78" y="18" fill="rgba(255,255,255,0.55)" fontSize="10">
        гриф сверху
      </SvgText>
      <SvgText x="78" y="140" fill="rgba(255,255,255,0.55)" fontSize="10">
        бёдра под валиком
      </SvgText>
    </Frame>
  );
}

function Row() {
  return (
    <Frame>
      <Rect x="28" y="70" width="54" height="12" rx="6" fill="#8FDCB8" />
      <Rect x="100" y="58" width="70" height="48" rx="12" fill="rgba(143,220,184,0.22)" />
      <Circle cx="128" cy="78" r="12" fill="rgba(255,255,255,0.85)" />
      <SvgText x="24" y="60" fill="rgba(255,255,255,0.55)" fontSize="10">
        к животу
      </SvgText>
      <SvgText x="108" y="128" fill="rgba(255,255,255,0.55)" fontSize="10">
        спина прямая
      </SvgText>
    </Frame>
  );
}

function LegPress() {
  return (
    <Frame>
      <Rect x="36" y="48" width="86" height="54" rx="12" fill="rgba(143,220,184,0.22)" transform="rotate(-18 80 75)" />
      <Circle cx="78" cy="78" r="12" fill="rgba(255,255,255,0.85)" />
      <Rect x="150" y="36" width="36" height="70" rx="8" fill="#8FDCB8" />
      <SvgText x="36" y="28" fill="rgba(255,255,255,0.55)" fontSize="10">
        поясница к спинке
      </SvgText>
      <SvgText x="148" y="122" fill="rgba(255,255,255,0.55)" fontSize="10">
        платформа
      </SvgText>
    </Frame>
  );
}

function Seated() {
  return (
    <Frame>
      <Rect x="72" y="48" width="76" height="58" rx="12" fill="rgba(143,220,184,0.22)" />
      <Circle cx="110" cy="72" r="12" fill="rgba(255,255,255,0.85)" />
      <Rect x="60" y="92" width="28" height="14" rx="6" fill="#8FDCB8" />
      <Rect x="132" y="92" width="28" height="14" rx="6" fill="#8FDCB8" />
      <SvgText x="86" y="132" fill="rgba(255,255,255,0.55)" fontSize="10">
        валики у ног
      </SvgText>
    </Frame>
  );
}

function Hyper() {
  return (
    <Frame>
      <Rect x="70" y="78" width="80" height="14" rx="7" fill="#8FDCB8" />
      <Rect x="96" y="40" width="28" height="70" rx="12" fill="rgba(255,255,255,0.82)" />
      <SvgText x="78" y="112" fill="rgba(255,255,255,0.55)" fontSize="10">
        таз на подушке
      </SvgText>
    </Frame>
  );
}

export function MoveDiagram({ title }) {
  const kind = kindOf(title);
  if (kind === "chest") {
    return <Chest />;
  }
  if (kind === "shoulder") {
    return <Shoulder />;
  }
  if (kind === "pulldown") {
    return <Pulldown />;
  }
  if (kind === "row") {
    return <Row />;
  }
  if (kind === "legpress") {
    return <LegPress />;
  }
  if (kind === "seated") {
    return <Seated />;
  }
  if (kind === "hyper") {
    return <Hyper />;
  }
  return null;
}
