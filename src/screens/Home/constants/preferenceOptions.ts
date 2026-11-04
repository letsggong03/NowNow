import type {PreferenceKey, PreferenceOption} from '../types';

export const preferenceLabels: Record<PreferenceKey, string> = {
  feed: '먹이',
  play: '놀이',
  music: '음악',
  hobby: '휴식',
};

export const preferenceOptions: Record<PreferenceKey, PreferenceOption[]> = {
  feed: [
    {label: '매운 닭발', description: '강한 맛과 자극적인 음식'},
    {label: '달달한 초코 머핀', description: '달콤하고 포근한 디저트'},
    {label: '상큼한 과일', description: '가볍고 산뜻한 음식'},
    {label: '따뜻한 우동', description: '든든하고 편안한 국물 음식'},
    {label: '바삭한 감자튀김', description: '짭짤하고 익숙한 간식'},
    {label: '고소한 크림 파스타', description: '부드럽고 진한 음식'},
    {label: '엄마표 김치찌개', description: '익숙하고 따뜻한 집밥'},
    {label: '떡볶이와 순대', description: '맵고 달콤한 분식'},
    {label: '신선한 샐러드', description: '가볍고 건강한 한 끼'},
    {label: '바삭한 치킨', description: '기분 전환이 되는 야식'},
    {label: '뜨끈한 국밥', description: '속을 든든하게 채우는 음식'},
    {label: '연어 초밥', description: '깔끔하고 담백한 음식'},
    {label: '아이스크림', description: '시원하고 달콤한 디저트'},
    {label: '따뜻한 코코아', description: '마음을 데우는 음료'},
    {label: '고구마 맛탕', description: '은은하게 달콤한 간식'},
    {label: '불고기 덮밥', description: '달짝지근하고 든든한 한 그릇'},
    {label: '얼큰한 짬뽕', description: '땀이 날 만큼 시원하게 매운 국물'},
    {label: '짜장면', description: '익숙하고 달큰한 중식'},
    {label: '바삭한 탕수육', description: '새콤달콤한 튀김 요리'},
    {label: '치즈 듬뿍 피자', description: '쭉 늘어나는 고소한 음식'},
    {label: '육즙 가득 햄버거', description: '한 입 가득 푸짐한 음식'},
    {label: '보글보글 된장찌개', description: '구수하고 정겨운 집밥'},
    {label: '삼겹살 구이', description: '함께 구워 먹는 즐거운 음식'},
    {label: '시원한 냉면', description: '더위와 답답함을 날리는 음식'},
    {label: '김밥 한 줄', description: '간단하게 챙기는 한 끼'},
    {label: '라면', description: '언제 먹어도 맛있는 야식'},
    {label: '부드러운 계란말이', description: '포근하고 순한 반찬'},
    {label: '따끈한 호빵', description: '손까지 데워 주는 간식'},
    {label: '붕어빵', description: '추운 날 생각나는 길거리 간식'},
    {label: '바삭한 와플', description: '겉바속촉 달콤한 디저트'},
    {label: '폭신한 팬케이크', description: '느긋한 아침 같은 디저트'},
    {label: '딸기 생크림 케이크', description: '특별한 날 같은 디저트'},
    {label: '쫀득한 마카롱', description: '작고 화려한 디저트'},
    {label: '버터 크루아상', description: '바삭하고 고소한 빵'},
    {label: '팥빙수', description: '시원하고 달콤한 여름 디저트'},
    {label: '탕후루', description: '아삭하고 새콤달콤한 간식'},
    {label: '달콤한 꿀떡', description: '쫀득하고 귀여운 떡'},
    {label: '따뜻한 호떡', description: '꿀이 흐르는 겨울 간식'},
    {label: '고소한 군고구마', description: '소박하고 따뜻한 간식'},
    {label: '버터 팝콘', description: '영화 볼 때 생각나는 간식'},
    {label: '마라탕', description: '얼얼하게 매운 자극적인 음식'},
    {label: '쌀국수', description: '깔끔하고 따뜻한 국물'},
    {label: '향긋한 카레', description: '향신료가 은은한 음식'},
    {label: '바삭한 돈가스', description: '소스를 듬뿍 찍어 먹는 음식'},
    {label: '타코', description: '이국적이고 상큼한 음식'},
    {label: '전복죽', description: '속을 달래 주는 부드러운 음식'},
    {label: '해물 파전', description: '비 오는 날 생각나는 음식'},
    {label: '수박 한 조각', description: '시원하고 촉촉한 과일'},
    {label: '달콤한 바나나 우유', description: '어릴 적 생각나는 음료'},
    {label: '시원한 아이스 아메리카노', description: '정신이 번쩍 드는 음료'},
    {label: '돌솥 비빔밥', description: '여러 재료를 고루 섞은 한 그릇'},
    {label: '순두부찌개', description: '보들보들하고 칼칼한 찌개'},
    {label: '부대찌개', description: '푸짐하게 끓여 나눠 먹는 찌개'},
    {label: '갈비찜', description: '달큰하고 부드러운 잔치 음식'},
    {label: '제육볶음', description: '매콤달콤한 밥도둑'},
    {label: '춘천 닭갈비', description: '철판에 볶아 먹는 매콤한 음식'},
    {label: '감자탕', description: '뼈까지 뜯는 든든한 국물'},
    {label: '삼계탕', description: '기운을 북돋는 보양식'},
    {label: '바지락 칼국수', description: '시원하고 따뜻한 면 요리'},
    {label: '수제비', description: '쫄깃하고 투박한 국물 요리'},
    {label: '잔치국수', description: '맑고 담백한 국수'},
    {label: '비빔국수', description: '새콤달콤 매콤한 면 요리'},
    {label: '쫄면', description: '쫄깃하고 새콤한 분식'},
    {label: '김치볶음밥', description: '간단하지만 맛있는 한 그릇'},
    {label: '오므라이스', description: '폭신한 계란에 싸인 밥'},
    {label: '소고기 미역국', description: '생일처럼 따뜻한 국'},
    {label: '갈비탕', description: '맑고 깊은 맛의 국물'},
    {label: '육개장', description: '얼큰하고 진한 국물'},
    {label: '곱창구이', description: '고소하고 쫄깃한 별미'},
    {label: '족발', description: '쫀득하고 푸짐한 야식'},
    {label: '보쌈', description: '쌈 싸 먹는 담백한 고기'},
    {label: '안동 찜닭', description: '짭조름하고 달큰한 찜 요리'},
    {label: '닭볶음탕', description: '매콤하게 졸인 닭 요리'},
    {label: '콩나물국밥', description: '속을 시원하게 풀어 주는 국밥'},
    {label: '떡국', description: '새해처럼 새 마음이 되는 음식'},
    {label: '만둣국', description: '속이 꽉 찬 따뜻한 국'},
    {label: '고등어구이', description: '노릇노릇 고소한 생선 반찬'},
    {label: '모둠회', description: '싱싱하고 깔끔한 음식'},
    {label: '장어덮밥', description: '기운이 나는 달큰한 덮밥'},
    {label: '규동', description: '간장 소스에 졸인 소고기 덮밥'},
    {label: '진한 라멘', description: '깊고 진한 국물의 일본식 면'},
    {label: '텐동', description: '바삭한 튀김을 올린 덮밥'},
    {label: '냉모밀', description: '시원하고 깔끔한 면 요리'},
    {label: '마파두부', description: '얼얼하고 매콤한 두부 요리'},
    {label: '양꼬치', description: '쯔란 향이 나는 꼬치구이'},
    {label: '딤섬', description: '한 입씩 골라 먹는 만두'},
    {label: '팟타이', description: '새콤달콤한 태국식 볶음면'},
    {label: '똠양꿍', description: '맵고 시고 향긋한 국물'},
    {label: '분짜', description: '숯불 고기와 함께 먹는 쌀국수'},
    {label: '반미 샌드위치', description: '바삭한 빵에 채소 가득한 샌드위치'},
    {label: '두툼한 스테이크', description: '특별한 날 먹는 고기 요리'},
    {label: '버섯 리조또', description: '크리미하고 고소한 쌀 요리'},
    {label: '알리오 올리오', description: '마늘 향이 가득한 담백한 파스타'},
    {label: '라자냐', description: '치즈와 소스를 겹겹이 쌓은 요리'},
    {label: '감바스', description: '올리브유에 익힌 새우 요리'},
    {label: '클럽 샌드위치', description: '든든하게 챙기는 브런치'},
    {label: '부리토', description: '한 손에 들고 먹는 푸짐한 음식'},
    {label: '포케', description: '신선한 재료를 담은 건강한 한 그릇'},
    {label: '샤브샤브', description: '살짝 데쳐 먹는 담백한 음식'},
    {label: '훠궈', description: '얼얼한 국물에 이것저것 넣어 먹는 음식'},
  ],
  play: [
    {label: '노래 부르기', description: '표현이 많은 활동'},
    {label: '같이 수다 떨기', description: '대화를 나누는 정적인 활동'},
    {label: '넷플릭스 보기', description: '편하게 같이 보는 활동'},
    {label: '보드게임 하기', description: '생각하며 즐기는 놀이'},
    {label: '산책하기', description: '몸을 가볍게 움직이는 활동'},
    {label: '레고 조립하기', description: '손재주가 필요한 활동'},
    {label: '춤추기', description: '몸으로 에너지를 푸는 활동'},
    {label: '퍼즐 맞추기', description: '차분하게 집중하는 놀이'},
    {label: '비눗방울 불기', description: '가볍고 동심 가득한 놀이'},
    {label: '숨바꼭질', description: '두근두근 설레는 놀이'},
    {label: '공놀이', description: '활발하게 뛰노는 활동'},
    {label: '사진 찍기', description: '순간을 기록하는 활동'},
    {label: '종이접기', description: '손끝으로 만드는 놀이'},
    {label: '게임 한 판', description: '승부욕을 자극하는 놀이'},
    {label: '베개 싸움', description: '웃음이 터지는 신나는 놀이'},
  ],
  music: [
    {label: '잔잔한 어쿠스틱', description: '차분하고 따뜻한 음악'},
    {label: '신나는 케이팝', description: '에너지를 올리는 음악'},
    {label: '감성 발라드', description: '감정을 천천히 꺼내는 음악'},
    {label: '로파이 플레이리스트', description: '집중하기 좋은 음악'},
    {label: '재즈', description: '느긋하고 분위기 있는 음악'},
    {label: '락 밴드 음악', description: '강한 에너지가 있는 음악'},
    {label: '클래식', description: '마음을 가라앉히는 음악'},
    {label: '빗소리 ASMR', description: '자연의 소리로 쉬는 시간'},
    {label: '힙합', description: '리듬에 몸을 맡기는 음악'},
    {label: '인디 음악', description: '담백하고 솔직한 음악'},
    {label: '추억의 2000년대 노래', description: '그때 그 시절이 떠오르는 음악'},
    {label: '애니메이션 OST', description: '설렘이 있는 음악'},
    {label: 'EDM', description: '심장이 뛰는 빠른 음악'},
    {label: '피아노 연주곡', description: '가사 없이 편안한 음악'},
    {label: '시티팝', description: '청량하고 세련된 음악'},
  ],
  hobby: [
    {label: '침대에서 뒹굴기', description: '아무것도 안 하는 휴식'},
    {label: '영화 보기', description: '몰입하며 쉬는 시간'},
    {label: '그림 그리기', description: '손으로 감정을 풀어내는 휴식'},
    {label: '반신욕 하기', description: '몸의 긴장을 푸는 휴식'},
    {label: '일기 쓰기', description: '생각을 정리하는 휴식'},
    {label: '조용히 낮잠 자기', description: '회복에 집중하는 휴식'},
    {label: '책 읽기', description: '다른 세계로 떠나는 휴식'},
    {label: '스트레칭', description: '몸을 부드럽게 푸는 휴식'},
    {label: '명상하기', description: '호흡에 집중하는 휴식'},
    {label: '식물 돌보기', description: '작은 생명을 챙기는 휴식'},
    {label: '향초 켜기', description: '향기로 분위기를 바꾸는 휴식'},
    {label: '창밖 바라보기', description: '멍하니 생각을 비우는 휴식'},
    {label: '뜨개질하기', description: '손을 움직이며 차분해지는 휴식'},
    {label: '따뜻한 차 마시기', description: '천천히 숨 돌리는 휴식'},
    {label: '방 정리하기', description: '주변을 정돈하며 개운해지는 휴식'},
  ],
};

/* eslint-disable no-bitwise -- 시드 해시·난수 생성은 32비트 정수 연산이 필요하다 */
// 문자열을 32비트 정수 시드로 바꾼다(FNV-1a).
const hashSeed = (text: string) => {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

// 같은 시드면 항상 같은 순서의 0~1 난수를 내는 생성기(mulberry32).
const seededRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};
/* eslint-enable no-bitwise */

// 폰 시간 기준 "YYYY-MM-DD"
const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

// 오늘의 선택지. 같은 날·같은 종류면 몇 번을 열어도 같고, 날짜가 바뀌면 달라진다.
export const pickDailyOptions = (
  action: PreferenceKey,
  date = new Date(),
  count = 3,
): PreferenceOption[] => {
  const random = seededRandom(hashSeed(`${toDateKey(date)}:${action}`));
  const shuffled = [...preferenceOptions[action]];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled.slice(0, count);
};
