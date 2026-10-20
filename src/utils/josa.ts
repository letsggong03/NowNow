type JosaPair = '이/가' | '을/를' | '은/는' | '과/와' | '으로/로';

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const RIEUL_FINAL = 8;

const getFinalConsonant = (word: string) => {
  const code = word.charCodeAt(word.length - 1);

  if (code < HANGUL_START || code > HANGUL_END) {
    return 0;
  }

  return (code - HANGUL_START) % 28;
};

// 단어의 받침에 맞는 조사를 붙인다. 예) withJosa('야근', '이/가') → '야근이'
export const withJosa = (word: string, pair: JosaPair) => {
  const [withFinal, withoutFinal] = pair.split('/');
  const finalConsonant = getFinalConsonant(word);
  const hasFinal =
    pair === '으로/로'
      ? finalConsonant !== 0 && finalConsonant !== RIEUL_FINAL
      : finalConsonant !== 0;

  return `${word}${hasFinal ? withFinal : withoutFinal}`;
};
