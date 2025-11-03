const e = React.createElement;

function Popup() {
  const [info, setInfo] = React.useState(null);
  const [aiData, setAiData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [buyerScore, setBuyerScore] = React.useState(null);
  const [dashboard, setDashboard] = React.useState({ totalSaved: 0, smartBuys: 0 });

  // 1️⃣ Load product data
  React.useEffect(() => {
    chrome.storage.local.get(["productInfo", "userPreferences", "dashboard"], (data) => {
      if (data.productInfo) setInfo(data.productInfo);
      if (data.dashboard) setDashboard(data.dashboard);
      setLoading(false);
    });
  }, []);

  // 2️⃣ Run AI modules
  React.useEffect(() => {
    let mounted = true;

    async function runAI() {
      if (!info) return;
      setLoading(true);

      // Price Prediction
      async function predictPrice(productId, currentPrice) {
        // Dummy logic for now: ±2.5%
        const nextPrice = currentPrice * (1 + (Math.random() - 0.5) / 20);
        const recommendation = nextPrice > currentPrice ? "Buy this" : nextPrice < currentPrice ? "Search more" : "Hold / Monitor";
        return { nextPrice: nextPrice.toFixed(2), recommendation };
      }

      // Review Analysis
      async function analyzeReviews(reviews) {
        if (!reviews || reviews.length === 0) return { sentiment: "N/A", trustScore: 50 };
        const positive = reviews.filter(r => /good|excellent|love|awesome/i.test(r)).length;
        const negative = reviews.filter(r => /bad|poor|worst|terrible/i.test(r)).length;
        const sentiment = positive >= negative ? "Positive" : "Negative";
        const uniqueReviews = new Set(reviews);
        const repetitionFactor = (reviews.length - uniqueReviews.size) / reviews.length;
        let trustScore = 50 + (positive - negative) * 10 - repetitionFactor * 20;
        trustScore = Math.min(100, Math.max(0, Math.round(trustScore)));
        return { sentiment, trustScore };
      }

      // Image Analysis
      async function analyzeImage(imageUrl) {
        if (!imageUrl) return { qualityScore: 50, stockFlag: false };
        try {
          const res = await fetch(imageUrl, { mode: "cors" });
          const blob = await res.blob();
          const bitmap = await createImageBitmap(blob);
          const canvas = document.createElement("canvas");
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(bitmap, 0, 0);
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let sum = 0;
          for (let i = 0; i < data.length; i += 4) sum += data[i];
          let qualityScore = Math.min(100, Math.max(0, Math.round(sum / (data.length / 4))));
          return { qualityScore, stockFlag: false };
        } catch {
          return { qualityScore: 50, stockFlag: false };
        }
      }

      // Competitor
      async function fetchCompetitor(productTitle, currentSite, currentPrice) {
        const competitorSite = currentSite.toLowerCase().includes("amazon") ? "Flipkart" : "Amazon";
        const competitorPrice = currentPrice + (competitorSite === "Flipkart" ? 50 : 100);
        return { site: competitorSite, price: competitorPrice, url: "#" };
      }

      const [pricePrediction, reviewAnalysis, imageAnalysis, competitorData] = await Promise.all([
        predictPrice(info.productId || info.title, parseFloat(info.price || 0)),
        analyzeReviews(info.reviews),
        analyzeImage(info.image),
        fetchCompetitor(info.title, info.site, parseFloat(info.price || 0))
      ]);

      if (mounted) {
        setAiData({ pricePrediction, reviewAnalysis, imageAnalysis, competitorData });

        // Compute Personalized Buyer Score
        chrome.storage.local.get("userPreferences", ({ userPreferences }) => {
          if (userPreferences) {
            const score = Math.min(100, Math.round(
              50 +
              ((parseFloat(info.price) >= userPreferences.budget.min && parseFloat(info.price) <= userPreferences.budget.max) ? 20 : 0) +
              ((userPreferences.brands.includes(info.brand)) ? 10 : 0) +
              pricePrediction.recommendation === "Buy this" ? 20 : 0 +
              reviewAnalysis.trustScore / 10
            ));
            setBuyerScore(score);
          }
        });

        setLoading(false);
      }
    }

    runAI();
    return () => { mounted = false };
  }, [info]);

  // Render
  if (!info) return e("p", { className: "p-2" }, "No product data found.");
  return e("div", { className: "font-sans text-sm text-gray-800 p-2 w-80" }, [
    e("h1", { className: "text-lg font-semibold mb-2 text-indigo-600" }, `🛒 ${info.site} Product Info`),
    e("p", { className: "font-medium" }, `Title: ${info.title || "N/A"}`),
    e("p", { className: "text-green-600 mb-2" }, `Price: ₹${info.price || "N/A"}`),
    info.image ? e("img", { src: info.image, className: "w-full my-2 rounded border" }) : null,
    e("p", { className: "text-gray-600 mb-2" }, `Description: ${info.description || "N/A"}`),
    e("div", { className: "text-gray-700 my-2" }, [
      e("strong", null, "Reviews:"),
      e("ul", null, (info.reviews || []).slice(0, 5).map((r, idx) => e("li", { key: idx }, r)))
    ]),
    loading ? e("p", { className: "text-blue-600" }, "🔄 AI Insights loading...") : null,
    aiData ? e("div", { className: "mt-2 p-2 border rounded bg-gray-50" }, [
      e("p", null, `💰 Buy/Wait: ${aiData.pricePrediction.recommendation} (Next Price: ₹${aiData.pricePrediction.nextPrice})`),
      e("p", null, `📝 Sentiment: ${aiData.reviewAnalysis.sentiment}, Trust Score: ${aiData.reviewAnalysis.trustScore}`),
      e("p", null, `📷 Image Quality: ${aiData.imageAnalysis.qualityScore}, Stock Image: ${aiData.imageAnalysis.stockFlag ? "Yes" : "No"}`),
      e("p", null, `🏷️ Competitor: ${aiData.competitorData.site} Price: ₹${aiData.competitorData.price || "N/A"}`)
    ]) : null,
    buyerScore !== null ? e("p", { className: "mt-2 font-semibold text-purple-600" }, `🧩 Buyer Score: ${buyerScore}/100`) : null,
    e("div", { className: "mt-2 border-t pt-2" }, [
      e("p", null, `💰 Total Saved: ₹${dashboard.totalSaved}`),
      e("p", null, `🏆 Smart Buys: ${dashboard.smartBuys}`)
    ])
  ]);
}

ReactDOM.render(e(Popup), document.getElementById("root"));
