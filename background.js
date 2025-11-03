// background.js

console.log("Service Worker running");

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Smart Buy Optimizer installed");
});

// Listen for icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
});

// Create periodic alarm for price check
chrome.alarms.create("priceCheck", { periodInMinutes: 5 });

// Alarm listener
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "priceCheck") {
    const data = await chrome.storage.local.get(["productInfo", "userPreferences"]);
    const product = data.productInfo;
    if (!product) return;

    const competitorSite = product.site.toLowerCase().includes("amazon") ? "Flipkart" : "Amazon";
    const competitorPrice = parseFloat(product.price) + (competitorSite === "Flipkart" ? 50 : 100);

    if (competitorPrice < parseFloat(product.price)) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "Competitor Price Alert!",
        message: `${competitorSite} has a lower price for ${product.title} (₹${competitorPrice})`
      });
    }
  }
});
