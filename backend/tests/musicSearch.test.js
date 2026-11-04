const test = require("node:test");
const assert = require("node:assert/strict");

const {
  decodeHtml,
  parseMusicChoice,
  pickDailyTrack,
  toTracks
} = require("../utils/musicSearch");

test("음악 선택지 → 검색어", () => {
  assert.deepEqual(parseMusicChoice(" 로파이 플레이리스트 "), {
    choice: "로파이 플레이리스트",
    query: "lofi hip hop"
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

test("검색 결과를 곡 목록으로 정리한다", () => {
  const tracks = toTracks([
    {
      id: { kind: "youtube#video", videoId: "abc123" },
      snippet: {
        title: "IU &#39;Good Day&#39;",
        channelTitle: "1theK",
        thumbnails: { default: { url: "d.jpg" }, high: { url: "h.jpg" } }
      }
    },
    // 영상이 아닌 결과(채널 등)는 버린다
    { id: { kind: "youtube#channel", channelId: "x" }, snippet: { title: "채널" } },
    null
  ]);

  assert.deepEqual(tracks, [
    { videoId: "abc123", title: "IU 'Good Day'", channel: "1theK", thumbnail: "h.jpg" }
  ]);
  assert.deepEqual(toTracks(undefined), []);
});

test("오늘의 곡은 같은 날 같은 선택지면 같고, 결과가 없으면 null", () => {
  const tracks = ["a", "b", "c", "d", "e"].map(videoId => ({ videoId }));

  assert.equal(
    pickDailyTrack(tracks, "2026-11-04", "재즈"),
    pickDailyTrack(tracks, "2026-11-04", "재즈")
  );

  const picked = new Set(
    ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"].map(
      date => pickDailyTrack(tracks, date, "재즈").videoId
    )
  );
  assert.ok(picked.size > 1, "날짜가 바뀌면 다른 곡도 나와야 한다");

  assert.equal(pickDailyTrack([], "2026-11-04", "재즈"), null);
});
