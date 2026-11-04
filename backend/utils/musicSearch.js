// 음악 추천: 앱 선택지(라벨) → 유튜브 검색어, 검색 결과 정리, 오늘의 곡 고르기. 네트워크 없이 계산만 한다.

const MAX_CHOICE_LENGTH = 50;

// 한국어 장르 이름 그대로 검색하면 엉뚱한 영상이 섞여서 선택지마다 검색어를 정해 둔다.
// 앱 src/screens/Home/constants/preferenceOptions.ts의 music 라벨과 같아야 한다.
const MUSIC_QUERIES = {
  "잔잔한 어쿠스틱": "잔잔한 어쿠스틱 노래",
  "신나는 케이팝": "신나는 케이팝 MV",
  "감성 발라드": "감성 발라드 명곡",
  "로파이 플레이리스트": "lofi hip hop",
  "재즈": "jazz standards",
  "락 밴드 음악": "한국 밴드 노래",
  "클래식": "클래식 명곡",
  "빗소리 ASMR": "빗소리 ASMR",
  "힙합": "한국 힙합 노래",
  "인디 음악": "한국 인디 음악",
  "추억의 2000년대 노래": "2000년대 가요 명곡",
  "애니메이션 OST": "애니메이션 OST",
  "EDM": "EDM festival mix",
  "피아노 연주곡": "피아노 연주곡",
  "시티팝": "시티팝"
};

// 반환: { choice, query } 또는 { error }
function parseMusicChoice(value) {
  const choice = typeof value === "string" ? value.trim() : "";

  if (!choice || choice.length > MAX_CHOICE_LENGTH) {
    return { error: `choice는 1~${MAX_CHOICE_LENGTH}자여야 합니다.` };
  }

  return { choice, query: MUSIC_QUERIES[choice] ?? `${choice} 노래` };
}

// 유튜브 API는 제목을 HTML 엔티티로 준다("&#39;", "&amp;" 등).
function decodeHtml(text) {
  return String(text ?? "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

// search.list 응답의 items → 앱에 줄 곡 목록. 영상이 아닌 결과는 버린다.
function toTracks(items) {
  return (Array.isArray(items) ? items : [])
    .filter(item => item?.id?.videoId && item.snippet)
    .map(({ id, snippet }) => {
      const thumbnails = snippet.thumbnails ?? {};
      const thumbnail = thumbnails.high ?? thumbnails.medium ?? thumbnails.default;

      return {
        videoId: id.videoId,
        title: decodeHtml(snippet.title),
        channel: decodeHtml(snippet.channelTitle),
        thumbnail: thumbnail?.url ?? null
      };
    });
}

// 문자열 → 32비트 정수(FNV-1a)
function hashSeed(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// 같은 날·같은 선택지면 같은 곡, 날짜가 바뀌면 다른 곡
function pickDailyTrack(tracks, date, choice) {
  if (tracks.length === 0) return null;
  return tracks[hashSeed(`${date}:${choice}`) % tracks.length];
}

module.exports = {
  MUSIC_QUERIES,
  parseMusicChoice,
  decodeHtml,
  toTracks,
  pickDailyTrack
};
