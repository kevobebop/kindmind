'use client';

import {useState, useCallback} from 'react';
import {generateHomeworkAnswer, GenerateHomeworkAnswerOutput} from '@/ai/flows/generate-homework-answer';
import {summarizeAnswer} from '@/ai/flows/summarize-answer-for-clarity';
import {processImageQuestion} from '@/ai/flows/process-image-question';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Textarea} from '@/components/ui/textarea';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {useToast} from '@/hooks/use-toast';
import {useEffect} from 'react';

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
  const {toast} = useToast();
  const [questionHistory, setQuestionHistory] = useState<
    {question: string; answer: GenerateHomeworkAnswerOutput}[]
  >([]);

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
    setLoading(true);
    try {
      let generatedAnswer: GenerateHomeworkAnswerOutput;
      if (imageUrl) {
        const processedImage = await processImageQuestion({
          imageURL: imageUrl,
          questionText: question,
        });

        if (processedImage.answerText) {
          generatedAnswer = {answer: processedImage.answerText};
        } else {
          generatedAnswer = {answer: 'No answer could be generated'};
        }
      } else {
        generatedAnswer = await generateHomeworkAnswer({question: question});
      }

      if (generatedAnswer?.answer) {
        const summarized = await summarizeAnswer({answer: generatedAnswer.answer});
        generatedAnswer.answer = summarized.summary;
      }
      setAnswer(generatedAnswer);
      setQuestionHistory((prevHistory) => [...prevHistory, {question, answer: generatedAnswer!}]);
      toast({
        title: 'Homework Answer Generated',
        description: 'The AI has generated an answer to your question.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to generate answer.',
      });
    } finally {
      setLoading(false);
    }
  }, [question, imageUrl, toast]);

  useEffect(() => {
    console.log('Question History updated:', questionHistory);
  }, [questionHistory]);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-4 bg-secondary">
      <header className="w-full max-w-2xl mb-6">
        <h1 className="text-3xl font-semibold text-center text-primary">Homework Helper AI</h1>
        <p className="text-muted-foreground text-center">
          Ask your homework questions and get helpful answers.
        </p>
      </header>
      <main className="flex flex-col items-center justify-center w-full max-w-2xl flex-1 px-4 text-center">
        <Card className="w-full mb-4">
          <CardHeader>
            <CardTitle>Question Input</CardTitle>
            <CardDescription>Enter your homework question below:</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Textarea
              placeholder="Enter your question here..."
              className="w-full"
              value={question}
              onChange={handleQuestionChange}
            />
            <Input type="file" accept="image/*" className="w-full" onChange={handleImageChange} />
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Uploaded Homework Question"
                style={imageStyle}
                className="rounded-md"
              />
            )}
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Generating Answer...' : 'Get Answer'}
            </Button>
          </CardContent>
        </Card>
        {answer && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Answer</CardTitle>
              <CardDescription>AI-generated answer:</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{answer.answer}</p>
            </CardContent>
          </Card>
        )}
        {questionHistory.length > 0 && (
          <Card className="w-full mt-4">
            <CardHeader>
              <CardTitle>Question History</CardTitle>
              <CardDescription>Previous questions and answers for reference:</CardDescription>
            </CardHeader>
            <CardContent>
              {questionHistory.map((item, index) => (
                <div key={index} className="mb-4">
                  <h3 className="text-lg font-semibold">Question:</h3>
                  <p>{item.question}</p>
                  <h3 className="text-lg font-semibold mt-2">Answer:</h3>
                  <p>{item.answer.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
      <footer className="w-full max-w-2xl mt-8 text-center text-muted-foreground">
        <p>
          Powered by Firebase Studio and Genkit AI
        </p>
      </footer>
    </div>
  );
}
