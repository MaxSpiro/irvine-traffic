import { Chart } from './Chart'
import type { ServerResponse, Category, ChartData } from './types'

export default async function Home() {
  const response: ServerResponse = await fetch(
    'https://analyzedata-cjhk5wpoiq-uc.a.run.app/',
  ).then((res) => res.json())

  const chartData = Object.keys(response).reduce((chartData, category) => {
    const value = response[category as Category]
    chartData[category as Category] = {
      sanDiego: Object.entries(value.sanDiego).map(([timestamp, median]) => {
        const [hour, minute] = timestamp.split(':')
        const time = parseInt(hour) * 60 + parseInt(minute)

        return { time, median }
      }),
      irvine: Object.entries(value.irvine).map(([timestamp, median]) => {
        const [hour, minute] = timestamp.split(':')
        const time = parseInt(hour) * 60 + parseInt(minute)

        return { time, median }
      }),
    }
    return chartData
  }, {} as ChartData)

  return <Chart {...chartData} />
}
