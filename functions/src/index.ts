/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onSchedule } from 'firebase-functions/v2/scheduler'
import * as logger from 'firebase-functions/logger'
import { coordinates, getTripLength } from './maps'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { AxiosError } from 'axios'
import { onRequest } from 'firebase-functions/v2/https'

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

initializeApp()

const db = getFirestore()

type Trip = {
  destination: 'San Diego' | 'Irvine'
  duration: number
  time: Timestamp
}

export const tripDuration = onSchedule('*/5 * * * *', async () => {
  try {
    const sanToIrv = await getTripLength(
      coordinates.sanDiego,
      coordinates.irvine,
    )
    const irvToSan = await getTripLength(
      coordinates.irvine,
      coordinates.sanDiego,
    )

    await Promise.allSettled([
      db.collection('trips').add({
        destination: 'Irvine',
        duration: sanToIrv,
        time: Timestamp.now(),
      }),
      db.collection('trips').add({
        destination: 'San Diego',
        duration: irvToSan,
        time: Timestamp.now(),
      }),
    ])
  } catch (e) {
    if (e instanceof AxiosError) {
      logger.error(e.response?.data)
    }
  }
})

export const analyzeData = onRequest(async (req, res) => {
  const lastUpdate = await db.collection('analysis').doc('lastUpdate').get()
  logger.log('Last update: ', lastUpdate.data()?.time)
  if (
    lastUpdate.exists &&
    lastUpdate.data()?.time &&
    (lastUpdate.data()?.time as Timestamp).seconds >
      Timestamp.now().seconds - 60 * 60 * 24
  ) {
    logger.log('Using cached data')
    const sd = await db.collection('analysis').doc('sd').get()
    const ir = await db.collection('analysis').doc('ir').get()
    res.json({ sd: sd.data(), ir: ir.data() })
    return
  }
  logger.log('Updating data')
  const trips = await db.collection('trips').get()
  const sdDurations = new Map<string, number[]>()
  const irDurations = new Map<string, number[]>()
  trips.docs.map((doc) => {
    const data = doc.data() as Trip
    const time = data.time.toDate().toISOString().split('T')[1]
    if (data.destination === 'San Diego') {
      sdDurations.set(time, [...(sdDurations.get(time) || []), data.duration])
    } else {
      irDurations.set(time, [...(irDurations.get(time) || []), data.duration])
    }
  })
  const sdMedians = new Map<string, number>()
  const irMedians = new Map<string, number>()
  sdDurations.forEach((durations, time) => {
    const median = durations.sort((a, b) => a - b)[
      Math.floor(durations.length / 2)
    ]
    sdMedians.set(time, median)
  })
  irDurations.forEach((durations, time) => {
    const median = durations.sort((a, b) => a - b)[
      Math.floor(durations.length / 2)
    ]
    irMedians.set(time, median)
  })

  const sd = [...sdMedians.entries()]
    .sort((a, b) => {
      return a[1] - b[1]
    })
    .map(([time, median]) => {
      const hours = Math.floor(median / 3600)
      const minutes = Math.floor((median % 3600) / 60)
      const seconds = median % 60

      const [hour, minute] = time.split(':')
      const ampm = parseInt(hour) < 12 ? 'AM' : 'PM'
      const hours12 = parseInt(hour) % 12 || 12
      return {
        time: `${hours12}:${minute} ${ampm}`,
        median: `${hours}h ${minutes}m ${seconds}s`,
      }
    })
  const ir = [...irMedians.entries()]
    .sort((a, b) => {
      return a[1] - b[1]
    })
    .map(([time, median]) => {
      const hours = Math.floor(median / 3600)
      const minutes = Math.floor((median % 3600) / 60)
      const seconds = median % 60

      const [hour, minute] = time.split(':')
      const ampm = parseInt(hour) < 12 ? 'AM' : 'PM'
      const hours12 = parseInt(hour) % 12 || 12
      return {
        time: `${hours12}:${minute} ${ampm}`,
        median: `${hours}h ${minutes}m ${seconds}s`,
      }
    })
  logger.log('Updating cache')
  await db
    .collection('analysis')
    .doc('lastUpdate')
    .set({ time: Timestamp.now() })
  logger.log('Inserting ' + sd.length + ' records into san diego')
  await db.collection('analysis').doc('sd').set({ data: sd })
  logger.log('Inserting ' + ir.length + ' records into irvine')
  await db.collection('analysis').doc('ir').set({ data: ir })

  res.json({ ir, sd })
})
