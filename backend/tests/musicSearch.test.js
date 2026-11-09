const test = require("node:test");
const assert = require("node:assert/strict");

const {
  decodeHtml,
  parseMusicChoice,
  pickDailyTracks,
  toSongInfo,
  toTracks
} = require("../utils/musicSearch");

test("음악 선택지 → 검색어", () => {
  assert.deepEqual(parseMusicChoice(" 로파이 플레이리스트 "), {
    choice: "로파이 플레이리스트",
    query: "lofi hip hop beats"
  });
  // 정해 두지 않은 선택지는 라벨로 검색한다
  assert.deepEqual(parseMusicChoice("트로트"), { choice: "트로트", query: "트로트 노래" });

  assert.ok(parseMusicChoice("").error);
  assert.ok(parseMusicChoice(undefined).error);
  assert.ok(parseMusicChoice(["재즈"]).error);
  assert.ok(parseMusicChoice("가".repeat(51)).error);
});

test("유튜브 제목의 HTML 엔티티를 푼다", () => {
  assert.equal(decodeHtml("Don&#39;t &amp; &quot;Stop&quot; &#x2764;"), "Don't & \"Stop\" ❤");
  assert.equal(decodeHtml(undefined), "");
});

test("유튜브 제목·채널 → 곡명·아티스트", () => {
  // "가수 - 곡명" 형식은 나누고 (Official MV) 같은 꼬리표는 뺀다
  assert.deepEqual(toSongInfo("IU(아이유) - Good Day (Official MV)", "1theK"), {
    title: "Good Day",
    artist: "IU(아이유)"
  });
  // 괄호 태그·이모지·"|" 뒷부분을 빼고, 나눌 수 없으면 채널을 아티스트로
  assert.deepEqual(
    toSongInfo("[중간광고없음] 🍂☀️ 가을이 시작되는 날 | 힐링 피아노 | BGM", "Riae & Piano"),
    { title: "가을이 시작되는 날", artist: "Riae & Piano" }
  );
  // 자동 생성 "- Topic" 채널은 이름만 남긴다
  assert.deepEqual(toSongInfo("밤편지", "아이유 - Topic"), { title: "밤편지", artist: "아이유" });
  // 다 지워지면 원래 제목을 쓴다
  assert.deepEqual(toSongInfo("[MV]", "채널"), { title: "[MV]", artist: "채널" });
});

test("검색 결과를 곡 목록으로 정리한다", () => {
  const tracks = toTracks([
    {
      id: { kind: "youtube#video", videoId: "abc123" },
      snippet: {
        title: "IU - &#39;Good Day&#39;",
        channelTitle: "1theK",
        thumbnails: { default: { url: "d.jpg" }, high: { url: "h.jpg" } }
      }
    },
    // 영상이 아닌 결과(채널 등)는 버린다
    { id: { kind: "youtube#channel", channelId: "x" }, snippet: { title: "채널" } },
    null
  ]);

  assert.deepEqual(tracks, [
    { videoId: "abc123", title: "'Good Day'", artist: "IU", thumbnail: "h.jpg" }
  ]);
  assert.deepEqual(toTracks(undefined), []);
});

test("공식 음원이 3곡 이상이면 공식 음원만, 아니면 전부 쓴다", () => {
  const video = (videoId, channelTitle, description = "") => ({
    id: { videoId },
    snippet: { title: videoId, channelTitle, description, thumbnails: {} }
  });
  const ids = items => toTracks(items).map(track => track.videoId);

  const mixed = [
    video("compilation", "음악 모음 채널", "명곡 모음입니다"),
    video("t1", "아이유 - Topic"),
    video("t2", "가수", "Provided to YouTube by Kakao Entertainment"),
    video("t3", "밴드 - Topic")
  ];
  assert.deepEqual(ids(mixed), ["t1", "t2", "t3"]);

  // 공식 음원이 부족하면 모음 영상도 남긴다
  assert.deepEqual(ids(mixed.slice(0, 2)), ["compilation", "t1"]);
});

test("오늘의 추천곡 목록은 같은 날 같은 선택지면 같고, 날짜가 바뀌면 첫 곡이 달라진다", () => {
  const tracks = ["a", "b", "c", "d", "e", "f", "g"].map(videoId => ({ videoId }));
  const ids = date => pickDailyTracks(tracks, date, "재즈", 4).map(track => track.videoId);

  assert.deepEqual(ids("2026-11-04"), ids("2026-11-04"));
  assert.equal(ids("2026-11-04").length, 4);
  assert.equal(new Set(ids("2026-11-04")).size, 4, "같은 곡이 두 번 나오면 안 된다");

  const firsts = new Set(
    ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"].map(
      date => ids(date)[0]
    )
  );
  assert.ok(firsts.size > 1);

  assert.deepEqual(pickDailyTracks([], "2026-11-04", "재즈", 4), []);
  assert.equal(pickDailyTracks(tracks.slice(0, 2), "2026-11-04", "재즈", 4).length, 2);
});
