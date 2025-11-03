// -------------------------------
// content.js
// -------------------------------

// --- Scraper Adapters ---

// Amazon
function scrapeAmazon() {
  const titleEl = document.querySelector("#productTitle");
  const priceEl = document.querySelector(".a-price-whole");
  const imageEl = document.querySelector("#landingImage, .a-dynamic-image");
  const descEl = document.querySelector("#feature-bullets, #productDescription");
  const reviewEls = document.querySelectorAll(".review-text-content span");

  const reviews = Array.from(reviewEls).map(r => r.innerText.trim());

  return {
    site: "Amazon",
    title: titleEl ? titleEl.innerText.trim() : null,
    price: priceEl ? priceEl.innerText.replace(/[^\d.]/g, "") : null,
    image: imageEl ? imageEl.src : null,
    description: descEl ? descEl.innerText.trim() : null,
    reviews,
    brand: document.querySelector("#bylineInfo")?.innerText || "",
    url: window.location.href,
    timestamp: new Date().toISOString()
  };
}

// Flipkart
function scrapeFlipkart() {
  const titleEl = document.querySelector("span.B_NuCI");
  const priceEl = document.querySelector("div._30jeq3._16Jk6d");
  const imageEl = document.querySelector("div._2_AcLJ img");
  const descEl = document.querySelector("div._1mXcCf, ul._1xgFaf");
  const reviewEls = document.querySelectorAll("div.t-ZTKy div");

  const reviews = Array.from(reviewEls).map(r => r.innerText.trim());

  return {
    site: "Flipkart",
    title: titleEl ? titleEl.innerText.trim() : null,
    price: priceEl ? priceEl.innerText.replace(/[^\d.]/g, "") : null,
    image: imageEl ? imageEl.src : null,
    description: descEl ? descEl.innerText.trim() : null,
    reviews,
    brand: document.querySelector("a._2whKao")?.innerText || "",
    url: window.location.href,
    timestamp: new Date().toISOString()
  };
}

// Normalize & Clean Data
function normalizeData(data) {
  if (!data || data.error) return data;
  data.price = data.price ? parseFloat(data.price.replace(/,/g, "")) : null;
  data.reviews = data.reviews.filter(r => r.length > 5);
  data.description = data.description ? data.description.replace(/\s+/g, " ").trim() : null;
  return data;
}

// Main Extraction
function extractProductData() {
  let rawData = null;
  const host = window.location.host;

  if (host.includes("amazon.")) rawData = scrapeAmazon();
  else if (host.includes("flipkart.com")) rawData = scrapeFlipkart();
  else rawData = { site: host, error: "Unsupported site" };

  const data = normalizeData(rawData);

  chrome.storage.local.set({ productInfo: data }, () => {
    console.log("Product data saved:", data);
  });

  return data;
}

// Run extraction immediately
extractProductData();
