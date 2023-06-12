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

const padLeft = (str: string | number, length: number, char: string) => {
  str = typeof str === 'string' ? str : str.toString()
  return char.repeat(length - str.length) + str
}

const daysOfWeek = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export const analyzeData = onRequest(async (req, res) => {
  const lastUpdate = await db.collection('analysis').doc('lastUpdate').get()
  logger.log('Last update: ', lastUpdate.data()?.time)
  // if (
  //   lastUpdate.exists &&
  //   lastUpdate.data()?.time &&
  //   (lastUpdate.data()?.time as Timestamp).seconds >
  //     Timestamp.now().seconds - 60 * 60 * 24
  // ) {
  //   logger.log('Using cached data')
  //   const sd = await db.collection('analysis').doc('sd').get()
  //   const ir = await db.collection('analysis').doc('ir').get()
  //   res.json({ sd: sd.data(), ir: ir.data() })
  //   return
  // }
  logger.log('Updating data')
  const trips = await db.collection('trips').get()
  const durations = new Map<string, number[]>()
  trips.docs.map((doc) => {
    const data = doc.data() as Trip
    const date = data.time.toDate()
    const day = daysOfWeek[date.getDay()]
    const [hour, minute] = date.toISOString().split('T')[1].split(':')
    const roundedTimestamp = `${padLeft(hour, 2, '0')}:${padLeft(
      Math.round(parseInt(minute) / 5) * 5,
      2,
      '0',
    )}`

    const categories = ['All', day]
    if (day === 'Sunday' || day === 'Saturday') {
      categories.push('Weekends')
    } else {
      categories.push('Weekdays')
    }

    const keys = categories.map(
      (category) => `${category} ${data.destination} ${roundedTimestamp}`,
    )
    for (const key of keys) {
      durations.set(key, [...(durations.get(key) || []), data.duration])
    }
  })
  const medians = new Map<string, number>()
  durations.forEach((durations, key) => {
    const median = durations.sort((a, b) => a - b)[
      Math.floor(durations.length / 2)
    ]
    medians.set(key, median)
  })

  res.json(Object.fromEntries(medians))

  // logger.log('Updating cache')
  // await db
  //   .collection('analysis')
  //   .doc('lastUpdate')
  //   .set({ time: Timestamp.now() })
  // logger.log('Inserting ' + sd.length + ' records into san diego')
  // await db.collection('analysis').doc('sd').set({ data: sd })
  // logger.log('Inserting ' + ir.length + ' records into irvine')
  // await db.collection('analysis').doc('ir').set({ data: ir })

  // res.json({ ir, sd })
})
