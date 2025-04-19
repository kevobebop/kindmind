'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  generateHomeworkAnswer,
  GenerateHomeworkAnswerOutput,
} from '@/ai/flows/generate-homework-answer';
import { summarizeAnswer } from '@/ai/flows/summarize-answer-for-clarity';
import { processImageQuestion } from '@/ai/flows/process-image-question';
import { asdTutor, AsdTutorOutput } from '@/ai/flows/asd-tutor-flow';
import { checkUnderstanding, CheckUnderstandingOutput } from '@/ai/flows/check-understanding';
import { generateMiniQuiz, GenerateMiniQuizOutput } from '@/ai/flows/generate-mini-quiz';
import { getLearningStyle, GetLearningStyleOutput } from '@/ai/flows/get-learning-style';
import { generateProgressReport, GenerateProgressReportOutput } from '@/ai/flows/generate-progress-report';
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
import { MoodSelector } from '@/components/mood-selector'; // Import MoodSelector
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'; // Import Recharts components

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
  const [lessonPlan, setLessonPlan] = useState('This is a placeholder lesson plan');
  const [showLessonPlan, setShowLessonPlan] = useState(false);
  const [progressReport, setProgressReport] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(true); // Assume subscribed for testing
  const [asdAnswer, setAsdAnswer] = useState<AsdTutorOutput | null>(null);
  const [topic, setTopic] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // New state variables
  const [mood, setMood] = useState<'happy' | 'neutral' | 'sad'>('neutral');
  const [guardianView, setGuardianView] = useState(false);
  const [mindMapUrl, setMindMapUrl] = useState('');

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
      // Call generateLessonPlan flow here, and setLessonPlan
      setLessonPlan('AI Generated Lesson Plan Here');

      const asdResponse = await asdTutor({ question, topic, additionalNotes });
      setAsdAnswer(asdResponse);

      //Generate quiz and other things as required.
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to generate answer.' });
    } finally {
      setLoading(false);
    }
  }, [question, imageUrl, toast, isSubscribed, topic, additionalNotes]);

  const handleCheckUnderstanding = async () => {
    if (!answer?.answer) return;
    const res = await checkUnderstanding({ answer: answer.answer });
    toast({ title: 'Orbii says:', description: res.response });
  };

  const handleMiniQuiz = async () => {
    const res = await generateMiniQuiz({ topic });
    toast({ title: 'Mini Quiz', description: res.quiz.join('\n') });
  };

  const handleProgressReport = async () => {
    const res = await generateProgressReport({ history: questionHistory });
    setProgressReport(res.report);
    toast({ title: 'Progress Report Generated', description: 'Check your progress summary below.' });
  };

  const handleGetLearningStyle = async () => {
    const res = await getLearningStyle({ studentName: 'Kevin' });
    toast({ title: 'Preferred Learning Style', description: res.style });
  };

  // New function for mood selection
  const handleMoodSelect = (newMood: 'happy' | 'neutral' | 'sad') => {
    setMood(newMood);
    toast({ title: 'Mood Selected', description: `Orbii is now in ${newMood} mode.` });
  };

  // New function for opening mind map
  const openMindMap = () => {
    // Here, you would either:
    // 1. Open a URL to an external mind map tool (like Excalidraw)
    // 2. Integrate an embedded whiteboard component
    // For simplicity, let's just set a dummy URL:
    setMindMapUrl('https://excalidraw.com/#json=value,value');
  };

  // Dummy data for progress chart
  const progressData = [
    { name: 'Week 1', questions: 10, mastery: 0.6 },
    { name: 'Week 2', questions: 15, mastery: 0.7 },
    { name: 'Week 3', questions: 12, mastery: 0.8 },
    { name: 'Week 4', questions: 18, mastery: 0.9 },
  ];

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-4 bg-secondary px-4">
      <h1 className="text-3xl font-bold mb-4">Welcome to Orbii's AI Tutor</h1>

      {/* New Mood Selector */}
      <MoodSelector onSelectMood={handleMoodSelect} />

      <Textarea value={question} onChange={handleQuestionChange} placeholder="Type your question here..." className="mb-2" />
      <Input type="file" accept="image/*" onChange={handleImageChange} className="mb-2" />

      <Button onClick={handleSubmit} disabled={loading} className="mb-2">{loading ? 'Thinking...' : 'Ask Orbii'}</Button>

      {answer && (
        <>
          <Card className="w-full max-w-2xl mb-4">
            <CardHeader>
              <CardTitle>Answer</CardTitle>
              <CardDescription>{answer.answer}</CardDescription>
            </CardHeader>
          </Card>

          {/* New Lesson Plan Display */}
          <Card className="w-full max-w-2xl mb-4">
            <CardHeader>
              <CardTitle>Lesson Plan</CardTitle>
              <CardDescription>Here's a lesson plan to help you master this concept:</CardDescription>
            </CardHeader>
            <CardContent>
              {lessonPlan}
            </CardContent>
          </Card>
        </>
      )}

      <div className="grid grid-cols-2 gap-2 mt-4">
        <Button onClick={handleCheckUnderstanding}>🧠 Check Understanding</Button>
        <Button onClick={handleMiniQuiz}>📝 Get Mini Quiz</Button>
        <Button onClick={handleProgressReport}>📈 View Progress Report</Button>
        <Button onClick={handleGetLearningStyle}>🎨 Learning Style</Button>
        <Button onClick={openMindMap}>
          Launch Mind Map
        </Button>
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

     {/* Progress Overview Card */}
        <Card className="w-full max-w-2xl mt-4">
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
            <CardDescription>Your learning journey at a glance.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <strong>Questions Asked:</strong> {questionHistory.length}
            </div>
            <div>
              <strong>Estimated Mastery:</strong> Proficient {/* Replace with real mastery level calculation */}
            </div>
            {/* Progress Chart */}
            <LineChart width={600} height={300} data={progressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="questions" stroke="#8884d8" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="mastery" stroke="#82ca9d" />
            </LineChart>
          </CardContent>
        </Card>

         {/* Mind Map Integration - Open in new tab */}
        {mindMapUrl && (
          <Button asChild>
            <a href={mindMapUrl} target="_blank" rel="noopener noreferrer">
              Open Fullscreen Mind Map
            </a>
          </Button>
        )}
    </div>
  );
}
