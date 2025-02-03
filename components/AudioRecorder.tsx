'use client'
import axios from 'axios'
import { Mic, MicOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState<string>('')
  const [translation, setTranslation] = useState<string>('')
  const [recordings, setRecordings] = useState<
    { transcription: string; translation: string }[]
  >([])
  const mediaStream = useRef<MediaStream | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const silenceTimeout = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  useEffect(() => {
    if (isRecording) {
      startListening()
    } else {
      stopListening()
    }
    return () => stopListening()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording])

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStream.current = stream

      // Initialize audio context and analyser
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      source.connect(analyserRef.current)
      analyserRef.current.fftSize = 256
      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const checkForSpeech = () => {
        analyserRef.current?.getByteFrequencyData(dataArray)
        const sum = dataArray.reduce((a, b) => a + b, 0)
        const average = sum / bufferLength

        //console.log('Average audio level:', average) // Debugging

        if (average > 20) {
          // Start recording if average is above threshold
          console.log('Speech detected, starting recording', average) // Debugging
          if (
            !mediaRecorder.current ||
            mediaRecorder.current.state === 'inactive'
          ) {
            startRecording()
          }
          if (silenceTimeout.current) {
            clearTimeout(silenceTimeout.current)
            silenceTimeout.current = null
          }
        } else {
          if (
            mediaRecorder.current &&
            mediaRecorder.current.state === 'recording'
          ) {
            if (!silenceTimeout.current) {
              silenceTimeout.current = setTimeout(() => {
                console.log('Silence detected, stopping recording') // Debugging
                stopRecording()
              }, 2000) // Stop after 2 seconds of silence
            }
          }
        }

        if (isRecording) {
          requestAnimationFrame(checkForSpeech)
        }
      }

      checkForSpeech()
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const startRecording = () => {
    if (mediaStream.current) {
      mediaRecorder.current = new MediaRecorder(mediaStream.current)
      mediaRecorder.current.ondataavailable = e => {
        if (e.data.size > 0) {
          console.log('Data available:', e.data) // Debugging
          chunks.current.push(e.data)
        }
      }
      mediaRecorder.current.onstop = async () => {
        const recordedBlob = new Blob(chunks.current, { type: 'audio/webm' })
        console.log('Recording stopped, sending data to API') // Debugging
        await sendAudioToApi(recordedBlob)
        chunks.current = []
      }
      mediaRecorder.current.start()
      console.log('Recording started') // Debugging
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop()
    }
  }

  const stopListening = () => {
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop())
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    if (silenceTimeout.current) {
      clearTimeout(silenceTimeout.current)
      silenceTimeout.current = null
    }
  }

  const sendAudioToApi = async (blob: Blob) => {
    const fileName = 'recording.webm'
    const audioFile = new File([blob], fileName, {
      type: 'audio/webm'
    })
    const formData = new FormData()
    formData.append('file', audioFile)

    // const API_ROUTE = '/api/speech-to-text'
    const API_ROUTE = 'https://translate.lyztech.com:5000/speech-to-text'

    try {
      const res = await axios.post(API_ROUTE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      const { transcription = '', translation = '' } = res.data
      setTranscription(transcription)
      setTranslation(translation)
      setRecordings(prev => [...prev, { transcription, translation }])
    } catch (error) {
      console.error('Error sending audio to API:', error) // Debugging
    }
  }

  const handleStop = () => {
    stopRecording()
    stopListening()
    // Reset transcription and translation
    setTranscription('')
    setTranslation('')
  }

  return (
    <div className='flex flex-col items-center justify-start h-[80vh]'>
      <div className='flex flex-col items-center justify-center'>
        <Button onClick={() => setIsRecording(!isRecording)} size='icon'>
          {isRecording ? <MicOff /> : <Mic />}
        </Button>
        {recordings.length > 0 && (
          <p className='mt-3'>Current Transcription: {transcription}</p>
        )}
        {recordings.length > 0 && <p>Current Translation: {translation}</p>}
      </div>
      {recordings.length > 0 && (
        <div className='overflow-y-auto w-full flex-1 border border-gray-200 rounded-md mt-10'>
          {recordings.map((recording, index) => (
            <div key={index} className='p-2 border-b'>
              <p>
                <strong>Transcription:</strong> {recording.transcription}
              </p>
              <p>
                <strong>Translation:</strong> {recording.translation}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AudioRecorder
