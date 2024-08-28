const { RestClientV5 } = require("bybit-api");
const { convertStringToNumbers } = require("./utils");
require("dotenv").config();

const time = 30;
async function fetchCandles(
  client = new RestClientV5({
    testnet: false,
    key: process.env.API_KEY,
    secret: process.env.PRIVATE_KEY,
  })
) {
  try {
    const data = await client.getKline({
      category: "inverse",
      symbol: "BTCUSDT",
      interval: time.toString(),
      limit: 50,
    });
    const historicalData = convertStringToNumbers(data.result.list).reduce(
      (result, candle) => {
        const [time, open, high, low, close, volume, closeTime] = candle;
        return [
          ...result,
          {
            time: new Date(time).toISOString(),
            open: Number(open),
            high: Number(high),
            low: Number(low),
            close: Number(close),
            volume: Number(volume),
            closeTime,
          },
        ];
      },
      []
    );
    console.log(historicalData);
    const openPositions = await client.getActiveOrders({
      category: "inverse",
      symbol: "BTCUSDT",
      openOnly: 0,
      limit: 1,
    });
    console.log("Open Positions:", openPositions.result);
    const position = findOpportinity(historicalData);
    if (position) {
      //call api to open position
    }
  } catch (error) {
    console.error(error);
  }
}

function findOpportinity(historicalData) {}

fetchCandles();

/* setInterval(() => {
  fetchCandles();
}, time * 60 * 1000); */
