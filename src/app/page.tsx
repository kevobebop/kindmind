'use client';

import { useState, useCallback } from 'react';
import {
  generateHomeworkAnswer,
  GenerateHomeworkAnswerOutput,
} from '@/ai/flows/generate-homework-answer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<GenerateHomeworkAnswerOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
  };

  const handleSubmit = useCallback(async () => {
    if (!question.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a question.',
      });
      return;
    }

    setLoading(true);
    setAnswer(null); // Clear previous answer
    try {
      // Using generateHomeworkAnswer for a simple question/answer flow
      const generatedAnswer = await generateHomeworkAnswer({ question });
      setAnswer(generatedAnswer);
      toast({
        title: 'AI Tutor Replied',
        description: 'The AI has generated an answer.',
      });
    } catch (error: any) {
      console.error('Error generating answer:', error); // Log the full error
      let errorMessage = 'Failed to generate answer.';
        if (error instanceof Error) {
            errorMessage = error.message; // Use the error message directly
        }
       toast({
            variant: 'destructive',
            title: 'Error Generating Answer',
            description: errorMessage,
            // Increase duration for errors
            duration: 9000,
        });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-8 px-4 bg-secondary">
      <h1 className="text-3xl font-bold mb-6 text-primary">Kind Mind Learning AI Tutor</h1>

      <Card className="w-full max-w-2xl mb-4">
        <CardHeader>
          <CardTitle>Ask Orbii a Question</CardTitle>
          <CardDescription>Enter your question below:</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Textarea
            placeholder="Type your question here... e.g., What is 2+2?"
            className="w-full min-h-[100px] text-base"
            value={question}
            onChange={handleQuestionChange}
            disabled={loading}
          />
          <Button
            className="w-full bg-accent text-accent-foreground px-8 py-4 text-lg font-semibold rounded-md shadow-md hover:bg-accent/80 flex items-center justify-center"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Question'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* AI Answer Box */}
      {answer && (
        <Card className="w-full max-w-2xl mt-4">
          <CardHeader>
            <CardTitle>AI Tutor Reply</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Using whitespace-pre-wrap to preserve formatting like line breaks */}
            <p className="text-base whitespace-pre-wrap">{answer.answer}</p>
          </CardContent>
        </Card>
      )}

      {/* Basic Footer with Test Button */}
      <footer className="w-full max-w-2xl mt-8 text-center text-muted-foreground text-sm">
        <p>Powered by Kind Mind Learning AI</p>
      </footer>
    </div>
  );
}
