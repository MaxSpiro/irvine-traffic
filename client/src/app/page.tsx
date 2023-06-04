import { Chart } from "./Chart";
import type { Res, Trip } from "./types";

export default async function Home() {
  const data: Res = await fetch(
    "https://analyzedata-cjhk5wpoiq-uc.a.run.app/"
  ).then((res) => res.json());

  const map = (value: Trip) => {
    const [h, m, s] = value.median.split(" ");
    const [hours, minutes, seconds] = [h, m, s].map((v) =>
      parseInt(v.replace(/\D/g, ""))
    );
    const median = hours * 3600 + minutes * 60 + seconds;

    const [time, ampm] = value.time.split(" ");
    const [hour, minute] = time.split(":").map((v) => parseInt(v));
    const timeInMinutes = hour * 60 + minute;
    return {
      median,
      time: timeInMinutes + (ampm === "PM" ? 12 * 60 : 0),
    };
  };
  const ir = data.ir.data.map(map).sort((a, b) => a.time - b.time);
  const sd = data.sd.data.map(map).sort((a, b) => a.time - b.time);
  console.log(ir);
  return <Chart data={{ ir, sd }} />;
}
