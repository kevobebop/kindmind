'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  generateHomeworkAnswer,
  GenerateHomeworkAnswerOutput,
} from '@/ai/flows/generate-homework-answer';
import { summarizeAnswer } from '@/ai/flows/summarize-answer-for-clarity';
import { processImageQuestion } from '@/ai/flows/process-image-question';
import { asdTutor, AsdTutorOutput } from '@/ai/flows/asd-tutor-flow';
import { checkUnderstanding } from '@/ai/flows/check-understanding';
import { generateMiniQuiz } from '@/ai/flows/generate-mini-quiz';
import { getLearningStyle } from '@/ai/flows/get-learning-style';
import { generateProgressReport } from '@/ai/flows/generate-progress-report';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, Speech } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MoodSelector } from "@/components/mood-selector";

// TypeScript fix for browser-only types
type SpeechRecognitionErrorEvent = Event & { error: string };

const imageStyle = {
  maxWidth: '100%',
  maxHeight: '300px',
  objectFit: 'contain',
};

export default function Home() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<GenerateHomeworkAnswerOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const { toast } = useToast();
  const [questionHistory, setQuestionHistory] = useState<{ question: string; answer: GenerateHomeworkAnswerOutput }[]>([]);

  const [isVoiceChatEnabled, setIsVoiceChatEnabled] = useState(false);
  const [voiceChatTranscript, setVoiceChatTranscript] = useState('');
  const [lessonPlan, setLessonPlan] = useState('');
  const [showLessonPlan, setShowLessonPlan] = useState(false);
  const [progressReport, setProgressReport] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [asdAnswer, setAsdAnswer] = useState<AsdTutorOutput | null>(null);
  const [topic, setTopic] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [userMood, setUserMood] = useState<'happy' | 'neutral' | 'sad'>('neutral');
  const [orbiiResponse, setOrbiiResponse] = useState('');

  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMoodSelect = (mood: 'happy' | 'neutral' | 'sad') => {
    setUserMood(mood);
    toast({ title: 'Mood Selected', description: `You are feeling ${mood}.` });
  };

  const handleSubmit = useCallback(async () => {
    if (!isSubscribed) {
      toast({ variant: 'destructive', title: 'Subscription Required', description: 'Please subscribe to access this feature.' });
      return;
    }

    setLoading(true);
    try {
      let generatedAnswer: GenerateHomeworkAnswerOutput;

      if (imageUrl) {
        const processedImage = await processImageQuestion({ imageURL: imageUrl, questionText: question });
        generatedAnswer = { answer: processedImage.answerText || 'No answer could be generated' };
      } else {
        generatedAnswer = await generateHomeworkAnswer({ question });
      }

      if (generatedAnswer?.answer) {
        const summarized = await summarizeAnswer({ answer: generatedAnswer.answer });
        generatedAnswer.answer = summarized.summary;
      }

      setAnswer(generatedAnswer);
      setQuestionHistory((prev) => [...prev, { question, answer: generatedAnswer }]);
      setLessonPlan('AI Generated Lesson Plan Here');

      const asdResponse = await asdTutor({ question, topic, additionalNotes });
      setAsdAnswer(asdResponse);
      setOrbiiResponse(generatedAnswer.answer);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to generate answer.' });
    } finally {
      setLoading(false);
    }
  }, [question, imageUrl, toast, isSubscribed, topic, additionalNotes]);

  const handleCheckUnderstanding = async () => {
    if (!answer?.answer) return;
    const res = await checkUnderstanding({ answer: answer.answer, userMood: userMood });
    toast({ title: 'Orbii says:', description: res.followUpQuestion });
  };

  const handleMiniQuiz = async () => {
    const res = await generateMiniQuiz({ topic });
    toast({ title: 'Mini Quiz', description: JSON.stringify(res.questions) });
  };

  const handleProgressReport = async () => {
    const res = await generateProgressReport({ sessions: questionHistory.map(s => ({ topic: s.question, successLevel: 0.75, notes: s.answer.answer })) });
    setProgressReport(res.report);
    toast({ title: 'Progress Report Generated', description: 'Check your progress summary below.' });
  };

  const handleGetLearningStyle = async () => {
    const res = await getLearningStyle({ options: ['Show me with pictures', 'Explain it with steps', 'Talk it through with me', 'Give me a practice problem'] });
    toast({ title: 'Preferred Learning Style', description: res.selectedStyle });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

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

        recog.onerror = (e: SpeechRecognitionErrorEvent) => {
          toast({ title: 'Voice Error', description: e.error });
          setIsListening(false);
        };

        setRecognition(recog);
      }
    }
  }, [toast]);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app. To use camera, the site must be served over HTTPS or localhost.',
        });
      }
    };

    const getMicrophonePermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasMicrophonePermission(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        setHasMicrophonePermission(false);
        toast({
          variant: 'destructive',
          title: 'Microphone Access Denied',
          description: 'Please enable microphone permissions in your browser settings to use voice chat.',
        });
      }
    };

    getCameraPermission();
    getMicrophonePermission();
  }, [toast]);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-4 bg-secondary px-4">
      <h1 className="text-3xl font-bold mb-4">Welcome to Orbii's AI Tutor</h1>

      <MoodSelector onSelectMood={handleMoodSelect} />

      <Textarea value={question} onChange={handleQuestionChange} placeholder="Type your question here..." className="mb-2" />
      <Input type="file" accept="image/*" onChange={handleImageChange} className="mb-2" />

      <Button onClick={handleSubmit} disabled={loading} className="mb-2">{loading ? 'Thinking...' : 'Ask Orbii'}</Button>
      <Button
        onClick={() => {
          if (recognition && !isListening && hasMicrophonePermission) {
            setIsListening(true);
            recognition.start();
          } else if (!hasMicrophonePermission) {
            toast({
              variant: 'destructive',
              title: 'Microphone Access Denied',
              description: 'Please enable microphone permissions in your browser settings to use voice input.',
            });
          }
        }}
        disabled={isListening || !hasMicrophonePermission}
        variant="secondary"
      >
        <Speech className="mr-2 h-4 w-4" />
        {isListening ? 'Listening...' : 'Speak to Orbii'}
      </Button>

      <div className="relative mt-4">
        <img
          src="https://picsum.photos/100/100"
          alt="Orbii Mascot"
          className="w-24 h-24 rounded-full"
        />
        {orbiiResponse && (
          <div className="absolute top-0 left-24 p-2 bg-white rounded-lg shadow-md">
            {orbiiResponse}
          </div>
        )}
      </div>

      {answer && (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Answer</CardTitle>
            <CardDescription>{answer.answer}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-2 mt-4">
        <Button onClick={handleCheckUnderstanding}>🧠 Check Understanding</Button>
        <Button onClick={handleMiniQuiz}>📝 Get Mini Quiz</Button>
        <Button onClick={handleProgressReport}>📈 View Progress Report</Button>
        <Button onClick={handleGetLearningStyle}>🎨 Learning Style</Button>
      </div>

      {progressReport && (
        <Card className="w-full max-w-2xl mt-4">
          <CardHeader>
            <CardTitle>Progress Report</CardTitle>
            <CardDescription>{progressReport}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {asdAnswer && (
        <Card className="w-full max-w-2xl mt-4">
          <CardHeader>
            <CardTitle>ASD-Tailored Answer</CardTitle>
            <CardDescription>{asdAnswer.answer}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {!hasCameraPermission && (
        <Alert variant="destructive">
          <AlertTitle>Camera Access Required</AlertTitle>
          <AlertDescription>
            Please allow camera access to use this feature.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
