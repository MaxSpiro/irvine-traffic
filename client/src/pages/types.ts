export const categories = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
  'all',
  'weekends',
  'weekdays',
] as const
export type Category = (typeof categories)[number]

export type TrafficData = {
  sanDiego: Record<string, number>
  irvine: Record<string, number>
}
export type ServerResponse = Record<Category, TrafficData>

export type ChartValue = {
  time: number
  median: number
}
export type ChartData = Record<
  Category,
  {
    sanDiego: ChartValue[]
    irvine: ChartValue[]
  }
>
