import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { FontSize, Spacing, palette } from '@/constants/theme';

type MarkProps = {
  size?: number;
  background?: string;
  glyph?: string;
  accent?: string;
};

/** MESSA icon mark: a speech bubble with data rows and a forward arrow. */
export function MessaMark({
  size = 44,
  background = palette.indigo,
  glyph = palette.white,
  accent = palette.cyan,
}: MarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Rect x={0} y={0} width={48} height={48} rx={13} fill={background} />
      <Path
        d="M13.5 13h21a4 4 0 0 1 4 4v10.5a4 4 0 0 1-4 4H24l-6.4 5.7a.7.7 0 0 1-1.16-.53V31.5h-2.94a4 4 0 0 1-4-4V17a4 4 0 0 1 4-4Z"
        fill={glyph}
      />
      <Rect x={15.5} y={18} width={17} height={2.6} rx={1.3} fill={background} />
      <Rect x={15.5} y={23} width={10.5} height={2.6} rx={1.3} fill={background} />
      <Path
        d="M28.2 25.6 32 23l-3.8-2.6"
        stroke={accent}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type LogoProps = {
  size?: number;
  showTagline?: boolean;
  color?: string;
};

export function MessaLogo({ size = 40, showTagline, color = palette.text }: LogoProps) {
  return (
    <View style={styles.logo}>
      <MessaMark size={size} />
      <View>
        <Text style={[styles.wordmark, { color }]}>MESSA</Text>
        {showTagline ? <Text style={styles.tagline}>Data-to-SMS</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  wordmark: {
    fontSize: FontSize.section,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: FontSize.caption,
    color: palette.textSecondary,
    letterSpacing: 0.5,
  },
});
