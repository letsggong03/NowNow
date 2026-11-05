import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import {Play} from 'lucide-react-native';

import Text from '../../../components/AppText';
import {
  getMusicRecommendations,
  type MusicTrack,
} from '../../../services/api/music';
import {shadows} from '../../../theme/shadows';
import {useAppTheme} from '../../../theme/ThemeProvider';

interface MusicRecommendationProps {
  choice: string;
}

const ART_SIZE = 132;
const ART_BORDER = 3; // 고른 곡 테두리
const ART_INNER = ART_SIZE - ART_BORDER * 2;
// 유튜브 썸네일(4:3)은 16:9 영상 위아래에 검은 띠가 있다.
// 띠를 빼고 영상 부분이 정사각형을 꽉 채우도록 키워서 가운데만 보여 준다.
const ART_IMAGE_HEIGHT = ART_INNER / 0.75;
const ART_IMAGE_WIDTH = (ART_IMAGE_HEIGHT * 4) / 3;

// 유튜브 뮤직 앱이 있으면 앱에서, 없으면 웹(브라우저)에서 열린다.
const openInYouTubeMusic = (videoId: string) =>
  Linking.openURL(`https://music.youtube.com/watch?v=${videoId}`).catch(error =>
    console.log('[music] 유튜브 뮤직 열기 실패:', error),
  );

function AlbumCard({
  track,
  selected,
  onPress,
}: {
  track: MusicTrack;
  selected: boolean;
  onPress: () => void;
}) {
  const {theme} = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [styles.albumCard, pressed && styles.pressed]}>
      <View
        style={[
          styles.art,
          {backgroundColor: theme.border},
          selected && {borderColor: theme.accent},
        ]}>
        {track.thumbnail && (
          <Image source={{uri: track.thumbnail}} style={styles.artImage} />
        )}
        <View style={[styles.playBadge, selected && {backgroundColor: theme.accent}]}>
          <Play color="#FFFFFF" fill="#FFFFFF" size={13} />
        </View>
      </View>
      <Text numberOfLines={1} style={[styles.songTitle, {color: theme.text}]}>
        {track.title}
      </Text>
      <Text numberOfLines={1} style={[styles.artist, {color: theme.textMuted}]}>
        {track.artist}
      </Text>
    </Pressable>
  );
}

// 오늘의 추천곡 갤러리: 정사각형 앨범 자켓 + 곡명 + 아티스트. 누르면 위에 플레이어가 열린다.
export default function MusicRecommendation({choice}: MusicRecommendationProps) {
  const {theme} = useAppTheme();
  const [tracks, setTracks] = useState<MusicTrack[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playerWidth, setPlayerWidth] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setTracks(null);
    setFailed(false);
    setSelectedId(null);

    getMusicRecommendations(choice)
      .then(result => !cancelled && setTracks(result))
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

  if (!tracks) {
    return <ActivityIndicator style={styles.loading} color={theme.accent} />;
  }

  const selected = tracks.find(track => track.videoId === selectedId);

  return (
    <View
      style={styles.wrap}
      onLayout={event => setPlayerWidth(event.nativeEvent.layout.width)}>
      <Text style={[styles.heading, {color: theme.text}]}>오늘의 추천곡</Text>

      {/* 유튜브 규칙상 영상 화면이 보이는 플레이어로 재생한다. 재생은 플레이어 버튼을 눌러서 시작된다. */}
      {selected && playerWidth > 0 && (
        <View style={styles.player}>
          <YoutubePlayer
            width={playerWidth}
            height={Math.round((playerWidth * 9) / 16)}
            videoId={selected.videoId}
          />
          <Pressable
            onPress={() => openInYouTubeMusic(selected.videoId)}
            style={({pressed}) => [
              styles.ytMusicButton,
              {borderColor: theme.border},
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.ytMusicLabel, {color: theme.text}]}>
              유튜브 뮤직에서 듣기
            </Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.gallery}>
        {tracks.map(track => (
          <AlbumCard
            key={track.videoId}
            track={track}
            selected={track.videoId === selectedId}
            onPress={() => setSelectedId(track.videoId)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    rowGap: 10,
  },
  heading: {
    fontSize: 14,
    fontWeight: '700',
  },
  player: {
    borderRadius: 14,
    overflow: 'hidden',
    rowGap: 8,
  },
  ytMusicButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ytMusicLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  gallery: {
    gap: 12,
    paddingRight: 4,
  },
  albumCard: {
    width: ART_SIZE,
  },
  art: {
    ...shadows.raised,
    borderColor: 'transparent',
    borderRadius: 16,
    borderWidth: ART_BORDER,
    height: ART_SIZE,
    overflow: 'hidden',
    width: ART_SIZE,
  },
  artImage: {
    height: ART_IMAGE_HEIGHT,
    left: -(ART_IMAGE_WIDTH - ART_INNER) / 2,
    position: 'absolute',
    top: -(ART_IMAGE_HEIGHT - ART_INNER) / 2,
    width: ART_IMAGE_WIDTH,
  },
  playBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 14,
    bottom: 8,
    height: 28,
    justifyContent: 'center',
    paddingLeft: 2,
    position: 'absolute',
    right: 8,
    width: 28,
  },
  songTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  artist: {
    fontSize: 12,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.75,
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
