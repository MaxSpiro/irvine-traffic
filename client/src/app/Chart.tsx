"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { useState, useMemo } from "react";
import { Chart } from "./types";

export function Chart({ data }: { data: Chart }) {
  const [isSd, setIsSd] = useState(true);

  const chartData = isSd ? data.sd : data.ir;

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 text-white">
      <h1 className="text-xl">
        Showing traffic to {isSd ? "San Diego" : "Irvine"}
      </h1>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
        onClick={() => setIsSd((p) => !p)}
      >
        {isSd ? "Display traffic to Irvine" : "Display traffic to San Diego"}
      </button>
      {chartData && (
        <LineChart width={1200} height={600}>
          <Line
            type="monotone"
            dataKey="median"
            data={chartData}
            stroke="#8884d8"
          />
          <XAxis
            dataKey="time"
            spacing={100}
            tickFormatter={(time) => {
              const hours = Math.floor(time / 60);
              const minutes = time % 60;
              return `${hours}:${minutes}`;
            }}
            minTickGap={100}
          />
          <YAxis
            dataKey="median"
            tickFormatter={(value) => {
              const hours = Math.floor(value / 3600);
              const minutes = Math.floor((value % 3600) / 60);
              const seconds = value % 60;
              return `${hours}:${minutes}:${seconds}`;
            }}
          />
          <Tooltip
            labelStyle={{
              color: "black",
            }}
          />
        </LineChart>
      )}
    </main>
  );
}