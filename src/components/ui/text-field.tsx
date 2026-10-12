import { useId, useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { fonts, radius, spacing, typography, useTheme } from '@/theme';

import { AppText } from './app-text';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  optional?: boolean;
  hideLabel?: boolean;
  multiline?: boolean;
  lines?: number;
  maxLength?: number;
  disabled?: boolean;
  icon?: ReactNode;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  optional = false,
  hideLabel = false,
  multiline = false,
  lines = 3,
  maxLength,
  disabled = false,
  icon,
}: Props) {
  const colors = useTheme();
  const labelId = useId();
  const [focused, setFocused] = useState(false);
  const highlighted = !disabled && (focused || value.length > 0);
  const lineHeight = typography.body.lineHeight ?? 22;

  return (
    <View style={styles.container}>
      {!hideLabel && (
        <AppText variant="bodyStrong" nativeID={labelId}>
          {label}
          {optional && (
            <AppText variant="body" tone="muted">
              {' '}
              (optional)
            </AppText>
          )}
        </AppText>
      )}
      <View
        style={[
          styles.field,
          multiline ? { minHeight: lines * lineHeight + 2 * spacing.md } : styles.singleLine,
          {
            backgroundColor: disabled ? colors.surface.sunken : colors.surface.default,
            borderColor: highlighted ? colors.accent.base : colors.line.default,
          },
        ]}
      >
        {icon}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.disabled}
          editable={!disabled}
          multiline={multiline}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          accessibilityLabelledBy={hideLabel ? undefined : labelId}
          style={[styles.input, { color: colors.text.default }, multiline && styles.multiline]}
        />
      </View>
      {maxLength !== undefined && (
        <AppText variant="mono" tone="muted" style={styles.counter}>
          {value.length}/{maxLength}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 13,
  },
  singleLine: { height: 48 },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 15 },
  multiline: {
    alignSelf: 'stretch',
    paddingVertical: spacing.md,
    lineHeight: typography.body.lineHeight,
    textAlignVertical: 'top',
  },
  counter: { alignSelf: 'flex-end', fontSize: 11 },
});
