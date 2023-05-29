import axios from 'axios'
import { defineString } from 'firebase-functions/params'

type LatLng = {
  latitude: number
  longitude: number
}

const key = defineString('GOOGLE_MAPS_API_KEY')

export const coordinates = {
  irvine: { latitude: 33.65103948639676, longitude: -117.84169590152861 },
  sanDiego: { latitude: 32.74200538771966, longitude: -117.18222885045152 },
}

export async function getTripLength(from: LatLng, to: LatLng) {
  const { data } = await axios.post(
    'https://routes.googleapis.com/directions/v2:computeRoutes',
    {
      origin: {
        location: {
          latLng: from,
        },
      },
      destination: {
        location: {
          latLng: to,
        },
      },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      departureTime: new Date(
        new Date().setMinutes(new Date().getMinutes() + 1),
      ).toISOString(),
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls: false,
        avoidHighways: false,
        avoidFerries: false,
      },
      languageCode: 'en-US',
      units: 'IMPERIAL',
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'routes.duration',
      },
      params: {
        key: key.value(),
      },
    },
  )
  const durationString = data.routes[0].duration as string
  if (/\d+s/.test(durationString)) {
    return parseInt(durationString.replace('s', ''))
  } else if (/\d+m/.test(durationString)) {
    return parseInt(durationString.replace('m', '')) * 60
  } else if (/\d+h/.test(durationString)) {
    return parseInt(durationString.replace('h', '')) * 3600
  }
  return parseInt(durationString.replace('[^0-9]', ''))
}
