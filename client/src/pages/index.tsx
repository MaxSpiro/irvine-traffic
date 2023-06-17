import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { useMemo, useState, useEffect } from 'react'
import { Category, ChartData, ServerResponse, categories } from './types'

export default function Chart() {
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [direction, setDirection] = useState<'sanDiego' | 'irvine'>('irvine')
  const [category, setCategory] = useState<Category>('weekdays')

  useEffect(() => {
    const fetchData = async () => {
      const response: ServerResponse = await fetch('/api/data', {}).then(
        (res) => res.json(),
      )

      const chartData = Object.keys(response).reduce((chartData, category) => {
        const value = response[category as Category]
        chartData[category as Category] = {
          sanDiego: Object.entries(value.sanDiego).map(
            ([timestamp, median]) => {
              const [hour, minute] = timestamp.split(':')
              const time = parseInt(hour) * 60 + parseInt(minute)

              return { time, median }
            },
          ),
          irvine: Object.entries(value.irvine).map(([timestamp, median]) => {
            const [hour, minute] = timestamp.split(':')
            const time = parseInt(hour) * 60 + parseInt(minute)

            return { time, median }
          }),
        }
        return chartData
      }, {} as ChartData)
      setChartData(chartData)
    }
    fetchData().catch((e) => console.error(e))
  }, [])

  const chartValues = useMemo(() => {
    if (!chartData) return []

    return chartData[category][direction].sort((a, b) => a.time - b.time)
  }, [chartData, category, direction])

  const [min, max] = useMemo(() => {
    if (!chartValues.length) return [null, null]
    let max = chartValues[0].median
    let min = max

    let maxTime = chartValues[0].time
    let minTime = maxTime

    for (const { time, median } of chartValues) {
      if (median > max) {
        max = median
        maxTime = time
      }
      if (median < min) {
        min = median
        minTime = time
      }
    }
    return [
      { time: minTime, median: min },
      { time: maxTime, median: max },
    ]
  }, [chartValues])

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 text-white">
      <h1 className="text-4xl font-bold">
        Showing traffic to {direction === 'irvine' ? 'Irvine' : 'San Diego'} on{' '}
        {category === 'weekdays' || category === 'weekends'
          ? category
          : category === 'all'
          ? 'all days'
          : category + 's'}
      </h1>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
        onClick={() =>
          setDirection(direction === 'irvine' ? 'sanDiego' : 'irvine')
        }
      >
        Change destination
      </button>
      <LineChart width={1200} height={600}>
        <Line
          key={`${direction}-${category}`}
          type="monotone"
          dataKey="median"
          data={chartValues}
          stroke="#8884d8"
          dot={false}
        />
        <XAxis
          dataKey="time"
          spacing={100}
          tickFormatter={(time) => {
            const hours = Math.floor(time / 60)
            const minutes = time % 60
            return `${hours}:${minutes}`
          }}
          minTickGap={100}
        />
        <YAxis
          dataKey="median"
          tickFormatter={(value) => {
            const hours = Math.floor(value / 3600)
            const minutes = Math.floor((value % 3600) / 60)
            const seconds = value % 60
            return `${hours}:${minutes}:${seconds}`
          }}
        />
        <Tooltip
          labelStyle={{
            color: 'black',
          }}
          formatter={(value) => formatValue(value as number)}
          labelFormatter={formatTime}
        />
      </LineChart>
      {max && (
        <h1 className="text-2xl">
          Takes most time ({formatValue(max.median)}) at {formatTime(max.time)}
        </h1>
      )}
      {min && (
        <h1 className="text-2xl">
          Takes least time ({formatValue(min.median)}) at {formatTime(min.time)}
        </h1>
      )}
      <div className="grid grid-cols-5 gap-4 w-full mt-4">
        {categories.map((category) => (
          <button
            key={category}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => setCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
    </main>
  )
}

const formatTime = (time: number) => {
  const hours = Math.floor(time / 60)
  const minutes = time % 60
  const ampm = hours >= 12 ? 'PM' : 'AM'
  return `${hours > 12 ? hours - 12 : hours === 0 ? 12 : hours}:${padLeft(
    minutes,
    2,
    '0',
  )} ${ampm}`
}

const formatValue = (value: number) => {
  const hours = Math.floor(value / 3600)
  const minutes = Math.floor((value % 3600) / 60)
  return `${hours}h ${minutes}m`
}

const padLeft = (str: string | number, length: number, char: string) => {
  str = typeof str === 'string' ? str : str.toString()
  return char.repeat(length - str.length) + str
}
