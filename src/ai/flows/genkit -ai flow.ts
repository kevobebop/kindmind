import React, { useEffect, useRef, useState } from 'react';

type Props = {
  onResult: (transcript: string) => void;
};

export default function SpeechRecorder({ onResult }: Props) {
  const [listening, setListening] = useState(false);
  const recogRef = useRef<SpeechRecognition>();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window.SpeechRecognition ||
                (window as any).webkitSpeechRecognition) as any;
    if (!SR) return;
    recogRef.current = new SR();
    recogRef.current.continuous = false;
    recogRef.current.interimResults = false;
    recogRef.current.lang = 'en-US';
    recogRef.current.onresult = (e: any) => {
      const transcript = e.results[0]?.[0]?.transcript;
      if (transcript) onResult(transcript);
      setListening(false);
    };
    recogRef.current.onerror = () => setListening(false);
  }, [onResult]);

  const toggle = () => {
    if (!recogRef.current) return;
    if (listening) {
      recogRef.current.stop();
      setListening(false);
    } else {
      recogRef.current.start();
      setListening(true);
    }
  };

  return (
    <button onClick={toggle}>
      {listening ? 'Stop Listening' : 'Start Speaking'}
    </button>
  );
}