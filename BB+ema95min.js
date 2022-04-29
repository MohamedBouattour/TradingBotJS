const Binance = require("node-binance-api");
const { ema, bollingerBands } = require("indicatorts");
const lib = require("./utils");
require('dotenv').config()

const binance = new Binance().options({
  APIKEY: process.APIKEY,
  APISECRET: process.APISECRET,
});
const PAIR = "BTCUSDT";
async function start() {
  // Intervals: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
  binance.candlesticks(
    PAIR,
    "5m",
    (error, ticks, symbol) => {
      //console.info("candlesticks()", ticks);
      let last_tick = ticks[ticks.length - 1];
      let [
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
      ] = last_tick;
      const n = 500;
      const closes = ticks
        .map((t) => t[4])
        .slice(-n)
        .map(Number);
      const highs = ticks
        .map((t) => t[2])
        .slice(-n)
        .map(Number);
      const lows = ticks
        .map((t) => t[3])
        .slice(-n)
        .map(Number);
      const volumes = ticks
        .map((t) => t[5])
        .slice(-n)
        .map(Number);
      const opens = ticks
        .map((t) => t[1])
        .slice(-n)
        .map(Number);
      const emas = ema(9, closes);
      const bbs = bollingerBands(closes);
      //console.log(Math.abs(Number(ticks[n - 1][1]) - Number(ticks[n - 1][4])))
      let targetPrice = 0;
      let entred = false;
      let entryPrice;
      let slPrice;
      let rio = 1;
      let positions = 0;
      let periods = [];
      for (let i = 3; i < n; i++) {
        if (!entred) {
          if (
            Number(ticks[i][4]) > bbs["upperBand"][i] ||
            Number(ticks[i][4]) < bbs["lowerBand"][i]
          ) {
            entryPrice = ticks[i][4];
            targetPrice = emas[i];
            if (
              Number(ticks[i][4]) > bbs["upperBand"][i] &&
              Number(ticks[i - 1][4]) < bbs["upperBand"][i - 1] &&
              Number(ticks[i - 2][4]) < bbs["upperBand"][i - 2]
            ) {
              console.log("SHORT@: " + ticks[i][4]);
              slPrice = Number(ticks[i][2]);
              entred = true;
              periods.push({
                start: new Date(ticks[i][0]).toUTCString(),
                diff: new Date(ticks[i][0]),
                entryPrice,
                targetPrice,
                slPrice,
                type: "SHORT",
              });
            }
            if (
              Number(ticks[i][4]) < bbs["lowerBand"][i] &&
              Number(ticks[i - 1][4]) > bbs["lowerBand"][i - 1] &&
              Number(ticks[i - 2][4]) > bbs["lowerBand"][i - 2]
            ) {
              console.log("LONG@: " + ticks[i][4]);
              slPrice = Number(ticks[i][3]);
              entred = true;
              periods.push({
                start: new Date(ticks[i][0]).toUTCString(),
                diff: new Date(ticks[i][0]),
                entryPrice,
                targetPrice,
                slPrice,
                type: "LONG",
              });
            }
          }
        } else {
          if (targetPrice > lows[i] && targetPrice < highs[i]) {
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
      console.log("RIO " + rio + " in " + positions + " Trades");
      console.log(ticks[0][0]); 
    },
    //{ endTime: 1650765900000 }
  );
}

start();
