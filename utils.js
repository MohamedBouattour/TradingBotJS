const { ema, sma, bollingerBands } = require("indicatorts");
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function volumeOscillator(shortEMA, longEMA, volumes) {
  const short = ema(shortEMA, volumes);
  const long = ema(longEMA, volumes);
  let oscillations = [];
  for (let i = 0; i < short.length; i++) {
    oscillations.push(((short[i] - long[i]) / long[i]) * 100);
  }
  return oscillations;
}

function backtestBBema95min(ticks, period) {
  const closes = ticks.map((t) => t[4]).map(Number);
  const highs = ticks.map((t) => t[2]).map(Number);
  const lows = ticks.map((t) => t[3]).map(Number);
  const volumes = ticks.map((t) => t[5]).map(Number);
  const opens = ticks.map((t) => t[1]).map(Number);
  const emas = ema(9, closes);
  const bbs = bollingerBands(closes);
  let targetPrice = 0;
  let entred = false;
  let entryPrice;
  let slPrice;
  let positions = 0;
  let gains = 0;
  let losses = 0;
  let periods = [];
  let arbitrage;
  let winMarge = 1.0011;
  for (let i = 3; i < ticks.length; i++) {
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
          //(entryPrice/targetPrice) >= winMarge
        ) {
          //targetPrice = entryPrice * (1-0.002)
          arbitrage = entryPrice / targetPrice - 1;
          console.log("SHORT@: " + entryPrice);
          slPrice = entryPrice * (1 + arbitrage / 2);
          entred = true;
          periods.push({
            start: new Date(ticks[i][0]).toUTCString(),
            diff: new Date(ticks[i][0]),
            entryPrice,
            targetPrice,
            slPrice,
            type: "SHORT",
            arbitrage,
          });
        }
        if (
          Number(ticks[i][4]) < bbs["lowerBand"][i] &&
          Number(ticks[i - 1][4]) > bbs["lowerBand"][i - 1] &&
          Number(ticks[i - 2][4]) > bbs["lowerBand"][i - 2]
          //(targetPrice/entryPrice) >= winMarge
        ) {
          //targetPrice = entryPrice * (1+0.002)
          arbitrage = targetPrice / entryPrice - 1;
          console.log("LONG@: " + entryPrice);
          slPrice = entryPrice * (1 - arbitrage / 3);
          entred = true;
          periods.push({
            start: new Date(ticks[i][0]).toUTCString(),
            diff: new Date(ticks[i][0]),
            entryPrice,
            targetPrice,
            slPrice,
            type: "LONG",
            arbitrage,
          });
        }
      }
    } else {
      if (targetPrice > lows[i] && targetPrice < highs[i]) {
        gains++;
        console.log("TP@: " + targetPrice);
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
          ratio: Math.max(targetPrice / entryPrice, entryPrice / targetPrice),
        };
      } else if (slPrice > lows[i] && slPrice < highs[i]) {
        losses++;
        console.log("SL@: " + slPrice);
        entred = false;
        positions++;
        let old = periods[periods.length - 1];
        periods[periods.length - 1] = {
          ...old,
          end: new Date(ticks[i][0]).toUTCString(),
          diff:
            (new Date(ticks[i][0]).getTime() - new Date(old.diff)) /
            (1000 * 60),
          hit: "SL",
          ratio: Math.min(slPrice / entryPrice, entryPrice / slPrice),
        };
      }
    }
  }
  console.log(periods.slice(-50));
  console.log(
    "Balance " + " in " + positions + " Trades in " + period + "Days"
  );
  positions > 0 &&
    console.log(
      "Win " + gains + " Lose " + losses + " Winrate",
      (gains / (gains + losses)) * 100 + "%"
    );
}

function threeMA(ticks, period, shortMA = 9, meduisma = 25, margin = 5) {
  const closes = ticks.map((t) => t[4]).map(Number);
  const highs = ticks.map((t) => t[2]).map(Number);
  const lows = ticks.map((t) => t[3]).map(Number);
  const fma = ema(shortMA, closes);
  const sma = ema(meduisma, closes);
  let targetPrice = 0;
  let entred = false;
  let entryPrice;
  let slPrice;
  let positions = 0;
  let gains = 0;
  let losses = 0;
  let periods = [];
  let arbitrage;
  let realBalance = 100;
  let balance = realBalance * margin;
  let winMarge = 1.0011;
  let parasite = [];
  for (let i = 3; i < ticks.length; i++) {
    if (!entred) {
      entryPrice = Number(ticks[i][4]);

      if (
        fma[i - 1] >= sma[i - 1] &&
        fma[i] < sma[i]
        //(entryPrice/targetPrice) >= winMarge
      ) {
        /* if(entryPrice / targetPrice - 1 < 0.98){
          targetPrice = entryPrice * 0.98
        }else {
          targetPrice = lma[i];
        } */
        /*-------No Shot in spot------*/
        /* targetPrice = entryPrice * 0.998;
        arbitrage = entryPrice / targetPrice - 1;
        console.log("SHORT@: " + entryPrice);
        slPrice = entryPrice * (1 + arbitrage / 2);
        entred = true;
        periods.push({
          start: new Date(ticks[i][0]).toUTCString(),
          diff: new Date(ticks[i][0]),
          entryPrice,
          targetPrice,
          slPrice,
          type: "SHORT",
          arbitrage,
        }); */
      }
      if (
        fma[i - 1] <= sma[i - 1] &&
        fma[i] > sma[i]
        //(targetPrice/entryPrice) >= winMarge
      ) {
        /* if(targetPrice / entryPrice - 1 > 0.02){
          targetPrice = entryPrice *1.02
        }else {
          targetPrice = lma[i];
        } */
        targetPrice = entryPrice * 1.002;
        arbitrage = targetPrice / entryPrice - 1;
        console.log("LONG@: " + entryPrice);
        slPrice = entryPrice * (1 - arbitrage / 2);
        entred = true;
        periods.push({
          start: new Date(ticks[i][0]).toUTCString(),
          diff: new Date(ticks[i][0]),
          entryPrice,
          targetPrice,
          slPrice,
          type: "LONG",
          arbitrage,
        });
      }
    } else {
      if (targetPrice > lows[i] && targetPrice < highs[i]) {
        gains++;
        console.log("TP@: " + targetPrice);
        entred = false;
        positions++;
        let old = periods[periods.length - 1];
        let newBalance =
          balance *
          Math.max(targetPrice / entryPrice, entryPrice / targetPrice);
        periods[periods.length - 1] = {
          ...old,
          end: new Date(ticks[i][0]).toUTCString(),
          diff:
            (new Date(ticks[i][0]).getTime() - new Date(old.diff)) /
            (1000 * 60 * 60),
          hit: "TP",
          ratio: Math.max(targetPrice / entryPrice, entryPrice / targetPrice),
          newBalance,
          pnl: newBalance - balance,
        };
        realBalance = realBalance + (newBalance - balance);
        balance = newBalance;
      }
    }
  }
  console.log(periods.splice(-5));
  console.log(
    "Balance " +
      realBalance +
      "$ ----" +
      " in " +
      positions +
      " Trades in " +
      period +
      "Days "
  );
  if (positions > 0) {
    /* console.log(
      "Win " + gains + " Lose " + losses + " Winrate",
      (gains / (gains + losses)) * 100 + "%"
    ); */
    let sortedPnl = periods
      .map((pos) => pos.pnl)
      .filter((item) => item && item.pnl)
      .sort((a, b) => b - a);
    console.log(
      `highest win ${sortedPnl[0]} & ${sortedPnl[sortedPnl.length - 1]}`
    );
    //console.log('-------------------parasite-------------------')
    //console.log(parasite)
  }
}

function maCrossBB(
  ticks,
  period,
  shortMA = 9,
  meduisma = 25,
  margin = 5,
  tp = 0.015
) {
  const closes = ticks.map((t) => t[4]).map(Number);
  const highs = ticks.map((t) => t[2]).map(Number);
  const lows = ticks.map((t) => t[3]).map(Number);
  const fma = ema(shortMA, closes);
  const sma = ema(meduisma, closes);
  const bbs = bollingerBands(closes);
  let targetPrice = 0;
  let entred = false;
  let entryPrice;
  let slPrice;
  let positions = 0;
  let gains = 0;
  let losses = 0;
  let periods = [];
  let arbitrage;
  let realBalance = 100;
  let balance = realBalance * margin;
  let winMarge = 1.0011;
  let parasite = [];
  for (let i = 3; i < ticks.length; i++) {
    if (!entred) {
      entryPrice = Number(ticks[i][4]);
      if (
        fma[i - 1] >= sma[i - 1] &&
        fma[i] < sma[i]
        //(entryPrice/targetPrice) >= winMarge
      ) {
        /* if(entryPrice / targetPrice - 1 < 0.98){
          targetPrice = entryPrice * 0.98
        }else {
          targetPrice = lma[i];
        } */
        /*-------No Shot in spot------*/
        //targetPrice = entryPrice * 0.998;
        targetPrice = entryPrice * (1 - tp);
        arbitrage = entryPrice / targetPrice - 1;
        console.log("SHORT@: " + entryPrice);
        slPrice = entryPrice * (1 + tp / 2);
        entred = true;
        periods.push({
          start: new Date(ticks[i][0]).toUTCString(),
          diff: new Date(ticks[i][0]),
          entryPrice,
          targetPrice,
          slPrice,
          type: "SHORT",
          arbitrage,
          entryFees: (balance / 100) * 0.027,
        });
      }
      if (
        fma[i - 1] <= sma[i - 1] &&
        fma[i] > sma[i]
        //(targetPrice/entryPrice) >= winMarge
      ) {
        /* if(targetPrice / entryPrice - 1 > 0.02){
          targetPrice = entryPrice *1.02
        }else {
          targetPrice = lma[i];
        } */
        //targetPrice = entryPrice * 1.002;
        targetPrice = entryPrice * (1 + tp);
        arbitrage = targetPrice / entryPrice - 1;
        console.log("LONG@: " + entryPrice);
        slPrice = entryPrice * (1 - tp / 2);
        entred = true;
        periods.push({
          start: new Date(ticks[i][0]).toUTCString(),
          diff: new Date(ticks[i][0]),
          entryPrice,
          targetPrice,
          slPrice,
          type: "LONG",
          arbitrage,
          entryFees: (balance / 100) * 0.027,
        });
      }
    } else {
      if (targetPrice > lows[i] && targetPrice < highs[i]) {
        gains++;
        console.log("TP@: " + targetPrice);
        entred = false;
        positions++;
        let old = periods[periods.length - 1];
        let newBalance =
          balance *
          Math.max(targetPrice / entryPrice, entryPrice / targetPrice);
        periods[periods.length - 1] = {
          ...old,
          end: new Date(ticks[i][0]).toUTCString(),
          diff:
            (new Date(ticks[i][0]).getTime() - new Date(old.diff)) /
            (1000 * 60 * 60),
          hit: "TP",
          ratio: Math.max(targetPrice / entryPrice, entryPrice / targetPrice),
          newBalance,
          pnl: newBalance - balance,
          closeFees: ((newBalance + (newBalance - balance)) / 100) * 0.036,
        };
        realBalance = realBalance + (newBalance - balance);
        balance = newBalance;
      } else if (slPrice > lows[i] && slPrice < highs[i]) {
        losses++;
        console.log("SL@: " + slPrice);
        entred = false;
        positions++;
        let old = periods[periods.length - 1];
        periods[periods.length - 1] = {
          ...old,
          end: new Date(ticks[i][0]).toUTCString(),
          diff:
            (new Date(ticks[i][0]).getTime() - new Date(old.diff)) /
            (1000 * 60),
          hit: "SL",
          ratio: Math.min(slPrice / entryPrice, entryPrice / slPrice),
        };
      }
    }
  }
  console.log(periods.splice(-5));
  console.log(
    "Balance " +
      realBalance +
      "$ ----" +
      " in " +
      positions +
      " Trades in " +
      period +
      "Days "
  );
  if (positions > 0) {
    console.log(
      "Win " + gains + " Lose " + losses + " Winrate",
      (gains / (gains + losses)) * 100 + "%"
    );
    /* let sortedPnl = periods
      .map((pos) => pos.pnl)
      .filter((item) => item && item.pnl)
      .sort((a, b) => b - a);
    console.log(
      `highest win ${sortedPnl[0]} & ${sortedPnl[sortedPnl.length - 1]}`
    ); */
    //console.log('-------------------parasite-------------------')
    //console.log(parasite)
  }
}
/* 
  to be reworked for spot like trades buy hight sell low
*/
function buyGoldSellD(ticks, shortMA = 9, longMA = 25, margin = 5) {
  const closes = ticks.map((t) => t[4]).map(Number);
  const fma = ema(shortMA, closes);
  const sma = ema(longMA, closes);
  let targetPrice = 0;
  let entred = false;
  let entryPrice;
  let slPrice;
  let positions = 0;
  let gains = 0;
  let losses = 0;
  let periods = [];
  let arbitrage;
  let realBalance = 100;
  let balance = realBalance * margin;
  let winMarge = 1.0011;
  let parasite = [];
  ratio = 0.03;
  for (let i = 1; i < ticks.length; i++) {
    if (!entred) {
      entryPrice = Number(ticks[i][4]);
      if (fma[i - 1] < sma[i - 1] && fma[i] > sma[i]) {
        console.log("Long@", entryPrice, new Date(ticks[i][0]));
        periods.push({
          info: `Long@-${entryPrice}-${new Date(ticks[i][0])}`,
          entryPrice,
          started: new Date(ticks[i][0]),
          targetPrice: entryPrice * (1 + ratio),
          slPrice: entryPrice * (1 - ratio / 2),
        });
        entred = true;
      } else if (fma[i - 1] > sma[i - 1] && fma[i] < sma[i]) {
        console.log("Short@", entryPrice, new Date(ticks[i][0]));
        periods.push({
          info: `Short@-${entryPrice}-${new Date(ticks[i][0])}`,
          entryPrice,
          started: new Date(ticks[i][0]),
          targetPrice: entryPrice * (1 - ratio),
          slPrice: entryPrice * (1 + ratio / 2),
        });
        entred = true;
      }
    } else {
      const old = periods[periods.length - 1];
      const targetPrice = old.targetPrice;
      const stopLossPrice = old.slPrice;

      if (
        targetPrice < Number(ticks[i][2]) &&
        targetPrice > Number(ticks[i][3])
      ) {
        periods[periods.length - 1] = {
          ...old,
          TP: targetPrice,
          time:
            (new Date(ticks[i][0]).getTime() -
              new Date(old.started).getTime()) /
            (1000 * 60 * 60),
        };
        entred = false;
      } else if (
        stopLossPrice < Number(ticks[i][2]) &&
        stopLossPrice > Number(ticks[i][3])
      ) {
        periods[periods.length - 1] = {
          ...old,
          SL: stopLossPrice,
          time:
            (new Date(ticks[i][0]).getTime() - new Date(old.started).getTime()) /
            (1000 * 60 * 60),
        };
        entred = false;
      }
    }
  }
  losses = periods.filter((pos) => pos.SL);
  gains = periods.filter((pos) => pos.TP);
  console.log(losses);
  console.log(
    `${periods.length} positions ${gains.length}Wins & ${
      losses.length
    }Loss Winrate:${(gains.length * 100) / periods.length}%`
  );
}

function buyGoldSellDv2(ticks, period, shortMA = 9, longMA = 99, margin = 5) {
  ticks.forEach((element, index) => {
    /* const [
      time,
      open,
      high,
      low,
      close,
      volume,
      closeTime,
      assetVolume,
      trades,
      buyBaseVolume,
      buyAssetVolume,
      ignored,
    ] = data; */
    if (index >= longMA && index + longMA < 500) {
      const closes = ticks
        .slice()
        .map((t) => Number(t[4]))
        .slice(index, index + longMA);
      detectMACrossover(closes, shortMA, longMA) &&
        console.log(
          new Date(ticks[index][0]),
          detectMACrossover(
            closes.slice(index, index + longMA),
            shortMA,
            longMA
          )
        );
    }
  });
}

function detectMACrossover(data, fastMA, slowMA) {
  // data: array of historical price data
  // fastMA: integer representing the period of the fast moving average
  // slowMA: integer representing the period of the slow moving average

  // calculate the simple moving averages
  const fastSMA =
    data.slice(-fastMA).reduce((acc, val) => acc + val, 0) / fastMA;
  const slowSMA =
    data.slice(-slowMA).reduce((acc, val) => acc + val, 0) / slowMA;

  // check for a bullish crossover (fast MA crosses above slow MA)
  if (
    fastSMA > slowSMA &&
    data.slice(-2)[0] <= slowSMA &&
    data.slice(-1)[0] > fastSMA
  ) {
    return "Bullish crossover detected";
  }
  // check for a bearish crossover (fast MA crosses below slow MA)
  else if (
    fastSMA < slowSMA &&
    data.slice(-2)[0] >= slowSMA &&
    data.slice(-1)[0] < fastSMA
  ) {
    return "Bearish crossover detected";
  }
  // no crossover detected
  else {
    return null;
  }
}
module.exports = {
  delay,
  volumeOscillator,
  backtestBBema95min,
  threeMA,
  maCrossBB,
  buyGoldSellD,
  buyGoldSellDv2,
};

function calculate(
  ticks,
  i,
  entryPrice,
  targetPrice,
  balance,
  realBalance,
  positions,
  periods
) {
  entred = false;
  positions++;
  let old = periods[periods.length - 1];
  let newBalance =
    balance * Math.max(targetPrice / entryPrice, entryPrice / targetPrice);
  periods[periods.length - 1] = {
    ...old,
    end: new Date(ticks[i][0]).toUTCString(),
    diff:
      (new Date(ticks[i][0]).getTime() - new Date(old.diff)) / (1000 * 60 * 60),
    hit: "TP",
    ratio: Math.max(targetPrice / entryPrice, entryPrice / targetPrice),
    newBalance,
    pnl: newBalance - balance,
    closeFees: ((newBalance + (newBalance - balance)) / 100) * 0.036,
  };
  realBalance = realBalance + (newBalance - balance);
  balance = newBalance;
  return { entred, positions, periods, realBalance, balance };
}
/**
 * https://github.com/jaggedsoft/node-binance-api

   https://github.com/cinar/indicatorts
 */
