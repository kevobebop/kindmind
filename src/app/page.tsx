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
import { getLearningStyle, GetLearningStyleOutput } from '@/ai/flows/get-learning-style';
import { generateProgressReport } from '@/ai/flows/generate-progress-report';
import { generateLessonPlan, GenerateLessonPlanOutput } from '@/ai/flows/generate-lesson-plan';
import { orbiiFlow, OrbiiInput, OrbiiOutput } from '@/ai/flows/orbiiFlow';


import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, Speech, Mic, Upload, Brain, CheckCircle, Palette, BookOpen, Smile, Meh, Frown, BarChart2, Users, Settings, LogOut, DollarSign, MessageSquare, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Progress } from "@/components/ui/progress";
import Image from 'next/image';


// Log for checking if Stripe public key is loaded on the client
console.log('Stripe Public Key (Client-side):', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

if (!stripePromise) {
  console.error("Stripe public key is not defined. Stripe functionality will be disabled.");
}

const Mascot = ({ talking, mood }: { talking: boolean; mood: string }) => {
  let mascotImage = '/orbii_neutral.png'; // Default
  if (mood === 'happy') mascotImage = '/orbii_happy.png';
  if (mood === 'sad') mascotImage = '/orbii_sad.png';

  return (
    <div className={`relative w-32 h-32 md:w-48 md:h-48 mb-4 ${talking ? 'animate-bounce' : ''}`}>
      <Image src={mascotImage} alt="Orbii Mascot" width={192} height={192} data-ai-hint="friendly robot" />
    </div>
  );
};

const CheckoutForm = ({ onSuccess, onError }: { onSuccess: () => void; onError: (error: any) => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      console.error("Stripe.js has not yet loaded.");
      onError(new Error("Stripe.js has not yet loaded."));
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      console.error("CardElement not found");
      onError(new Error("CardElement not found."));
      setLoading(false);
      return;
    }

    try {
      // In a real app, you'd create a PaymentIntent on your server
      // and use the clientSecret here. For this example, we'll simulate success.
      console.log("Simulating payment processing...");
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network latency

      // Simulate successful payment
      onSuccess();
    } catch (error) {
      console.error("Payment failed:", error);
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardElement className="p-3 border rounded-md" />
      <Button type="submit" disabled={!stripe || loading} className="w-full bg-primary text-primary-foreground">
        {loading ? 'Processing...' : 'Start Free Trial & Subscribe ($9.99/month after trial)'}
      </Button>
    </form>
  );
};


export default function Home() {
  const [question, setQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState<GenerateHomeworkAnswerOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const { toast } = useToast();
  const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'orbii'; content: string; isImage?: boolean }[]>([]);
  const [isVoiceChatEnabled, setIsVoiceChatEnabled] = useState(false);
  const [currentLessonPlan, setCurrentLessonPlan] = useState<GenerateLessonPlanOutput | null>(null);
  const [userMood, setUserMood] = useState<'happy' | 'neutral' | 'sad'>('neutral');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const [isGuardianView, setIsGuardianView] = useState(false);
  const [studentProgressData, setStudentProgressData] = useState([
    { name: 'Week 1', questions: 5, mastery: 20 },
    { name: 'Week 2', questions: 8, mastery: 40 },
    { name: 'Week 3', questions: 12, mastery: 60 },
    { name: 'Week 4', questions: 10, mastery: 75 },
  ]);
  const [masteryLevel, setMasteryLevel] = useState<number>(0);


  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [orbiiResponse, setOrbiiResponse] = useState<string | null>(null);
  const [isOrbiiTalking, setIsOrbiiTalking] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);


  useEffect(() => {
    console.log('Home component mounted');
    // Initial greeting from Orbii
    const initialOrbiiInput: OrbiiInput = {
      type: 'text',
      intent: 'initial_greeting',
      isNewUser: true, // Assuming new user for initial load
    };
    orbiiFlow(initialOrbiiInput)
      .then(output => {
        setOrbiiResponse(output.response);
        if (isVoiceChatEnabled) speakText(output.response);
      })
      .catch(error => {
        console.error("Error with initial Orbii greeting:", error);
        toast({ variant: 'destructive', title: 'Orbii Error', description: 'Could not get initial greeting.' });
      });
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        window.SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = 'en-US';

        recog.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setQuestion(transcript);
          // Automatically submit the question after voice input
          handleOrbiiInteraction(transcript);
          toast({ title: 'Voice Input Received', description: transcript });
          setIsListening(false);
        };

        recog.onerror = (event: SpeechRecognitionErrorEvent) => { // Corrected type
          toast({ variant: 'destructive', title: 'Voice Error', description: event.error });
          setIsListening(false);
        };
        setRecognition(recog);
      } else {
        console.warn("SpeechRecognition API not supported in this browser.");
      }
    }
  }, [toast]);


  const speakText = useCallback((text: string) => {
    if (!isVoiceChatEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    setIsOrbiiTalking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsOrbiiTalking(false);
    utterance.onerror = () => setIsOrbiiTalking(false); // Ensure talking state resets on error
    window.speechSynthesis.speak(utterance);
  }, [isVoiceChatEnabled]);


  const handleOrbiiInteraction = useCallback(async (userInput: string, imageInput?: string) => {
    if (!isSubscribed && userInput !== 'test_subscription') { // Allow a test phrase to bypass subscription for testing
      toast({ variant: 'destructive', title: 'Subscription Required', description: 'Please subscribe for full access.' });
      setShowCheckout(true);
      return;
    }

    setLoading(true);
    setOrbiiResponse(null);
    addToConversation({ role: 'user', content: userInput, isImage: !!imageInput });
    if (imageInput) {
      addToConversation({ role: 'user', content: imageInput, isImage: true });
    }

    try {
      const orbiiInput: OrbiiInput = {
        type: imageInput ? 'image' : 'text',
        data: imageInput || userInput, // If image, data is image. If text, data is userInput.
        intent: 'homework_help', // More sophisticated intent detection could be added
        userMood: userMood,
        // gradeLevel, learningStrengths, learningStruggles would be sourced from user profile in a real app
      };
      if (imageInput) {
        orbiiInput.data = imageInput; // Ensure data is the image data URI
        orbiiInput.textContextForImage = userInput; // Provide text context for the image
      }


      const output = await orbiiFlow(orbiiInput);
      setOrbiiResponse(output.response);
      addToConversation({ role: 'orbii', content: output.response });
      if (isVoiceChatEnabled) speakText(output.response);

      // Simulate mastery progress
      setMasteryLevel(prev => Math.min(100, prev + 5));
      setStudentProgressData(prev => {
        const lastWeek = prev[prev.length -1];
        if (lastWeek) {
            return [...prev.slice(0, -1), {...lastWeek, questions: lastWeek.questions + 1, mastery: Math.min(100, lastWeek.mastery + 5) }]
        }
        return prev;
      });


      // Attempt to generate a lesson plan if the response is substantial
      if (output.response.length > 50) { // Arbitrary length to decide if a lesson plan is warranted
        const lessonPlanResponse = await generateLessonPlan({
          topic: userInput, // Use user input as topic for now
          studentLevel: "intermediate", // Placeholder
          learningStyle: "visual", // Placeholder
        });
        setCurrentLessonPlan(lessonPlanResponse);
      }


    } catch (error: any) {
      console.error("Error interacting with Orbii:", error);
      const errorMessage = error.message || 'Sorry, I had a little trouble thinking. Could you try again?';
      setOrbiiResponse(errorMessage);
      addToConversation({ role: 'orbii', content: errorMessage });
      if (isVoiceChatEnabled) speakText(errorMessage);
      toast({ variant: 'destructive', title: 'Orbii Error', description: errorMessage });
    } finally {
      setLoading(false);
      setQuestion(''); // Clear input field
      setImageUrl(''); // Clear image preview
    }
  }, [isSubscribed, toast, userMood, isVoiceChatEnabled, speakText]);

  const addToConversation = (message: { role: 'user' | 'orbii'; content: string; isImage?: boolean }) => {
    setConversationHistory(prev => [...prev, message]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImageUrl(result);
        // Optionally, immediately send to Orbii or wait for text input
        // For now, we'll let the user add text and then press send.
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubscriptionSuccess = () => {
    setIsSubscribed(true);
    setShowCheckout(false);
    toast({ title: 'Subscription Successful!', description: "Welcome to Kind Mind Learning! You're all set." });
  };

  const handleSubscriptionError = (error: any) => {
    toast({ variant: 'destructive', title: 'Subscription Failed', description: error.message || "Please try again." });
  };

  const toggleGuardianView = () => setIsGuardianView(!isGuardianView);

  const handleMoodSelect = (mood: 'happy' | 'neutral' | 'sad') => {
    setUserMood(mood);
    toast({ title: 'Mood Updated', description: `Orbii will try to be more ${mood === 'happy' ? 'cheerful' : mood === 'sad' ? 'gentle' : 'focused'}.` });
  };

   useEffect(() => {
    const getCameraPerm = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setHasCameraPermission(false);
        // toast({ variant: "destructive", title: "Camera Access Denied", description: "Please enable camera permissions." });
      }
    };
    getCameraPerm();
  }, []);

  const captureImageFromCamera = () => {
    if (videoRef.current && hasCameraPermission) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setImageUrl(dataUrl); // Set for preview
        // Do not auto-submit here, let user add text and click send
        toast({title: "Image Captured", description: "Add text if needed and click 'Send to Orbii'"});
      }
    } else {
        toast({variant: 'destructive', title: 'Camera Error', description: 'Could not capture image. Check permissions.'});
    }
  };


  // Function to handle voice input
  const handleVoiceInput = () => {
    if (recognition && !isListening) {
      setIsListening(true);
      try {
        recognition.start();
      } catch (e) {
        console.error("Speech recognition start error:", e);
        toast({ variant: 'destructive', title: 'Voice Error', description: 'Could not start voice recognition.' });
        setIsListening(false);
      }
    } else if (isListening && recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  if (typeof window !== 'undefined' && !stripePromise && !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.warn("Stripe public key is missing. Subscription feature will not work.");
  }


  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-4 bg-gradient-to-br from-background to-secondary/50 px-2 md:px-4">
      <header className="w-full max-w-3xl mb-6 text-center">
        <div className="flex justify-center items-center mb-2">
         <Image src="/your-logo.png" alt="Kind Mind Learning Logo" width={64} height={64} className="mr-3" data-ai-hint="brain logo"/>
          <h1 className="text-4xl font-bold text-primary">Kind Mind Learning</h1>
        </div>
         <Mascot talking={isOrbiiTalking} mood={userMood} />
        {orbiiResponse && (
          <Card className="bg-primary/10 border-primary/30 shadow-lg w-full max-w-md mx-auto mt-2">
            <CardContent className="p-3">
              <p className="text-sm text-foreground text-center">{orbiiResponse}</p>
            </CardContent>
          </Card>
        )}
      </header>

      <main className="w-full max-w-3xl flex-1 space-y-6">
        {/* Subscription Area */}
        {!isSubscribed && (
          <Card className="shadow-xl border-primary/50">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-primary">Unlock Orbii's Full Potential!</CardTitle>
              <CardDescription className="text-center">
                Start your 1-month free trial today, then just $9.99/month.
                No credit card needed for the trial!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowCheckout(true)} className="w-full text-lg py-3 bg-accent hover:bg-accent/90 text-accent-foreground">
                <DollarSign className="mr-2" /> Start Free Trial
              </Button>
            </CardContent>
          </Card>
        )}

        {showCheckout && stripePromise && (
          <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Complete Your Subscription</DialogTitle>
                <DialogDescription>
                  Your first month is free. After that, it's $9.99/month.
                </DialogDescription>
              </DialogHeader>
              <Elements stripe={stripePromise}>
                <CheckoutForm onSuccess={handleSubscriptionSuccess} onError={handleSubscriptionError} />
              </Elements>
            </DialogContent>
          </Dialog>
        )}


        {/* Main Interaction Area */}
        {isSubscribed && (
          <>
            {/* Conversation History */}
            <Card className="shadow-lg max-h-96 overflow-y-auto p-4 space-y-3 bg-background/70">
              <CardHeader className="p-2">
                <CardTitle className="text-lg">Conversation with Orbii</CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {conversationHistory.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-2 rounded-lg ${msg.role === 'user' ? 'bg-primary/80 text-primary-foreground' : 'bg-muted'}`}>
                      {msg.isImage ? <Image src={msg.content} alt="User upload" width={200} height={200} className="rounded-md object-contain max-h-48" data-ai-hint="homework image" /> : <p className="text-sm">{msg.content}</p>}
                    </div>
                  </div>
                ))}
                 {loading && (
                    <div className="flex justify-start">
                        <div className="max-w-[70%] p-2 rounded-lg bg-muted flex items-center">
                            <Brain className="animate-pulse h-5 w-5 mr-2 text-primary" />
                            <p className="text-sm italic">Orbii is thinking...</p>
                        </div>
                    </div>
                )}
              </CardContent>
            </Card>

            {/* Input Area */}
            <Card className="shadow-xl sticky bottom-0 bg-background/90 backdrop-blur-sm p-1 md:p-2">
              <CardContent className="p-2 md:p-4 space-y-3">
                <div className="flex items-end space-x-2">
                  <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask Orbii anything or describe your image..."
                    className="flex-grow resize-none text-sm min-h-[40px] md:min-h-[60px]"
                    rows={2}
                    onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleOrbiiInteraction(question, imageUrl);}}}
                  />
                  <Button onClick={() => handleOrbiiInteraction(question, imageUrl)} disabled={loading || (!question && !imageUrl)} size="icon" className="h-10 w-10 md:h-12 md:w-12 bg-primary hover:bg-primary/90">
                    <Send className="h-5 w-5 md:h-6 md:w-6"/>
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button onClick={handleVoiceInput} variant="outline" size="icon" className={`h-9 w-9 md:h-10 md:w-10 ${isListening ? 'bg-destructive text-destructive-foreground' : ''}`}>
                      <Mic className="h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Button asChild variant="outline" size="icon" className="h-9 w-9 md:h-10 md:w-10">
                        <span><Upload className="h-4 w-4 md:h-5 md:w-5" /></span>
                      </Button>
                      <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                     <Button onClick={captureImageFromCamera} variant="outline" size="icon" className="h-9 w-9 md:h-10 md:w-10" disabled={hasCameraPermission === false}>
                        <Camera className="h-4 w-4 md:h-5 md:w-5" />
                     </Button>
                  </div>
                  <div className="flex items-center">
                    <Switch id="voice-chat-switch" checked={isVoiceChatEnabled} onCheckedChange={setIsVoiceChatEnabled} />
                    <Label htmlFor="voice-chat-switch" className="ml-2 text-xs md:text-sm">Voice Replies</Label>
                  </div>
                </div>
                 {imageUrl && (
                    <div className="mt-2 relative w-24 h-24 border rounded-md p-1">
                        <Image src={imageUrl} alt="Image preview" layout="fill" objectFit="cover" className="rounded-md" data-ai-hint="preview homework"/>
                        <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 bg-destructive/80 text-destructive-foreground rounded-full" onClick={() => setImageUrl('')}>
                            <X className="h-3 w-3"/>
                        </Button>
                    </div>
                )}
                {hasCameraPermission === false && (
                    <Alert variant="destructive" className="mt-2">
                        <Camera className="h-4 w-4" />
                        <AlertTitle>Camera Access Denied</AlertTitle>
                        <AlertDescription>Allow camera access in browser settings to use this feature.</AlertDescription>
                    </Alert>
                )}
                 {hasCameraPermission === true && videoRef.current && videoRef.current.srcObject && (
                    <div className="mt-2 w-full max-w-xs mx-auto">
                        <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
                    </div>
                 )}


              </CardContent>
            </Card>

            {/* Additional Features Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4">
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full"><BookOpen className="mr-2 h-4 w-4" />Lesson Plan</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Today's Lesson Plan</DialogTitle>
                        <DialogDescription>Based on your last interaction:</DialogDescription>
                        </DialogHeader>
                        {currentLessonPlan ? (
                        <div className="prose prose-sm dark:prose-invert max-h-80 overflow-y-auto" dangerouslySetInnerHTML={{ __html: currentLessonPlan.lessonPlan.replace(/\n/g, '<br />') }} />
                        ) : (
                        <p>No lesson plan generated yet. Ask Orbii a question to get started!</p>
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full"><Palette className="mr-2 h-4 w-4" />Whiteboard</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl h-[80vh]">
                        <DialogHeader>
                        <DialogTitle>Orbii's Whiteboard</DialogTitle>
                        <DialogDescription>Let's visualize this concept!</DialogDescription>
                        </DialogHeader>
                        <iframe src="https://excalidraw.com/" className="w-full h-[calc(100%-4rem)] border-0 rounded-md"></iframe>
                    </DialogContent>
                </Dialog>
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full"><BarChart2 className="mr-2 h-4 w-4" />Progress</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Your Learning Progress</DialogTitle>
                        </DialogHeader>
                        <Card>
                            <CardHeader><CardTitle>Mastery Level</CardTitle></CardHeader>
                            <CardContent>
                                <Progress value={masteryLevel} className="w-full" />
                                <p className="text-center mt-2 text-sm">{masteryLevel}% Mastered</p>
                            </CardContent>
                        </Card>
                        <ResponsiveContainer width="100%" height={300} className="mt-4">
                        <LineChart data={studentProgressData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="questions" stroke="#8884d8" activeDot={{ r: 8 }} name="Questions Asked"/>
                            <Line type="monotone" dataKey="mastery" stroke="#82ca9d" name="Mastery %"/>
                        </LineChart>
                        </ResponsiveContainer>
                    </DialogContent>
                </Dialog>
                 <Select onValueChange={(value: 'happy' | 'neutral' | 'sad') => handleMoodSelect(value)} defaultValue={userMood}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="How are you feeling?" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="happy"><Smile className="inline mr-2 h-4 w-4" />Happy</SelectItem>
                        <SelectItem value="neutral"><Meh className="inline mr-2 h-4 w-4" />Neutral</SelectItem>
                        <SelectItem value="sad"><Frown className="inline mr-2 h-4 w-4" />A bit stuck</SelectItem>
                    </SelectContent>
                </Select>
            </div>


             {/* Guardian View Toggle and Dashboard */}
            <Card className="mt-6 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Guardian Tools</CardTitle>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="guardian-mode">Guardian View</Label>
                  <Switch id="guardian-mode" checked={isGuardianView} onCheckedChange={toggleGuardianView} />
                </div>
              </CardHeader>
              {isGuardianView && (
                <CardContent>
                  <h3 className="font-semibold mb-2">Student Insights:</h3>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Total questions asked this week: {studentProgressData.reduce((sum, item) => sum + item.questions, 0)}</li>
                    <li>Current mood: {userMood}</li>
                    <li>Learning Style Tip: Focus on visual explanations and step-by-step examples.</li>
                  </ul>
                  <Button variant="link" className="mt-2 p-0 h-auto" onClick={async () => {
                      try {
                        const reportOutput = await generateProgressReport({
                            sessions: studentProgressData.map(d => ({
                                topic: `Covered topics in ${d.name}`, // Simplified for example
                                successLevel: d.mastery / 20, // Scale 0-100 to 0-5
                                notes: `Student asked ${d.questions} questions.`
                            }))
                        });
                        toast({ title: "Full Progress Report", description: reportOutput.report, duration: 10000 });
                      } catch (e : any) {
                        toast({ variant: "destructive", title: "Report Error", description: e.message });
                      }
                  }}>
                    Generate Full Progress Report
                  </Button>
                </CardContent>
              )}
            </Card>

          </>
        )}
      </main>

      <footer className="w-full max-w-3xl mt-8 text-center text-muted-foreground text-xs">
        <p>
          Kind Mind Learning &copy; {new Date().getFullYear()}. Powered by Genkit AI.
        </p>
        {/* Diagnostic button, can be removed for production */}
        <Button variant="ghost" size="sm" className="mt-2" onClick={async () => {
            try {
                console.log("Sending test to Orbii flow...");
                const testOutput = await orbiiFlow({type: "text", data: "Hello Orbii, this is a test."});
                console.log("Test Orbii Response:", testOutput.response);
                toast({title: "Orbii Test Successful", description: testOutput.response });
            } catch (e: any) {
                console.error("Orbii test error:", e);
                toast({title: "Orbii Test Error", description: e.message, variant: "destructive"});
            }
        }}>Test Orbii Flow</Button>
      </footer>
    </div>
  );
}

// Helper to ensure Stripe is loaded before rendering CheckoutForm
const StripeCheckout = ({ onSuccess, onError }: { onSuccess: () => void; onError: (error: any) => void }) => {
  if (!stripePromise) {
    return <p>Loading payment options...</p>;
  }
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
};
