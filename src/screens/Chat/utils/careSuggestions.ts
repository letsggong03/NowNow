import type {MessageButton} from '../types';
import type {Preferences} from '../../../services/personalization';
import {cinemaLinks} from '../../../constants/cinemaLinks';

type CareCard = {text: string; buttons?: MessageButton[]};
const youtube = (query: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
const search = (query: string) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;
const nearby = (menu: string): MessageButton => ({
  label: '근처에서 찾기', action: 'open_link',
  target: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`근처 ${menu} 맛집`)}`,
});
export const musicButtons = (query: string): MessageButton[] => [
    {label: '유튜브', action: 'open_link', target: youtube(query)},
    {label: '스포티파이', action: 'open_link', target: `https://open.spotify.com/search/${encodeURIComponent(query)}`},
    {label: '멜론', action: 'open_link', target: `https://www.melon.com/search/total/index.htm?q=${encodeURIComponent(query)}`},
];
const music = (query: string): CareCard => ({
  text: `${query} 들어볼래? 뿡뿡이는 여기서 기다릴게 🎧`,
  buttons: musicButtons(query),
});

function seasonalMeal(month: number) {
  if (month >= 3 && month <= 5) return '냉이 된장국';
  if (month >= 6 && month <= 8) return '초당옥수수';
  if (month >= 9 && month <= 11) return '구운 고구마';
  return '따뜻한 굴국밥';
}

const meal = (menu: string): CareCard => ({
  text: `${menu} 어때? 어디서 먹을지 같이 찾아보자 🍽️`,
  buttons: [
    nearby(menu),
    {label: '배달로 찾기', action: 'food_delivery'},
    {label: '다른 메뉴', action: 'food_more'},
  ],
});

export const petCard = (dog = false): CareCard => ({
  text: dog ? 'U・ᴥ・U  멍! 오늘도 네 편이야 🐾' : 'ฅ(˶ᵔ ᵕ ᵔ˶)ฅ  야옹! 잠깐 쉬어가도 괜찮아 🐾',
  buttons: [{label: dog ? '강아지 사진 보기' : '고양이 사진 보기', action: 'open_link',
    target: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(dog ? '귀여운 강아지' : '귀여운 고양이')}`}],
});

export function stressCare(): CareCard {
  return {
    text: '잠깐 쉬어갈까? 따뜻한 케모마일 차가 당기면 한 잔 곁들여도 좋아. 귀여운 고양이도 보여줄까?',
    buttons: [{label: '고양이 보여줘', action: 'pet_cat'}, {label: '잔잔한 음악', action: 'music_calm'}],
  };
}

export function healthCare(suggestion?: string): CareCard | null {
  if (suggestion === 'stress') return stressCare();
  if (suggestion === 'sleep') return music('잠들기 전 잔잔한 장작불 소리');
  if (suggestion === 'steps') return {text: '가볍게 걸을 곳이 필요하면 같이 찾아볼까?', buttons: [
    {label: '근처 산책로', action: 'open_link', target: 'https://www.google.com/maps/search/?api=1&query=%EA%B7%BC%EC%B2%98%20%EC%82%B0%EC%B1%85%EB%A1%9C'},
  ]};
  if (suggestion === 'blood_pressure') return {text: '평소 혈압 관리에 도움이 되는 식사 팁도 볼래?', buttons: [
    {label: '덜 짜게 먹는 팁', action: 'open_link', target: 'https://www.nhlbi.nih.gov/health/dash/living-with-dash'},
  ]};
  return null;
}

export function careForMessage(message: string, preferences?: Preferences): CareCard | null {
  if (/고양이.*(보여|사진)|냥이.*보여/.test(message)) return petCard();
  if (/강아지.*(보여|사진)|댕댕이.*보여/.test(message)) return petCard(true);
  if (/배\s*고파|배가\s*고파|뭐\s*(먹지|먹을까)|맛집|음식\s*추천|제철\s*(음식|메뉴)|유행\s*(음식|메뉴)|인기\s*메뉴|족발|보쌈|치킨|피자|칼국수/.test(message)) {
    if (/유행|인기/.test(message)) return careForButton('food_trending');
    if (/제철/.test(message)) return careForButton('food_seasonal');
    const mealPreference = preferences?.nownow_preferred_food;
    const skip = /말고|빼고|싫|다른|면.*안|밥.*먹고/.test(message);
    const requestedMeal = !skip && message.match(/족발|보쌈|치킨|피자|칼국수/)?.[0];
    if (requestedMeal) return meal(requestedMeal);
    return meal(/밥.*먹고/.test(message) ? '든든한 비빔밥'
      : mealPreference && !skip ? mealPreference : seasonalMeal(new Date().getMonth() + 1));
  }
  if (/백색\s*소음|공부|집중/.test(message)) return music('공부할 때 백색소음');
  if (/장작불|잠들기\s*전|잠을\s*설쳤|잠이\s*안\s*와|수면\s*부족|잘\s*때/.test(message)) return music('잠들기 전 잔잔한 장작불 소리');
  if (/음악|노래|플레이리스트/.test(message)) {
    const mood = /신나는|신나게/.test(message) ? '신나는' : /잔잔|편안/.test(message) ? '잔잔한' : '기분이 좋아지는';
    const named = message.match(/[「『“"]([^」』”"]{1,80})[」』”"]/)?.[1];
    if (named) return music(named);
    const track = mood === '신나는' ? 'DAY6 - 한 페이지가 될 수 있게'
      : mood === '잔잔한' ? '아이유 - 밤편지' : '볼빨간사춘기 - 여행';
    return music(/플레이리스트|재즈/.test(message)
      ? `${mood} ${/재즈/.test(message) && !/말고|빼고/.test(message) ? '재즈' : '음악'} 플레이리스트`
      : track);
  }
  if (/스트레칭|뻐근/.test(message)) return {
    text: '앉은 자리에서 어깨를 천천히 올렸다 내리며 쉬어볼까?',
    buttons: [{label: '가벼운 스트레칭 영상 찾기', action: 'open_link', target: youtube('의자에 앉아서 가벼운 어깨 스트레칭')}],
  };
  if (/영화|개봉작/.test(message)) return {
    text: '영화 한 편 어때? 지금 상영 중인 작품을 같이 골라보자 🎬',
    buttons: cinemaLinks.map(({label, url}) => ({label, action: 'open_link', target: url})),
  };
  if (/기분 전환/.test(message)) return stressCare();
  return null;
}

export function careForButton(action: string): CareCard | null {
  switch (action) {
    case 'pet_cat': return petCard();
    case 'music_calm': return music('잔잔한 기분 전환 음악');
    case 'food_delivery': return {text: '좋아! 어느 배달 앱을 열어줄까?', buttons: [
      {label: '배민 열기', action: 'open_delivery', target: 'baemin'},
      {label: '쿠팡이츠 열기', action: 'open_delivery', target: 'coupangEats'},
    ]};
    case 'food_more': return {text: '제철 먹거리랑 요즘 화제인 메뉴 중에 뭐가 끌려?', buttons: [
      {label: '제철 메뉴', action: 'food_seasonal'}, {label: '요즘 인기 메뉴', action: 'food_trending'},
    ]};
    case 'food_seasonal': return meal(seasonalMeal(new Date().getMonth() + 1));
    case 'food_trending': return {text: '요즘 자주 보이는 메뉴를 같이 찾아볼까?', buttons: [
      {label: '이번 달 인기 메뉴 찾아보기', action: 'open_link',
        target: search(`${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월 한국 유행 음식 인기 메뉴`)},
    ]};
    default: return null;
  }
}
