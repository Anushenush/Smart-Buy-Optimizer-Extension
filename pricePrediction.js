// pricePrediction.js
async function predictPrice(prices) {
  if (!prices || prices.length < 3) return { prediction: null, recommendation: "N/A" };

  // Prepare input tensor
  const tfPrices = tf.tensor2d(prices.map(p => [p]), [prices.length, 1]);

  // Build a simple LSTM model
  const model = tf.sequential();
  model.add(tf.layers.lstm({ units: 16, inputShape: [prices.length, 1] }));
  model.add(tf.layers.dense({ units: 1 }));
  model.compile({ loss: "meanSquaredError", optimizer: "adam" });

  // Train quickly in-browser (few epochs for demo)
  await model.fit(tfPrices.reshape([1, prices.length, 1]), tfPrices.slice([prices.length - 1], [1]), {
    epochs: 10
  });

  // Predict next price
  const nextPrice = model.predict(tfPrices.reshape([1, prices.length, 1])).dataSync()[0];

  // Buy/Wait recommendation
  const lastPrice = prices[prices.length - 1];
  let recommendation = "Wait";
  if (nextPrice < lastPrice) recommendation = "Buy Now";

  return { prediction: nextPrice.toFixed(2), recommendation };
}
