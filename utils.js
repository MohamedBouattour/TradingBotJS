const SuperTrend = require("node-super-trend");
const TI = require("technicalindicators");

function superTrendEMA50(data, amount = 100) {
  const st = new SuperTrend(data, 10, 3).calculate();
  const ema50s = new TI.EMA({
    period: 50,
    values: data.map((t) => t[4]),
  }).getResult();
  console.log(
    data[data.length - 1],
    st[st.length - 1],
    ema50s[ema50s.length - 1]
  );
}
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function mapToObj(candles) {
  return candles.map((item) => {
    const data = ([
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
    ] = item);
    return {
      time: new Date(time).toISOString(),
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: Number(volume),
      closeTime,
      assetVolume: Number(assetVolume),
      trades,
      buyBaseVolume: Number(buyBaseVolume),
      buyAssetVolume: Number(buyAssetVolume),
      ignored,
    };
  });
}
function convertStringToNumbers(candles) {
  return candles.map((candle) => {
    candle[0] = new Date(candle[0]).toISOString();
    candle[1] = Number(candle[1]);
    candle[2] = Number(candle[2]);
    candle[3] = Number(candle[3]);
    candle[4] = Number(candle[4]);
    candle[5] = Number(candle[5]);
    candle[6] = new Date(candle[6]).toISOString();
    candle[7] = Number(candle[7]);
    candle[8] = Number(candle[8]);
    candle[9] = Number(candle[9]);
    candle[10] = Number(candle[10]);
    candle[11] = Number(candle[11]);
    return candle;
  });
}
module.exports = {
  superTrendEMA200: superTrendEMA50,
  delay,
  mapToObj,
  convertStringToNumbers,
};
/**
 * https://github.com/jaggedsoft/node-binance-api

   https://github.com/cinar/indicatorts
 */
