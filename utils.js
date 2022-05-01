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

function backtestBBema95min(ticks) {
  const closes = ticks
    .map((t) => t[4])
    .map(Number);
  const highs = ticks
    .map((t) => t[2]).map(Number);
  const lows = ticks
    .map((t) => t[3]).map(Number);
  const volumes = ticks
    .map((t) => t[5]).map(Number);
  const opens = ticks
    .map((t) => t[1]).map(Number);
  const emas = ema(9, closes);
  const bbs = bollingerBands(closes);
  let targetPrice = 0;
  let entred = false;
  let entryPrice;
  let slPrice;
  let rio = 1;
  let positions = 0;
  let gains = 0
  let losses = 0
  let periods = [];
  let arbitrage
  for (let i = 3; i < n; i++) {
    if (!entred) {
      if (
        Number(ticks[i][4]) > bbs["upperBand"][i] ||
        Number(ticks[i][4]) < bbs["lowerBand"][i]
      ) {
        entryPrice = Number(ticks[i][4]);
        targetPrice = emas[i];
        if (
          Number(ticks[i][4]) > bbs["upperBand"][i] &&
          Number(ticks[i - 1][4]) < bbs["upperBand"][i - 1] &&
          Number(ticks[i - 2][4]) < bbs["upperBand"][i - 2]
        ) {
          //targetPrice = entryPrice * (1-0.002)
          arbitrage = (entryPrice/targetPrice)-1
          console.log("SHORT@: " + entryPrice);
          slPrice = entryPrice*(1+(arbitrage/2))
          entred = true;
          periods.push({
            start: new Date(ticks[i][0]).toUTCString(),
            diff: new Date(ticks[i][0]),
            entryPrice,
            targetPrice,
            slPrice,
            type: "SHORT",
            arbitrage
          });
        }
        if (
          Number(ticks[i][4]) < bbs["lowerBand"][i] &&
          Number(ticks[i - 1][4]) > bbs["lowerBand"][i - 1] &&
          Number(ticks[i - 2][4]) > bbs["lowerBand"][i - 2]
        ) {
          //targetPrice = entryPrice * (1+0.002)
          arbitrage = (targetPrice/entryPrice)-1
          console.log("LONG@: " + entryPrice);
          slPrice = entryPrice*(1-(arbitrage/2))
          entred = true;
          periods.push({
            start: new Date(ticks[i][0]).toUTCString(),
            diff: new Date(ticks[i][0]),
            entryPrice,
            targetPrice,
            slPrice,
            type: "LONG",
            arbitrage
          });
        }
      }
    } else {
      if (targetPrice > lows[i] && targetPrice < highs[i]) {
        gains++
        console.log("TP@: " + targetPrice);
        rio =
          rio *
          Math.max(targetPrice / entryPrice, entryPrice / targetPrice);
        entred = false;
        positions++;
        let old = periods[periods.length - 1];
        periods[periods.length - 1] = {
          ...old,
          end: new Date(ticks[i][0]).toUTCString(),
          diff:
            (new Date(ticks[i][0]).getTime() - new Date(old.diff)) /
            (1000 * 60),
          hit: "TP",
          ratio:Math.max(targetPrice / entryPrice, entryPrice / targetPrice)
        };
      } else if (slPrice > lows[i] && slPrice < highs[i]) {
      losses++
      console.log("SL@: " + slPrice);
      rio = rio * Math.min(slPrice / entryPrice, entryPrice / slPrice);
      entred = false;
      positions++;
      let old = periods[periods.length - 1];
      periods[periods.length - 1] = {
        ...old,
        end: new Date(ticks[i][0]).toUTCString(),
        diff:
          (new Date(ticks[i][0]).getTime() - new Date(old.diff)) /
          (1000 * 60),
          hit:'SL',
          ratio:Math.min(slPrice / entryPrice, entryPrice / slPrice)
      };
    }
    }
  }
  console.log(periods);
  console.log("Balance " + rio*100 + " in " + positions + " Trades");
  positions > 0 && console.log("Win " + gains + " Lose " + losses + " Winrate", (gains/(gains+losses))*100+"%");
}
module.exports = {
  delay,
  volumeOscillator,
  backtestBBema95min
};

/**
 * https://github.com/jaggedsoft/node-binance-api

   https://github.com/cinar/indicatorts
 */
