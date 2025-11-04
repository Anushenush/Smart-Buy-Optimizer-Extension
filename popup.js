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
 if (!info)
  return e(
    "p",
    {
      style: {
        padding: "10px",
        textAlign: "center",
        color: "#9333ea",
        background: "linear-gradient(145deg,#f3e8ff,#ede9fe)",
        borderRadius: "12px",
        fontFamily: "Segoe UI, sans-serif",
        fontWeight: "500",
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)",
        animation: "fadeIn 0.8s ease"
      }
    },
    "⚠️ No product data found."
  );

return e(
  "div",
  {
    style: {
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "14px",
      color: "#1f2937",
      padding: "16px",
      width: "340px",
      borderRadius: "18px",
      background: "rgba(255,255,255,0.75)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(147,51,234,0.2)",
      boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
      transform: "translateY(0)",
      transition: "all 0.3s ease",
      animation: "slideUp 0.6s ease-out"
    },
    onMouseOver: (e) => (e.currentTarget.style.transform = "translateY(-4px)"),
    onMouseOut: (e) => (e.currentTarget.style.transform = "translateY(0)")
  },
  [
    // Header
    e(
      "h1",
      {
        style: {
          fontSize: "18px",
          fontWeight: "600",
          marginBottom: "10px",
          color: "#7e22ce",
          borderBottom: "1px solid #e9d5ff",
          paddingBottom: "6px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          animation: "fadeIn 0.6s ease"
        }
      },
      `🛒 ${info.site} Product Info`
    ),

    // Title
    e(
      "p",
      {
        style: {
          fontWeight: "600",
          color: "#581c87",
          marginBottom: "6px",
          letterSpacing: "0.2px",
          animation: "fadeIn 0.8s ease"
        }
      },
      `📦 ${info.title || "No Title"}`
    ),

    // Price
    e(
      "div",
      {
        style: {
          color: "#15803d",
          fontWeight: "700",
          fontSize: "15px",
          background: "linear-gradient(90deg,#ecfdf5,#d1fae5)",
          padding: "6px 10px",
          borderRadius: "10px",
          marginBottom: "10px",
          display: "inline-block",
          animation: "fadeIn 0.9s ease"
        }
      },
      `💲 ₹${info.price || "N/A"}`
    ),

    // Image
    info.image
      ? e("img", {
          src: info.image,
          className: "glow-card glow-image",
          style: {
            width: "100%",
            margin: "10px 0",
            borderRadius: "14px",
            border: "2px solid #e9d5ff",
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            transition: "transform 0.4s ease, box-shadow 0.4s ease",
            cursor: "pointer",
            animation: "fadeIn 1s ease"
          },
          onMouseOver: (e) => {
            e.target.style.transform = "scale(1.04)";
            e.target.style.boxShadow = "0 6px 16px rgba(147,51,234,0.3)";
          },
          onMouseOut: (e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)";
          }
        })
      : null,

    // Description (Structured)
    (() => {
      const desc = info.description || "N/A";
      const points =
        desc.length > 80
          ? desc
              .split(/[\.\,\-\;\•\n]/)
              .map((s) => s.trim())
              .filter((s) => s.length > 2)
          : null;

      return e(
        
        "div", 
        {
          className: "glow-card glow-description",
          style: {
            marginBottom: "12px",
            backgroundColor: "rgba(250,245,255,0.9)",
            padding: "10px",
            borderRadius: "12px",
            border: "1px solid #e9d5ff",
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            animation: "fadeIn 1.1s ease"
          }
        },
        [
          e(
            "p",
            {
              style: {
                fontWeight: "600",
                color: "#7e22ce",
                marginBottom: "6px"
              }
            },
            "📝 Description"
          ),
          points
            ? e(
                "ul",
                {
                  style: {
                    paddingLeft: "20px",
                    color: "#4b5563",
                    lineHeight: "1.5",
                    listStyleType: "disc"
                  }
                },
                points.map((p, i) =>
                  e(
                    "li",
                    {
                      key: i,
                      style: {
                        marginBottom: "3px",
                        fontSize: "13px"
                      }
                    },
                    p
                  )
                )
              )
            : e(
                "p",
                { style: { color: "#4b5563", fontSize: "13px" } },
                desc
              )
        ]
      );
    })(),

    // Reviews (show all)
    e(
      "div",
      {
        className: "glow-card glow-reviews",
        style: {
          color: "#4b5563",
          margin: "10px 0",
          animation: "fadeIn 1.3s ease"
        }
      },
      [
        e(
          "strong",
          {
            style: {
              color: "#7e22ce",
              display: "block",
              marginBottom: "6px"
            }
          },
          "⭐ Reviews"
        ),
        e(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "6px"
            }
          },
          (info.reviews || []).map((r, idx) =>
            e(
              "div",
              {
                key: idx,
                style: {
                  background:
                    idx % 2 === 0
                      ? "linear-gradient(90deg,#faf5ff,#f3e8ff)"
                      : "linear-gradient(90deg,#f5f3ff,#ede9fe)",
                  padding: "8px",
                  borderRadius: "8px",
                  fontSize: "12.5px",
                  color: "#581c87",
                  fontStyle: "italic",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  transform: "scale(1)",
                  transition: "transform 0.3s ease",
                  cursor: "default"
                },
                onMouseOver: (e) =>
                  (e.currentTarget.style.transform = "scale(1.02)"),
                onMouseOut: (e) =>
                  (e.currentTarget.style.transform = "scale(1)")
              },
              `💬 ${r}`
            )
          )
        )
      ]
    ),

    // AI Data
    aiData
      ? e(
          "div",
          {
            className: "glow-card glow-buywait",
            style: {
              marginTop: "12px",
              padding: "10px",
              borderRadius: "12px",
              border: "1px solid #d8b4fe",
              background: "linear-gradient(145deg,#faf5ff,#f3e8ff,#ede9fe)",
              boxShadow: "inset 0 1px 4px rgba(0,0,0,0.1)",
              color: "#6b21a8",
              lineHeight: "1.6",
              animation: "fadeIn 1.5s ease"
            }
          },
          [
            e(
              "p",
              { style: { fontWeight: "600" } },
              `💰 Buy/Wait: ${aiData.pricePrediction.recommendation} (Next: ₹${aiData.pricePrediction.nextPrice})`
            ),
            e(
              "p",
              null,
              `📝 Sentiment: ${aiData.reviewAnalysis.sentiment} | Trust: ${aiData.reviewAnalysis.trustScore}`
            ),
            e(
              "p",
              null,
              `📷 Image Quality: ${aiData.imageAnalysis.qualityScore} | Stock: ${
                aiData.imageAnalysis.stockFlag ? "Yes" : "No"
              }`
            ),
            e(
              "p",
              null,
              `🏷️ Competitor: ${aiData.competitorData.site} — ₹${
                aiData.competitorData.price || "N/A"
              }`
            )
          ]
        )
      : null,

    // Buyer Score
    buyerScore !== null
      ? e(
          "p",
          {
            style: {
              marginTop: "10px",
              fontWeight: "600",
              textAlign: "center",
              color: "#7e22ce",
              background:
                "linear-gradient(90deg,#f3e8ff,#ede9fe,#faf5ff)",
              border: "1px solid #e9d5ff",
              borderRadius: "12px",
              padding: "8px",
              animation: "pulse 2s infinite ease-in-out"
            }
          },
          `🧩 Buyer Score: ${buyerScore}/100`
        )
      : null,

    // Dashboard Stats (Restored)
    e(
      "div",
      {
        style: {
          marginTop: "12px",
          borderTop: "1px solid #e9d5ff",
          paddingTop: "8px",
          display: "flex",
          justifyContent: "space-between",
          color: "#6b21a8",
          fontWeight: "500",
          animation: "fadeIn 1.7s ease"
        }
      },
      [
        e("p", null, `💰 Total Saved: ₹${dashboard.totalSaved}`),
        e("p", null, `🏆 Smart Buys: ${dashboard.smartBuys}`)
      ]
    )
  ]
);
}

ReactDOM.render(e(Popup), document.getElementById("root"));

