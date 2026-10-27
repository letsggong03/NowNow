import React, {useEffect, useRef, useState} from 'react';
import {
  Activity,
  MessageCircle,
  Home,
  UserRound,
} from 'lucide-react-native';
import {
  Pressable,
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ChatPage from '../screens/Chat/ChatPage';
import HomePage from '../screens/Home/HomePage';
import MyPage from '../screens/Profile/MyPage';
import ReportPage from '../screens/Report/ReportPage';
import {TAB_BAR} from '../theme/layout';
import {shadows} from '../theme/shadows';
import {useAppTheme} from '../theme/ThemeProvider';

type TabKey = 'Home' | 'Chat' | 'Report' | 'Settings';

const tabs: {
  key: TabKey;
  label: string;
  Icon: typeof Home;
}[] = [
  {key: 'Home', label: '홈', Icon: Home},
  {key: 'Chat', label: '채팅', Icon: MessageCircle},
  {key: 'Report', label: '리포트', Icon: Activity},
  {key: 'Settings', label: '내 설정', Icon: UserRound},
];

const renderScreen = (activeTab: TabKey, setActiveTab: (tab: TabKey) => void) => {
  if (activeTab === 'Chat') {
    return (
      <ChatPage
        date={new Date().toISOString()}
        onBack={() => setActiveTab('Home')}
      />
    );
  }

  if (activeTab === 'Report') {
    return <ReportPage />;
  }

  if (activeTab === 'Settings') {
    return <MyPage />;
  }

  return <HomePage />;
};

export default function TabNavigator() {
  const [activeTab, setActiveTab] = useState<TabKey>('Home');
  const [tabWidth, setTabWidth] = useState(0);
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const {theme} = useAppTheme();
  const activeIndex = tabs.findIndex(tab => tab.key === activeTab);

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      damping: 14,
      mass: 0.8,
      stiffness: 150,
      toValue: activeIndex * tabWidth,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, indicatorAnim, tabWidth]);

  const handleTabBarLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setTabWidth((width - TAB_BAR.padding * 2) / tabs.length);
  };

  return (
    <View style={styles.container}>
      <View style={styles.screen}>{renderScreen(activeTab, setActiveTab)}</View>

      {activeTab !== 'Chat' && (
      <View
        style={[styles.tabBar, {backgroundColor: theme.nav}]}
        onLayout={handleTabBarLayout}>
        {tabWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activeIndicator,
              {
                backgroundColor: theme.navIndicator,
                left: TAB_BAR.padding + tabWidth / 2 - TAB_BAR.indicatorWidth / 2,
                transform: [{translateX: indicatorAnim}],
              },
            ]}
          />
        )}
        {tabs.map(({key, label, Icon}) => {
          const focused = activeTab === key;
          const iconColor = focused ? theme.text : theme.icon;

          return (
            <Pressable
              key={key}
              onPress={() => setActiveTab(key)}
              style={({pressed}) => [
                styles.tabItem,
                pressed && styles.pressedTabItem,
              ]}>
              <View style={styles.iconWrap}>
                <Icon color={iconColor} size={22} />
              </View>
              <Text
                style={[
                  styles.label,
                  {color: theme.icon},
                  focused && styles.activeLabel,
                  focused && {color: theme.text},
                ]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  tabBar: {
    ...shadows.floating,
    alignItems: 'center',
    borderRadius: TAB_BAR.height / 2,
    bottom: TAB_BAR.bottomOffset,
    flexDirection: 'row',
    height: TAB_BAR.height,
    justifyContent: 'space-around',
    left: TAB_BAR.sideInset,
    paddingHorizontal: TAB_BAR.padding,
    paddingVertical: 6,
    position: 'absolute',
    right: TAB_BAR.sideInset,
  },
  activeIndicator: {
    borderRadius: 24,
    height: TAB_BAR.height - TAB_BAR.padding * 2,
    position: 'absolute',
    top: TAB_BAR.padding,
    width: TAB_BAR.indicatorWidth,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    height: 58,
    justifyContent: 'center',
    zIndex: 1,
  },
  pressedTabItem: {
    opacity: 0.7,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 20,
    height: 25,
    justifyContent: 'center',
    width: 42,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 0,
  },
  activeLabel: {
    fontWeight: '700',
  },
});
