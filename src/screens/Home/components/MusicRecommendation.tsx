import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

import {getMusicRecommendation, type MusicTrack} from '../../../services/api/music';
import {useAppTheme} from '../../../theme/ThemeProvider';

interface MusicRecommendationProps {
  choice: string;
}

// 카드 안쪽 여백(padding 10 × 2)
const CARD_PADDING = 20;

// 유튜브 뮤직 앱이 있으면 앱에서, 없으면 웹(브라우저)에서 열린다.
const openInYouTubeMusic = (videoId: string) =>
  Linking.openURL(`https://music.youtube.com/watch?v=${videoId}`).catch(error =>
    console.log('[music] 유튜브 뮤직 열기 실패:', error),
  );

export default function MusicRecommendation({choice}: MusicRecommendationProps) {
  const {theme} = useAppTheme();
  const [track, setTrack] = useState<MusicTrack | null>(null);
  const [failed, setFailed] = useState(false);
  const [playerWidth, setPlayerWidth] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setTrack(null);
    setFailed(false);

    getMusicRecommendation(choice)
      .then(result => !cancelled && setTrack(result))
      .catch(error => {
        console.log('[music] 추천곡 조회 실패:', error);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [choice]);

  if (failed) {
    return (
      <Text style={[styles.notice, {color: theme.textMuted}]}>
        지금은 음악을 불러올 수 없어요.
      </Text>
    );
  }

  if (!track) {
    return <ActivityIndicator style={styles.loading} color={theme.accent} />;
  }

  return (
    <View
      style={[
        styles.card,
        {backgroundColor: theme.surfaceMuted, borderColor: theme.border},
      ]}
      onLayout={event =>
        setPlayerWidth(event.nativeEvent.layout.width - CARD_PADDING)
      }>
      {/* 유튜브는 앱 안 플레이어의 자동 재생을 막아서, 플레이어를 바로 보여 주고
          플레이어의 재생 버튼을 누르게 한다. 규칙상 영상 화면이 보이게 재생해야 한다. */}
      {playerWidth > 0 && (
        <YoutubePlayer
          width={playerWidth}
          height={Math.round((playerWidth * 9) / 16)}
          videoId={track.videoId}
        />
      )}

      <View>
        <Text numberOfLines={2} style={[styles.title, {color: theme.text}]}>
          {track.title}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.channel, {color: theme.textMuted}]}>
          {track.channel}
        </Text>
      </View>

      <Pressable
        onPress={() => openInYouTubeMusic(track.videoId)}
        style={({pressed}) => [
          styles.actionButton,
          {borderColor: theme.border},
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.actionLabel, {color: theme.text}]}>
          유튜브 뮤직에서 듣기
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 6,
    marginTop: 6,
    padding: CARD_PADDING / 2,
    rowGap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  channel: {
    fontSize: 12,
    marginTop: 2,
  },
  actionButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
  },
  loading: {
    marginVertical: 10,
  },
  notice: {
    fontSize: 12,
    marginBottom: 6,
    marginTop: 4,
    paddingLeft: 16,
  },
});
