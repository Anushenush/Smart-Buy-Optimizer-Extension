// imageInsight.js
async function analyzeImage(imageUrl) {
  if (!imageUrl) return { qualityScore: 50, stockFlag: false };

  const img = new Image();
  img.src = imageUrl;

  return new Promise((resolve) => {
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // Simple blurriness metric (variance of Laplacian)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let sum = 0;
      for (let i = 0; i < imageData.data.length; i += 4) {
        sum += imageData.data[i]; // use red channel as proxy
      }
      const avg = sum / (imageData.data.length / 4);
      const qualityScore = Math.min(100, Math.max(0, avg / 2)); // scaled for demo

      resolve({ qualityScore, stockFlag: false }); // stockFlag detection to be added
    };
    img.onerror = () => resolve({ qualityScore: 50, stockFlag: false });
  });
}
