import Svg, { Circle, G, Path, Rect } from "react-native-svg";

type Props = { size?: number };

export function ArtPublish({ size = 260 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 300 300">
      <Rect x="20" y="40" width="260" height="180" rx="20" fill="#EEF2FF" />
      <Rect x="50" y="70" width="200" height="40" rx="10" fill="#6D5CE7" />
      <Rect x="50" y="120" width="120" height="20" rx="6" fill="#C7D2FE" />
      <Rect x="50" y="150" width="160" height="20" rx="6" fill="#C7D2FE" />
      <G>
        <Circle cx="240" cy="200" r="26" fill="#10B981" />
        <Path
          d="M234 200 l8 8 16 -16"
          stroke="white"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}

export function ArtSearch({ size = 260 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 300 300">
      <Rect x="35" y="50" width="230" height="160" rx="20" fill="#ECFEFF" />
      <Rect x="60" y="80" width="180" height="16" rx="8" fill="#67E8F9" />
      <Rect x="60" y="110" width="140" height="16" rx="8" fill="#BAE6FD" />
      <Rect x="60" y="140" width="160" height="16" rx="8" fill="#BAE6FD" />
      <G>
        <Circle cx="210" cy="210" r="30" fill="#6D5CE7" />
        <Path
          d="M238 238 l22 22"
          stroke="#6D5CE7"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <Circle cx="210" cy="210" r="14" fill="white" />
      </G>
    </Svg>
  );
}

export function ArtSecure({ size = 260 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 300 300">
      <G>
        <Path
          d="M150 40 L230 80 V150 C230 200 195 235 150 250 C105 235 70 200 70 150 V80 Z"
          fill="#EEF2FF"
        />
        <Path
          d="M150 100 a28 28 0 0 1 28 28 v10 h-56 v-10 a28 28 0 0 1 28 -28 z"
          fill="#6D5CE7"
        />
        <Rect x="110" y="140" width="80" height="58" rx="12" fill="#C7D2FE" />
        <Circle cx="150" cy="170" r="10" fill="#6D5CE7" />
        <Rect x="147" y="180" width="6" height="14" rx="3" fill="#6D5CE7" />
      </G>
    </Svg>
  );
}
