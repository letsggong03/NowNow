import {request} from './client';

export interface MusicTrack {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string | null;
}

// 고른 음악 취향(라벨)에 어울리는 오늘의 곡. 같은 날이면 같은 곡이 온다.
export const getMusicRecommendation = async (choice: string) => {
  const res = await request<{message: string; data: MusicTrack}>(
    'GET',
    '/api/music/recommendation',
    {query: {choice}},
  );
  return res.data;
};
