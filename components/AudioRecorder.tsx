'use client'
import axios from 'axios'
import { Mic, MicOff } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from './ui/button'

const AudioRecorder = () => {
  // output states
  const [transcription, setTranscription] = useState<string>('')
  const [translation, setTranslation] = useState<string>('')

  // recording states
  const [isRecording, setIsRecording] = useState(false)
  const mediaStream = useRef<MediaStream | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  const startRecording = async () => {
    setIsRecording(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStream.current = stream
      mediaRecorder.current = new MediaRecorder(stream)
      mediaRecorder.current.ondataavailable = e => {
        if (e.data.size > 0) {
          chunks.current.push(e.data)
        }
      }
      mediaRecorder.current.onstop = async () => {
        const recordedBlob = new Blob(chunks.current, { type: 'audio/webm' })
        await sendAudioToApi(recordedBlob)
        chunks.current = []
      }
      mediaRecorder.current.start()
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop()
    }
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => {
        track.stop()
      })
    }
  }

  const sendAudioToApi = async (blob: Blob) => {
    const fileName = 'recording.webm'
    const audioFile = new File([blob], fileName, {
      type: 'audio/webm'
    })
    const formData = new FormData()
    formData.append('file', audioFile)

    try {
      const res = await axios.post('/api/speech-to-text', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      const data = res.data
      setTranscription(data.transcription)
      setTranslation(data.translation)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className='flex flex-col gap-2 items-center justify-center'>
      {isRecording ? (
        <Button
          onClick={stopRecording}
          size='icon'
          className='bg-red-500 hover:bg-red-600'
        >
          <MicOff />
        </Button>
      ) : (
        <Button onClick={startRecording} size='icon'>
          <Mic />
        </Button>
      )}
      <p>{transcription}</p>
      <p>{translation}</p>
    </div>
  )
}

export default AudioRecorder
