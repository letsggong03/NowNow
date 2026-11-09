const causes = [
  ['부장/팀장', /부장|팀장|상사/],
  ['업무 스트레스', /업무|직장|회사|마감|일이\s*많|일\s*때문/],
  ['야근', /야근|늦게\s*퇴근/],
  ['학업', /시험|과제|공부|학업|성적|발표|작품|졸작|캡스톤/],
  ['인간관계', /갈등|싸웠|다퉜|친구|가족|연인|대인관계/],
  ['경제', /돈|생활비|월세|경제|카드값/],
  ['건강', /몸이\s*아|수면\s*부족|잠을\s*못/],
  ['미래', /취업|진로|미래|진학/],
] as const;

export function analyzeStory(story: string[]) {
  const fullStory = story.join(' ');
  const keywords: string[] = causes.filter(([, pattern]) => pattern.test(fullStory)).map(([label]) => label);
  const details = story.filter(line => !/^(응|웅|몰라|모르겠어)[.!]?$/.test(line)).slice(-3);
  const summary = details.length
    ? `오늘 들려준 이야기\n${details.map(line => `• ${line.slice(0, 180)}`).join('\n')}`
    : '오늘은 마음을 가볍게 돌아봤어.';
  return {summary, keywords};
}
