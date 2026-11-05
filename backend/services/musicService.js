const { kstToday } = require("../utils/kstDate");
const { OFFICIAL_AUDIO_HINT, toTracks, pickDailyTracks } = require("../utils/musicSearch");

const SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const REQUEST_TIMEOUT_MS = 5000;

// 유튜브 검색은 하루 무료 한도(검색 약 100회)가 있어 오늘 고른 곡을 기억해 두고 재사용한다.
// 키: "날짜:선택지". 서버를 다시 켜면 비워진다.
const dailyCache = new Map();

class MusicError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function searchYouTube(query) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new MusicError(503, "음악 추천을 쓸 수 없어요. 서버에 YOUTUBE_API_KEY가 없습니다.");
  }

  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    videoCategoryId: "10", // 음악
    videoEmbeddable: "true", // 앱 안 플레이어로 재생할 수 있는 영상만
    regionCode: "KR",
    relevanceLanguage: "ko",
    // 공식 음원만 골라 쓰므로 넉넉히 받는다. 검색 비용(할당량)은 개수와 상관없이 같다.
    maxResults: "25",
    q: `${query} ${OFFICIAL_AUDIO_HINT}`,
    key: apiKey
  });

  const response = await fetch(`${SEARCH_URL}?${params}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    // 키를 로그에 남기지 않도록 유튜브가 준 메시지만 남긴다.
    console.log("[music] 유튜브 검색 실패:", response.status, body?.error?.message);
    throw new MusicError(502, "음악을 찾지 못했어요. 잠시 뒤에 다시 시도해 주세요.");
  }

  return toTracks(body?.items);
}

// 홈 갤러리에 보여 줄 곡 수
const TRACK_COUNT = 6;

// 오늘의 추천곡 목록. 찾은 곡이 없으면 빈 배열
async function getDailyTracks(choice, query) {
  const date = kstToday();
  const cacheKey = `${date}:${choice}`;

  if (dailyCache.has(cacheKey)) {
    return dailyCache.get(cacheKey);
  }

  const tracks = pickDailyTracks(await searchYouTube(query), date, choice, TRACK_COUNT);

  // 날짜가 바뀌면 어제 기록은 필요 없다.
  for (const key of dailyCache.keys()) {
    if (!key.startsWith(`${date}:`)) dailyCache.delete(key);
  }
  dailyCache.set(cacheKey, tracks);

  return tracks;
}

module.exports = {
  MusicError,
  getDailyTracks
};
