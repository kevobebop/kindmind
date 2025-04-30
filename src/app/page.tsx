// src/app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Speech } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateMiniQuiz } from '@/ai/flows/generate-mini-quiz';
import { MoodSelector } from '@/components/mood-selector';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [orbiiResponse, setOrbiiResponse] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = 'en-US';

        recog.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setQuestion(transcript);
          toast({ title: 'Voice Input Received', description: transcript });
          setIsListening(false);
        };

        recog.onerror = (e: any) => {
          toast({ title: 'Voice Error', description: e.error });
          setIsListening(false);
        };

        setRecognition(recog);
      }
    }
  }, [toast]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => setHasMicrophonePermission(true))
      .catch(() => setHasMicrophonePermission(false));
  }, []);

  const handleMiniQuiz = async () => {
    try {
      const res = await generateMiniQuiz({ topic: 'fractions' });
      const formatted = res.quiz.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n');


      setOrbiiResponse(`Here’s your quiz:\n\n${formatted}`);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Quiz Error', description: error.message || 'Failed to generate quiz.' });
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-4 bg-secondary px-4">
      <h1 className="text-3xl font-bold mb-4">Welcome to Orbii's AI Tutor</h1>

      <MoodSelector onSelectMood={(mood) => toast({ title: 'Mood Selected', description: `You are feeling ${mood}` })} />

      <Textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Type your question here..."
        className="mb-2"
      />

      <Button
        onClick={() => {
          if (recognition && !isListening && hasMicrophonePermission) {
            setIsListening(true);
            recognition.start();
          } else if (!hasMicrophonePermission) {
            toast({
              variant: 'destructive',
              title: 'Microphone Access Denied',
              description: 'Enable microphone permissions to use voice input.',
            });
          }
        }}
        disabled={isListening || !hasMicrophonePermission}
        variant="secondary"
        className="mb-2"
      >
        <Speech className="mr-2 h-4 w-4" />
        {isListening ? 'Listening...' : 'Speak to Orbii'}
      </Button>

      <Button onClick={handleMiniQuiz} className="mb-4">📝 Get Mini Quiz</Button>

      {orbiiResponse && (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Orbii Responds</CardTitle>
            <CardDescription className="whitespace-pre-line">{orbiiResponse}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {!hasMicrophonePermission && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Microphone Access Required</AlertTitle>
          <AlertDescription>Please allow microphone access in your browser.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
