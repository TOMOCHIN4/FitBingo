// OKUNOSAMPEIさんのトレーニング動画リスト
export const trainingVideos = [
  {
    id: 1,
    title: "OKUNOSAMPEIトレーニング動画1",
    videoId: "hGjl9voD0hg", // https://youtu.be/hGjl9voD0hg
    duration: "未設定",
    category: "トレーニング"
  },
  {
    id: 2,
    title: "OKUNOSAMPEIトレーニング動画2",
    videoId: "tmY9AO3SFKQ", // https://youtu.be/tmY9AO3SFKQ
    duration: "未設定",
    category: "トレーニング"
  },
  {
    id: 3,
    title: "OKUNOSAMPEIトレーニング動画3",
    videoId: "a0xpRe0hdmc", // https://youtu.be/a0xpRe0hdmc
    duration: "未設定",
    category: "トレーニング"
  }
];

// ランダムな動画を取得
export const getRandomVideo = () => {
  const randomIndex = Math.floor(Math.random() * trainingVideos.length);
  return trainingVideos[randomIndex];
};

// カテゴリー別にランダムな動画を取得
export const getRandomVideoByCategory = (category) => {
  const categoryVideos = trainingVideos.filter(video => video.category === category);
  if (categoryVideos.length === 0) return getRandomVideo();
  
  const randomIndex = Math.floor(Math.random() * categoryVideos.length);
  return categoryVideos[randomIndex];
};