const SuperTrend = require("node-super-trend");
//const TI = require("technicalindicators");
const { IndicatorsSync } = require("@ixjb94/indicators");
const ta = new IndicatorsSync();

function superTrendEMA50(data, amount = 100, emaPeriod = 50) {
  const eps = 0;
  const targetROI = 5 / 100;
  let position = null;
  const sampleLength = 200;
  let pnl = amount;
  const fees = (0 / 1000) * 2;
  let riskRewardRatio = 5 / 1;
  let losses = 0;
  let wins = 0;
  data.forEach((candle, index) => {
    if (index >= sampleLength && !position) {
      const testedPeriodData = data.slice(0, index);
      const st = new SuperTrend(testedPeriodData, 10, 3).calculate();
      const ema50s = ta.sma(
        testedPeriodData.map((t) => t[4]),
        emaPeriod
      );
      if (
        st[st.length - 1].trend === "long" &&
        st[st.length - 1].value > ema50s[ema50s.length - 1] + eps &&
        st[st.length - 2].trend === "long" &&
        st[st.length - 2].value < ema50s[ema50s.length - 2] - eps
      ) {
        price = candle[1];
        position = {
          type: "Long",
          entryPrice: price,
          targetPrice: price * (1 + targetROI),
          slPrice: price * (1 - targetROI / 2),
          time: candle[0],
          targetROI,
        };
      } else if (
        st[st.length - 1].trend === "short" &&
        st[st.length - 1].value < ema50s[ema50s.length - 1] - eps &&
        st[st.length - 2].trend === "short" &&
        st[st.length - 2].value > ema50s[ema50s.length - 2] + eps
      ) {
        price = candle[1];
        position = {
          type: "Short",
          entryPrice: price,
          targetPrice: price * (1 - targetROI),
          slPrice: price * (1 + targetROI / 2),
          time: candle[0],
          targetROI,
        };
      }
    }
    if (index > sampleLength && position) {
      if (
        (candle[2] > position.targetPrice && position.type == "Long") ||
        (candle[3] < position.targetPrice && position.type == "Short")
      ) {
        wins++;
        const RIO = position.targetROI;
        pnl = pnl * (1 + RIO) * (1 - fees);
        console.log(
          `WIN ${position.type} ${position.time} ${position.entryPrice}->${position.targetPrice} #ROI ${RIO} % Balance : ${pnl}`
        );
        position = null;
      } else if (
        (candle[2] < position.slPrice && position.type == "Long") ||
        (candle[3] > position.slPrice && position.type == "Short")
      ) {
        losses++;
        pnl = pnl * (1 - position.targetROI / 2) * (1 - fees);
        console.log(
          `LOSS ${position.type} ${position.time} ${position.entryPrice}->${
            position.slPrice
          } #ROI ${position.targetROI / riskRewardRatio} % Balance : ${pnl}`
        );
        position = null;
      }
    }
  });
  console.log(position);
  console.log(
    `Total PNL = ${pnl - amount} | ${
      100 + ((pnl - amount) / amount) * 100
    }% Winrate ${(wins / (wins + losses)) * 100} %`
  );
  const st = new SuperTrend(data, 10, 3).calculate();
  const ema50s = ta.sma(
    data.map((t) => t[4]),
    emaPeriod
  );
  /* console.log(
    "Instat Data",
    data[data.length - 1],
    st[st.length - 1],
    ema50s[ema50s.length - 1]
  ); */
}

function superTrendEMAWithEMA200Cofirmation(
  data,
  amount = 100,
  emaPeriod = 50
) {
  const eps = 0;
  const targetROI = 1.2 / 100;
  let position = null;
  const sampleLength = 200;
  let pnl = amount;
  const fees = 0;
  let riskRewardRatio = 5 / 1;
  let losses = 0;
  let wins = 0;
  data?.forEach((candle, index) => {
    if (index > sampleLength && !position) {
      const testedPeriodData = data.slice(0, index);
      const st = new SuperTrend(testedPeriodData, 10, 3).calculate();
      const ema50s = ta.ema(
        testedPeriodData.map((t) => t[4]),
        emaPeriod
      );
      price = candle[1];
      if (
        st[st.length - 2].trend === "short" &&
        st[st.length - 1].trend === "long" &&
        price > ema50s[ema50s.length - 1] + eps
      ) {
        const slPrice = st[st.length - 1].value;
        const tpPrice = price * (1 + (price / slPrice - 1) * 2);
        position = {
          type: "Long",
          entryPrice: price,
          targetPrice: tpPrice,
          slPrice: slPrice,
          time: candle[0],
          targetROI: tpPrice / price - 1,
        };
      } else if (
        st[st.length - 2].trend === "long" &&
        st[st.length - 1].trend === "short" &&
        price < ema50s[ema50s.length - 1] + eps
      ) {
        const slPrice = ema50s[ema50s.length - 1];
        tpPrice = price * (1 - (slPrice / price - 1) * 2);
        position = {
          type: "Short",
          entryPrice: price,
          targetPrice: tpPrice,
          slPrice: slPrice,
          time: candle[0],
          targetROI: price / tpPrice - 1,
        };
      }
    }
    if (index > sampleLength && position) {
      if (
        (candle[2] > position.targetPrice && position.type == "Long") ||
        (candle[3] < position.targetPrice && position.type == "Short")
      ) {
        wins++;
        const RIO = position.targetROI;
        pnl = pnl * (1 + RIO) * (1 - fees);
        console.log(
          `WIN ${position.type} ${position.time} ${position.entryPrice}->${position.targetPrice} #ROI ${RIO} % Balance : ${pnl}`
        );
        position = null;
      } else if (
        (candle[2] < position.slPrice && position.type == "Long") ||
        (candle[3] > position.slPrice && position.type == "Short")
      ) {
        losses++;
        pnl = pnl * (1 - position.targetROI / 2) * (1 - fees);
        console.log(
          `LOSS ${position.type} ${position.time} ${position.entryPrice}->${
            position.slPrice
          } #ROI ${position.targetROI / riskRewardRatio} % Balance : ${pnl}`
        );
        position = null;
      }
    }
  });
  console.log(position);
  console.log(
    `Total PNL = ${pnl - amount} | ${
      100 + ((pnl - amount) / amount) * 100
    }% Winrate ${(wins / (wins + losses)) * 100} %`
  );
  const st = new SuperTrend(data, 10, 3).calculate();
  const ema50s = ta.ema(
    data.map((t) => t[4]),
    emaPeriod
  );
  /* console.log(
    "Instat Data",
    data[data.length - 1],
    st[st.length - 1],
    ema50s[ema50s.length - 1]
  ); */
}

function superTrendMACD(data, amount = 100, emaPeriod = 50) {
  const eps = 0;
  const targetROI = 1.2 / 100;
  let position = null;
  const sampleLength = 200;
  let pnl = amount;
  const fees = 0;
  let riskRewardRatio = 1.5;
  let losses = 0;
  let wins = 0;
  data?.forEach((candle, index) => {
    if (index > sampleLength && !position) {
      const testedPeriodData = data.slice(0, index);
      const st = new SuperTrend(testedPeriodData, 10, 3).calculate();
      const macd = ta.macd(
        testedPeriodData.map((t) => t[4]),
        12,
        26,
        9
      );
      price = candle[1];
      const slPrice = st[st.length - 1].value;
      if (
        st[st.length - 2].trend === "short" &&
        st[st.length - 1].trend === "long" &&
        0 > macd[macd.length - 1][macd.length - 1]
      ) {
        const tpPrice = price * (1 + (price / slPrice - 1) * riskRewardRatio);
        position = {
          type: "Long",
          entryPrice: price,
          targetPrice: tpPrice,
          slPrice: slPrice,
          time: candle[0],
          targetROI: tpPrice / price - 1,
        };
      } else if (
        st[st.length - 2].trend === "long" &&
        st[st.length - 1].trend === "short" &&
        0 < macd[macd.length - 1][macd.length - 1]
      ) {
        const tpPrice = price * (1 - (slPrice / price - 1) * riskRewardRatio);
        position = {
          type: "Short",
          entryPrice: price,
          targetPrice: tpPrice,
          slPrice: slPrice,
          time: candle[0],
          targetROI: price / tpPrice - 1,
        };
      }
    }
    if (index > sampleLength && position) {
      if (
        (candle[2] > position.targetPrice && position.type == "Long") ||
        (candle[3] < position.targetPrice && position.type == "Short")
      ) {
        wins++;
        const RIO = position.targetROI;
        pnl = pnl * (1 + RIO) * (1 - fees);
        console.log(
          `WIN ${position.type} ${position.time} ${position.entryPrice}->${position.targetPrice} #ROI ${RIO} % Balance : ${pnl}`
        );
        position = null;
      } else if (
        (candle[2] < position.slPrice && position.type == "Long") ||
        (candle[3] > position.slPrice && position.type == "Short")
      ) {
        losses++;
        pnl = pnl * (1 - position.targetROI / 2) * (1 - fees);
        console.log(
          `LOSS ${position.type} ${position.time} ${position.entryPrice}->${
            position.slPrice
          } #ROI ${position.targetROI / riskRewardRatio} % Balance : ${pnl}`
        );
        position = null;
      }
    }
  });
  console.log(position);
  console.log(
    `Total PNL = ${pnl - amount} | ${
      100 + ((pnl - amount) / amount) * 100
    }% Winrate ${(wins / (wins + losses)) * 100} %`
  );
}

function ruumMACD(data, amount = 100, emaPeriod = 9) {
  const eps = 0;
  const targetROI = 1.2 / 100;
  let position = null;
  const sampleLength = 50;
  let pnl = amount;
  const fees = 0;
  let riskRewardRatio = 2;
  let losses = 0;
  let wins = 0;
  data?.forEach((candle, index) => {
    if (index > sampleLength && !position) {
      const testedPeriodData = data.slice(0, index);
      const macd = ta.macd(
        testedPeriodData.map((t) => t[4]),
        12,
        26,
        9
      );
      const channel = ta.dc(
        testedPeriodData.map((t) => t[2]),
        testedPeriodData.map((t) => t[3]),
        4
      );
      const lower = channel[2][channel[2].length - 1];
      const higher = channel[0][channel[0].length - 1];
      price = candle[1];
      if (0 > macd[2][macd[2].length - 2] && 0 < macd[2][macd[2].length - 1]) {
        const tpPrice = price * (1 + (price / lower - 1) * riskRewardRatio);
        position = {
          type: "Long",
          entryPrice: price,
          targetPrice: tpPrice,
          slPrice: lower,
          time: candle[0],
          targetROI: tpPrice / price - 1,
        };
      } else if (
        0 < macd[2][macd[2].length - 2] &&
        0 > macd[2][macd[2].length - 1]
      ) {
        const tpPrice = price * (1 - (higher / price - 1) * riskRewardRatio);
        position = {
          type: "Short",
          entryPrice: price,
          targetPrice: tpPrice,
          slPrice: higher,
          time: candle[0],
          targetROI: price / tpPrice - 1,
        };
      }
    }
    if (index > sampleLength && position) {
      if (
        (candle[2] > position.targetPrice && position.type == "Long") ||
        (candle[3] < position.targetPrice && position.type == "Short")
      ) {
        wins++;
        const RIO = position.targetROI;
        pnl = pnl * (1 + RIO) * (1 - fees);
        console.log(
          `WIN ${position.type} ${position.time} ${position.entryPrice}->${position.targetPrice} #ROI ${RIO} % Balance : ${pnl}`
        );
        position = null;
      } else if (
        (candle[2] < position.slPrice && position.type == "Long") ||
        (candle[3] > position.slPrice && position.type == "Short")
      ) {
        losses++;
        pnl = pnl * (1 - position.targetROI / 2) * (1 - fees);
        console.log(
          `LOSS ${position.type} ${position.time} ${position.entryPrice}->${
            position.slPrice
          } #ROI ${position.targetROI / riskRewardRatio} % Balance : ${pnl}`
        );
        position = null;
      }
    }
  });
  console.log(position);
  console.log(
    `Total Trades ${wins + losses} PNL = ${(pnl - amount).toFixed(2)} | ${(
      100 +
      ((pnl - amount) / amount) * 100
    ).toFixed(2)}% Winrate ${(wins / (wins + losses)) * 100} %`
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
  superTrendEMA50,
  delay,
  mapToObj,
  convertStringToNumbers,
  superTrendEMAWithEMA200Cofirmation,
  superTrendMACD,
  ruumMACD,
};
/**
 * https://github.com/jaggedsoft/node-binance-api

   https://github.com/cinar/indicatorts
 */
