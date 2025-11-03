// reviewAnalysis.js
async function analyzeReviews(reviews) {
  if (!reviews || reviews.length === 0) return { sentiment: "N/A", trustScore: 50 };

  // For demo, simple sentiment analysis
  let pos = 0, neg = 0;
  reviews.forEach(r => {
    if (r.includes("good") || r.includes("excellent") || r.includes("love")) pos++;
    if (r.includes("bad") || r.includes("poor") || r.includes("worst")) neg++;
  });

  const sentiment = pos >= neg ? "Positive" : "Negative";
  const trustScore = Math.min(100, Math.max(0, 50 + (pos - neg) * 10));

  return { sentiment, trustScore };
}
