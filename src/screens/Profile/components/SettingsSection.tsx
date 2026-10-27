import React from 'react';
import {Alert, Pressable, StyleSheet, Text, View} from 'react-native';
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
              onPress={item.onPress ?? (() => Alert.alert(item.label,
                item.label === '도움말'
                  ? '홈에서 기분과 취향을 선택하고, 채팅에서 뿡뿡이와 대화할 수 있습니다. 리포트에서 건강 데이터와 주간 화면을 확인하세요. 시연 대화는 이 폰에만 저장됩니다.'
                  : '현재 팀 원본의 화면입니다. 이 메뉴의 계정·저장 기능은 로그인 및 백엔드 서버 연결이 필요합니다.'))}
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
