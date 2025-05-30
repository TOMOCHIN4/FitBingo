// エクササイズデータ（ID順は固定）
export const exercises = [
  {
    id: 1,
    name: '膝付き腕立て伏せ',
    baseValue: 10,
    unit: '回'
  },
  {
    id: 2,
    name: '腹筋プランク',
    baseValue: 30,
    unit: '秒'
  },
  {
    id: 3,
    name: 'サイドプランク',
    baseValue: 20,
    unit: '秒'
  },
  {
    id: 4,
    name: 'スクワット',
    baseValue: 15,
    unit: '回'
  },
  {
    id: 5,
    name: 'ランジ',
    baseValue: 10,
    unit: '回'
  },
  {
    id: 6,
    name: 'リバースプランク',
    baseValue: 20,
    unit: '秒'
  },
  {
    id: 7,
    name: 'バードドッグ',
    baseValue: 30,
    unit: '秒'
  },
  {
    id: 8,
    name: 'ロシアンツイスト',
    baseValue: 20,
    unit: '回'
  },
  {
    id: 9,
    name: '壁倒立',
    baseValue: 30,
    unit: '秒'
  }
];

// レベルに応じた目標値を計算
export const calculateTargetValue = (baseValue, level) => {
  return Math.floor(baseValue * (1 + (level - 1) * 0.5));
};