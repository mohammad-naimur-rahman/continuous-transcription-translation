export const dynamic = 'force-static'

import { openai } from '@/utils/openai'
import fs from 'fs'
import { writeFile } from 'fs/promises'
import { NextResponse } from 'next/server'
import { join } from 'path'

export const config = {
  api: {
    bodyParser: false // Disable Next.js's default body parser
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 })
    }

    const byteArray = await file.arrayBuffer()
    const buffer = Buffer.from(byteArray)

    const path = join(process.cwd(), 'uploads', file.name)
    await writeFile(path, buffer)

    const [transcription, translation] = await Promise.all([
      openai.audio.transcriptions.create({
        file: fs.createReadStream(path),
        model: 'whisper-1',
        response_format: 'text'
      }),
      openai.audio.translations.create({
        file: fs.createReadStream(path),
        model: 'whisper-1',
        response_format: 'text'
      })
    ])

    fs.unlinkSync(path)

    return NextResponse.json({ transcription, translation }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: 'Error processing audio' },
      { status: 500 }
    )
  }
}
