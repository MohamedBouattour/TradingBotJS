const { ema } = require("indicatorts");

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function volumeOscillator(shortEMA, longEMA, volumes) {
  const short = ema(shortEMA, volumes);
  const long = ema(longEMA, volumes);
  let oscillations = []
  for (let i = 0; i < short.length; i++) {
    oscillations.push(((short[i] - long[i]) / long[i]) * 100)
    
  }
  return oscillations
}

module.exports = {
  delay,
  volumeOscillator,
};

/**
 * https://github.com/jaggedsoft/node-binance-api

   https://github.com/cinar/indicatorts
 */
