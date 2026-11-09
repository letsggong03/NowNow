// 음악 추천: 앱 선택지(라벨) → 유튜브 검색어, 검색 결과 정리, 오늘의 곡 고르기. 네트워크 없이 계산만 한다.

const MAX_CHOICE_LENGTH = 50;

// 한국어 장르 이름 그대로 검색하면 엉뚱한 영상이 섞여서 선택지마다 검색어를 정해 둔다.
// "명곡 모음" 같은 말을 넣으면 몇 시간짜리 모음 영상만 잡혀서, 곡 단위로 나올 만한 말을 쓴다.
// 앱 src/screens/Home/constants/preferenceOptions.ts의 music 라벨과 같아야 한다.
const MUSIC_QUERIES = {
  "잔잔한 어쿠스틱": "어쿠스틱 노래",
  "신나는 케이팝": "케이팝 댄스곡",
  "감성 발라드": "감성 발라드",
  "로파이 플레이리스트": "lofi hip hop beats",
  "재즈": "jazz standards",
  "락 밴드 음악": "한국 밴드 록",
  "클래식": "Chopin Nocturne",
  "빗소리 ASMR": "빗소리",
  "힙합": "한국 힙합",
  "인디 음악": "한국 인디 음악",
  "추억의 2000년대 노래": "2000년대 발라드",
  "애니메이션 OST": "애니메이션 OST",
  "EDM": "EDM",
  "피아노 연주곡": "피아노 연주곡 뉴에이지",
  "시티팝": "시티팝"
};

// 유튜브 뮤직에 올라간 공식 음원(앨범 자켓이 썸네일)은 설명이 이 말로 시작한다.
// 검색어에 붙이면 공식 음원이 위로 올라온다.
const OFFICIAL_AUDIO_HINT = '"Provided to YouTube by"';
const OFFICIAL_AUDIO_RE = /^Provided to YouTube by/i;
// 공식 음원이 이보다 적게 잡히면 일반 영상도 같이 쓴다.
const MIN_OFFICIAL_TRACKS = 3;

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

// 제목에서 빼는 것: [중간광고없음]·【MV】 같은 괄호, (Official Video)·(Lyrics) 같은 꼬리표, 이모지
const BRACKETS_RE = /\[[^\]]*\]|【[^】]*】|「[^」]*」/g;
const VIDEO_TAG_RE =
  /\((?:[^)]*\b(?:official|mv|m\/v|lyrics?|audio|video|visualizer|live|teaser|performance)\b[^)]*)\)/gi;
const EMOJI_RE = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;
const TOPIC_SUFFIX_RE = /\s*-\s*Topic$/i;

const tidy = text =>
  text.replace(/\s{2,}/g, " ").replace(/^[\s\-–|·:]+|[\s\-–|·:]+$/g, "").trim();

// 유튜브 제목·채널 → 곡명·아티스트
// "아이유 - 좋은 날 (Official MV)" → { title: "좋은 날", artist: "아이유" }
// 나눌 수 없으면 정리한 제목과 채널 이름을 쓴다.
function toSongInfo(rawTitle, rawChannel) {
  const channel = tidy(String(rawChannel ?? "").replace(TOPIC_SUFFIX_RE, ""));
  const cleaned = tidy(
    String(rawTitle ?? "")
      .replace(BRACKETS_RE, " ")
      .replace(VIDEO_TAG_RE, " ")
      .replace(EMOJI_RE, "")
      .split(/\s[|｜]\s/)[0]
  );

  const dash = cleaned.match(/^(.+?)\s[-–]\s(.+)$/);
  if (dash) {
    return { title: tidy(dash[2]), artist: tidy(dash[1]) };
  }

  return { title: cleaned || tidy(String(rawTitle ?? "")), artist: channel };
}

const isOfficialAudio = snippet =>
  OFFICIAL_AUDIO_RE.test(snippet.description ?? "") ||
  TOPIC_SUFFIX_RE.test(snippet.channelTitle ?? "");

// search.list 응답의 items → 앱에 줄 곡 목록. 영상이 아닌 결과는 버린다.
// 공식 음원이 충분하면 공식 음원만 쓴다(모음 영상·채널 홍보 영상 대신 실제 곡이 나오게).
function toTracks(items) {
  const videos = (Array.isArray(items) ? items : []).filter(
    item => item?.id?.videoId && item.snippet
  );
  const official = videos.filter(item => isOfficialAudio(item.snippet));

  return (official.length >= MIN_OFFICIAL_TRACKS ? official : videos)
    .map(({ id, snippet }) => {
      const thumbnails = snippet.thumbnails ?? {};
      const thumbnail = thumbnails.high ?? thumbnails.medium ?? thumbnails.default;
      const { title, artist } = toSongInfo(
        decodeHtml(snippet.title),
        decodeHtml(snippet.channelTitle)
      );

      return {
        videoId: id.videoId,
        title,
        artist,
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

// 오늘의 추천곡 목록: 검색 결과를 날짜별로 다른 곡부터 시작하게 돌려서 앞에서 count곡.
// 같은 날·같은 선택지면 같은 목록, 날짜가 바뀌면 첫 곡이 달라진다.
function pickDailyTracks(tracks, date, choice, count) {
  if (tracks.length === 0) return [];
  const start = hashSeed(`${date}:${choice}`) % tracks.length;
  return [...tracks.slice(start), ...tracks.slice(0, start)].slice(0, count);
}

module.exports = {
  MUSIC_QUERIES,
  OFFICIAL_AUDIO_HINT,
  parseMusicChoice,
  decodeHtml,
  toSongInfo,
  toTracks,
  pickDailyTracks
};
