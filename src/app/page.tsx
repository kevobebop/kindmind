'use client';

import {useState, useCallback, useRef, useEffect} from 'react';
import {generateHomeworkAnswer, GenerateHomeworkAnswerOutput} from '@/ai/flows/generate-homework-answer';
import {summarizeAnswer} from '@/ai/flows/summarize-answer-for-clarity';
import {processImageQuestion} from '@/ai/flows/process-image-question';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {useToast} from '@/hooks/use-toast';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Camera, Speech} from 'lucide-react';
import dynamic from 'next/dynamic';
import {Textarea} from '@/components/ui/textarea';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {Label} from '@/components/ui/label';
import {Switch} from '@/components/ui/switch';
import {asdTutor, AsdTutorOutput} from '@/ai/flows/asd-tutor-flow'; // Import the asdTutor function

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

  // Voice Chat State
  const [isVoiceChatEnabled, setIsVoiceChatEnabled] = useState(false);
  const [voiceChatTranscript, setVoiceChatTranscript] = useState('');

  // Whiteboard State
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);

  // Lesson Plan State
  const [lessonPlan, setLessonPlan] = useState('');
  const [showLessonPlan, setShowLessonPlan] = useState(false);

  // Progress Report State
  const [progressReport, setProgressReport] = useState('');

  // Subscription State
  const [isSubscribed, setIsSubscribed] = useState(false);

  // ASD Tutor State
  const [asdAnswer, setAsdAnswer] = useState<AsdTutorOutput | null>(null); // New state for ASD-tailored answers
  const [topic, setTopic] = useState(''); // Add topic state
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
      toast({
        variant: 'destructive',
        title: 'Subscription Required',
        description: 'Please subscribe to access this feature.',
      });
      return;
    }

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

      // Generate Lesson Plan and Progress Report
      setLessonPlan('AI Generated Lesson Plan Here');
      setProgressReport('AI Generated Progress Report Here');

      // Generate ASD-tailored Answer
      const asdResponse = await asdTutor({
        question: question,
        topic: topic,
        additionalNotes: additionalNotes,
      });
      setAsdAnswer(asdResponse); // Store the ASD-tailored answer
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to generate answer.',
      });
    } finally {
      setLoading(false);
    }
  }, [question, imageUrl, toast, isSubscribed, topic, additionalNotes]);

  useEffect(() => {
    console.log('Question History updated:', questionHistory);
  }, [questionHistory]);

  // Function to handle text-to-speech
  const speakText = useCallback((text: string) => {
    const speechSynthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  }, []);

  // State to manage camera permission
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
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
          description: 'Please enable camera permissions in your browser settings to use this app.  To use camera, the site must be served over HTTPS or localhost.',
        });
      }
    };

    getCameraPermission();
  }, [toast]);

  const captureImage = useCallback(() => {
    if (hasCameraPermission && videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const capturedImageUrl = canvas.toDataURL('image/png');
      setImageUrl(capturedImageUrl);
      toast({
        title: 'Image Captured',
        description: 'The image from the camera has been captured.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'No Camera Access',
        description: 'Please allow camera access to capture an image.',
      });
    }
  }, [hasCameraPermission, toast]);

  // Voice Chat Functionality (Placeholder)
  const toggleVoiceChat = () => {
    setIsVoiceChatEnabled(!isVoiceChatEnabled);
    // Implement actual voice chat logic here
    if (!isVoiceChatEnabled) {
      setVoiceChatTranscript('AI Tutor: Hello! How can I help you today?');
    } else {
      setVoiceChatTranscript('');
    }
  };

  const handleSubscribe = () => {
    setIsSubscribed(true);
    toast({
      title: 'Subscription Successful',
      description: 'You are now subscribed for $9.99/month with a free first month.',
    });
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-4 bg-secondary">
      <header className="w-full max-w-2xl mb-6">
        {/* Replace with your logo */}
        <img src="/your-logo.png" alt="Kind Mind and Learning Logo" className="h-16 mx-auto mb-4" />
        <h1 className="text-3xl font-semibold text-center text-primary">Kind Mind and Learning</h1>
        <p className="text-muted-foreground text-center">
          Your Personal AI Tutor for Special Needs
        </p>
      </header>
      <main className="flex flex-col items-center justify-center w-full max-w-2xl flex-1 px-4 text-center">
        {!isSubscribed ? (
          <Card className="w-full mb-4">
            <CardHeader>
              <CardTitle>Start Your Free Month</CardTitle>
              <CardDescription>
                Get full access to all features for a free month, then $9.99/month! No credit card required until the trial ends.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="bg-primary text-primary-foreground px-8 py-4 text-lg font-semibold rounded-md shadow-md hover:bg-primary/80" onClick={handleSubscribe}>Subscribe</Button>
            </CardContent>
          </Card>
        ) : (
          <>
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
                <Textarea
                  placeholder="Topic..."
                  className="w-full"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
                 <Textarea
                  placeholder="Additional Notes for tailoring the answer to the student's learning style..."
                  className="w-full"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
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
                {hasCameraPermission === true ? (
                  <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
                ) : (hasCameraPermission === false &&
                  <Alert variant="destructive">
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                      Please allow camera access to use this feature.  To use camera, the site must be served over HTTPS or localhost.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex justify-between">
                  <Button className="bg-accent text-accent-foreground px-8 py-4 text-lg font-semibold rounded-md shadow-md hover:bg-accent/80" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Generating Answer...' : 'Get Answer'}
                  </Button>
                  <Button
                    onClick={captureImage}
                    disabled={loading || !hasCameraPermission}
                    variant="secondary"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Capture Image
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Voice Chat UI */}
            <Card className="w-full mb-4">
              <CardHeader>
                <CardTitle>Voice Chat</CardTitle>
                <CardDescription>Talk to your AI tutor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="voice-chat">Enable Voice Chat</Label>
                  <Switch
                    id="voice-chat"
                    checked={isVoiceChatEnabled}
                    onCheckedChange={toggleVoiceChat}
                  />
                   <Button
                    onClick={toggleVoiceChat}
                    disabled={loading}
                    variant="secondary"
                  >
                    <Speech className="mr-2 h-4 w-4" />
                    Voice Chat
                  </Button>
                </div>
                {isVoiceChatEnabled && (
                  <div className="mt-4">
                    <p>{voiceChatTranscript}</p>
                    {/* Implement voice input/output components here */}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Whiteboard Integration */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open Whiteboard</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[80%]">
                <DialogHeader>
                  <DialogTitle>Whiteboard</DialogTitle>
                  <DialogDescription>
                    Draw your ideas and mind maps here.
                  </DialogDescription>
                </DialogHeader>
                {/* Embed a whiteboard component or iframe here */}
                <iframe src="https://excalidraw.com/" width="100%" height="500px"></iframe>
              </DialogContent>
            </Dialog>

            {/* Lesson Plan and Progress Report */}
            <div className="flex justify-between w-full mt-4">
              <Button onClick={() => setShowLessonPlan(!showLessonPlan)}>
                {showLessonPlan ? 'Hide Lesson Plan' : 'Show Lesson Plan'}
              </Button>
            </div>

            {showLessonPlan && (
              <Card className="w-full mt-4">
                <CardHeader>
                  <CardTitle>Lesson Plan</CardTitle>
                  <CardDescription>Tailored lesson plan for your needs:</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{lessonPlan}</p>
                </CardContent>
              </Card>
            )}

            {answer && (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Answer</CardTitle>
                  <CardDescription>AI-generated answer:</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{answer.answer}</p>
                  <Button onClick={() => speakText(answer.answer)}>
                    Read Aloud
                  </Button>
                </CardContent>
              </Card>
            )}

             {asdAnswer && (
              <Card className="w-full mt-4">
                <CardHeader>
                  <CardTitle>ASD-Tailored Answer</CardTitle>
                  <CardDescription>AI-generated answer tailored for students with ASD:</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{asdAnswer.answer}</p>
                  <Button onClick={() => speakText(asdAnswer.answer)}>
                    Read Aloud (ASD)
                  </Button>
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
          </>
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
