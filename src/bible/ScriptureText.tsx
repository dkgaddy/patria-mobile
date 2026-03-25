import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { parseTextSegments } from './verseUtils';
import type { ScriptureRef } from './verseUtils';

interface ScriptureTextProps {
  text: string;
  style?: object;
  onRefPress: (ref: ScriptureRef) => void;
}

export function ScriptureText({ text, style, onRefPress }: ScriptureTextProps) {
  const segments = parseTextSegments(text);

  return (
    <Text style={style}>
      {segments.map((seg, i) =>
        seg.type === 'ref' && seg.ref ? (
          <Text
            key={i}
            style={styles.ref}
            onPress={() => onRefPress(seg.ref!)}
          >
            {seg.content}
          </Text>
        ) : (
          <Text key={i}>{seg.content}</Text>
        )
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  ref: {
    color: '#c9a050',
    textDecorationLine: 'underline',
  },
});
