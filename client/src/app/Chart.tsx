'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { useMemo, useState } from 'react'
import { Category, ChartData } from './types'

export function Chart(props: ChartData) {
  const [activePaths, setActivePaths] = useState<
    {
      destination: 'sanDiego' | 'irvine'
      category: Category
    }[]
  >([
    {
      destination: 'irvine',
      category: 'monday',
    },
  ])

  const lines = useMemo(
    () =>
      activePaths.map(({ destination, category }) => {
        const chartValues = props[category][destination]
        chartValues.sort((a, b) => a.time - b.time)
        return (
          <Line
            key={`${destination}-${category}`}
            type="monotone"
            dataKey="median"
            data={chartValues}
            stroke="#8884d8"
            dot={false}
          />
        )
      }),
    [activePaths, props],
  )

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 text-white">
      <LineChart width={1200} height={600}>
        {...lines}
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
          formatter={(value) => {
            value = value as number
            const hours = Math.floor(value / 3600)
            const minutes = Math.floor((value % 3600) / 60)
            return `${hours}h ${minutes}m`
          }}
          labelFormatter={(time) => {
            time = time as number
            const hours = Math.floor(time / 60)
            const minutes = time % 60
            const ampm = hours >= 12 ? 'PM' : 'AM'
            return `${
              hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
            }:${padLeft(minutes, 2, '0')} ${ampm}`
          }}
        />
      </LineChart>
    </main>
  )
}

const padLeft = (str: string | number, length: number, char: string) => {
  str = typeof str === 'string' ? str : str.toString()
  return char.repeat(length - str.length) + str
}
