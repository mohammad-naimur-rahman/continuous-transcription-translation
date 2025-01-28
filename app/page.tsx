import AudioRecorder from '@/components/AudioRecorder'

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center bg-background p-4'>
      <div className='w-full space-y-6 text-center'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Voice Translator
          </h1>
          <p className='text-muted-foreground max-w-md mx-auto mt-5'>
            Click the microphone to start recording. Speak in any language, and
            we&apos;ll translate it to English.
          </p>
        </div>
        <AudioRecorder />
      </div>
    </main>
  )
}
