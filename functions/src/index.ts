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

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

initializeApp()

const db = getFirestore()

export const tripDuration = onSchedule('*/5 * * * *', async () => {
  logger.info('Hello logs!', { structuredData: true })
  const sanToIrv = await getTripLength(coordinates.sanDiego, coordinates.irvine)
  const irvToSan = await getTripLength(coordinates.irvine, coordinates.sanDiego)

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
})
