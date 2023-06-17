import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await fetch('https://analyzedata-cjhk5wpoiq-uc.a.run.app/')
    .then((res) => res.json())
    .then((data) => res.status(200).json(data))
}
