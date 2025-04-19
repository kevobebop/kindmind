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
  const [isSubscribed, setIsSubscribed] = useState(true); // Assume subscribed for testing
  const [asdAnswer, setAsdAnswer] = useState<AsdTutorOutput | null>(null);
  const [topic, setTopic] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

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
      setLessonPlan('AI Generated Lesson Plan Here');

      const asdResponse = await asdTutor({ question, topic, additionalNotes });
      setAsdAnswer(asdResponse);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to generate answer.' });
    } finally {
      setLoading(false);
    }
  }, [question, imageUrl, toast, isSubscribed, topic, additionalNotes]);

  const handleCheckUnderstanding = async () => {
    if (!answer?.answer) return;
    try {
      const res = await checkUnderstanding({ answer: answer.answer });
      toast({ title: 'Orbii says:', description: res.followUpQuestion });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Check Understanding Error', description: error.message || 'Failed to check understanding.' });
    }
  };

  const handleMiniQuiz = async () => {
    try {
      const res = await generateMiniQuiz({ topic });
      toast({ title: 'Mini Quiz', description: res.questions.map(q => `${q.question}\n${q.answer}`).join('\n\n') });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Generate Mini Quiz Error', description: error.message || 'Failed to generate quiz.' });
    }
  };

  const handleProgressReport = async () => {
    try {
      const sessions = questionHistory.map(item => ({ topic: item.question, successLevel: 1, notes: item.answer.answer }));
      const res = await generateProgressReport({ sessions });
      setProgressReport(res.report);
      toast({ title: 'Progress Report Generated', description: 'Check your progress summary below.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Progress Report Error', description: error.message || 'Failed to generate progress report.' });
    }
  };

  const handleGetLearningStyle = async () => {
    try {
      const res = await getLearningStyle({ options: ["Show me with pictures", "Explain it with steps", "Talk it through with me", "Give me a practice problem"] });
      toast({ title: 'Preferred Learning Style', description: res.selectedStyle });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Learning Style Error', description: error.message || 'Failed to get learning style.' });
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-4 bg-secondary px-4">
      <h1 className="text-3xl font-bold mb-4">Welcome to Orbii's AI Tutor</h1>

      <Textarea value={question} onChange={handleQuestionChange} placeholder="Type your question here..." className="mb-2" />
      <Input type="file" accept="image/*" onChange={handleImageChange} className="mb-2" />

      <Button onClick={handleSubmit} disabled={loading} className="mb-2">{loading ? 'Thinking...' : 'Ask Orbii'}</Button>

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
    </div>
  );
}
