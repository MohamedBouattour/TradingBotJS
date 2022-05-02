const Binance = require("node-binance-api");
const { ema, bollingerBands } = require("indicatorts");
const lib = require("./utils");
require("dotenv").config();
const { Subject, takeUntil } = require("rxjs");

data = [];
count = 0;
const binance = new Binance().options({
  APIKEY: process.APIKEY,
  APISECRET: process.APISECRET,
});
const PAIR = "PAXGUSDT";

let subject = new Subject();
done$ = new Subject();

async function start(endTime = undefined) {
  count++;
  // Intervals: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
  binance.candlesticks(
    PAIR,
    "5m",
    (error, ticks, symbol) => {
      subject.next(ticks);
      ticks &&
        ticks[0] &&
        ticks[0][0] &&
        count < 300 &&
        (lib.delay(300), start(ticks[0][0]));
    },
    { endTime }
  );
}
subject.pipe(takeUntil(done$)).subscribe((newData) => {
  data = [...newData, ...data];
  let period = (new Date() - new Date(data[0][0])) / (1000 * 60 * 60 * 24);
  console.log(period + "Days");
  if (period > 32) {
    lib.backtestBBema95min(data, period);
    done$.next(true);
    done$.unsubscribe();
  }
});
start();
