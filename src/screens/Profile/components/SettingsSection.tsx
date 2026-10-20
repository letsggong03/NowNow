import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {ChevronRight, type LucideIcon} from 'lucide-react-native';
import {shadows} from '../../../theme/shadows';
import {useAppTheme} from '../../../theme/ThemeProvider';

interface SettingItem {
  label: string;
  description?: string;
  Icon: LucideIcon;
  destructive?: boolean;
  onPress?: () => void;
}

interface SettingsSectionProps {
  title?: string;
  items: SettingItem[];
}

export default function SettingsSection({title, items}: SettingsSectionProps) {
  const {theme} = useAppTheme();

  return (
    <View style={styles.section}>
      {title && (
        <Text style={[styles.sectionTitle, {color: theme.textMuted}]}>
          {title}
        </Text>
      )}
      <View style={[styles.card, {backgroundColor: theme.surface}]}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const {Icon} = item;

          return (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              style={({pressed}) => [
                styles.row,
                !isLast && styles.divider,
                !isLast && {borderBottomColor: theme.border},
                pressed && {backgroundColor: theme.pressed},
              ]}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: item.destructive
                      ? theme.accentMuted
                      : theme.iconSurface,
                  },
                ]}>
                <Icon
                  color={item.destructive ? theme.accent : theme.icon}
                  size={20}
                />
              </View>
              <View style={styles.textArea}>
                <Text
                  style={[
                    styles.label,
                    {color: item.destructive ? theme.accent : theme.text},
                  ]}>
                  {item.label}
                </Text>
                {item.description && (
                  <Text style={[styles.description, {color: theme.textMuted}]}>
                    {item.description}
                  </Text>
                )}
              </View>
              {!item.destructive && (
                <ChevronRight color={theme.textMuted} size={18} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    rowGap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 4,
  },
  card: {
    ...shadows.raised,
    borderRadius: 20,
    overflow: 'hidden',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 66,
    paddingHorizontal: 16,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  textArea: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
  },
  description: {
    fontSize: 12,
    marginTop: 4,
  },
});
