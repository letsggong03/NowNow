import {request} from './client';

export interface MusicTrack {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string | null;
}

// 고른 음악 취향(라벨)에 어울리는 오늘의 추천곡 목록. 같은 날이면 같은 목록이 온다.
export const getMusicRecommendations = async (choice: string) => {
  const res = await request<{message: string; data: MusicTrack[]}>(
    'GET',
    '/api/music/recommendation',
    {query: {choice}},
  );
  return res.data;
};
