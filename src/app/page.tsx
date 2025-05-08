// ✅ Orbii's upgraded page.tsx with Genkit brain integration
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
import { orbiiFlow, OrbiiInput, OrbiiOutput, getOrbiiGreeting } from '@/ai/flows/orbiiFlow';


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
import { Camera, Speech, Mic, Upload, Brain, CheckCircle, Palette, BookOpen, Smile, Meh, Frown, BarChart2, Users, Settings, LogOut, DollarSign, MessageSquare, Send, X } from 'lucide-react';
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
import { testGeminiModel, testOpenAIModel } from '@/ai/ai-instance';


// Log for checking if Stripe public key is loaded on the client
console.log('Stripe Public Key (Client-side):', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

if (!stripePromise && typeof window !== 'undefined') { // check typeof window to prevent SSR error
  console.error("Stripe public key is not defined. Stripe functionality will be disabled.");
}

const Mascot = ({ talking, mood }: { talking: boolean; mood: string }) => {
  let mascotImage = '/orbii_neutral.png'; // Default
  if (mood === 'happy') mascotImage = '/orbii_happy.png';
  if (mood === 'sad') mascotImage = '/orbii_sad.png';

  // Fallback for server rendering or if images are not yet loaded
  const [imageSrc, setImageSrc] = useState(mascotImage);
  useEffect(() => {
    setImageSrc(mascotImage);
  }, [mascotImage]);


  return (
    <div className={`relative w-32 h-32 md:w-48 md:h-48 mb-4 ${talking ? 'animate-bounce' : ''}`}>
      <Image src={imageSrc} alt="Orbii Mascot" width={192} height={192} data-ai-hint="friendly robot" />
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
  const [isSubscribed, setIsSubscribed] = useState(false); // Default to false, user needs to "subscribe"
  const [showCheckout, setShowCheckout] = useState(false);

  const [isGuardianView, setIsGuardianView] = useState(false);
  const [studentProgressData, setStudentProgressData] = useState([
    { name: 'Week 1', questions: 5, mastery: 20 },
    { name: 'Week 2', questions: 8, mastery: 40 },
    { name: 'Week 3', questions: 12, mastery: 60 },
    { name: 'Week 4', questions: 10, mastery: 75 },
  ]);
  const [masteryLevel, setMasteryLevel] = useState<number>(0); // Initial mastery


  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [orbiiResponse, setOrbiiResponse] = useState<string | null>(null);
  const [isOrbiiTalking, setIsOrbiiTalking] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isClient, setIsClient] = useState(false);


 useEffect(() => {
    setIsClient(true);
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      toast({
        variant: 'destructive',
        title: 'Stripe Configuration Error',
        description: 'Stripe public key is not set. Payment functionality will be disabled. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env.local file and restart the server.',
        duration: 10000,
      });
    }
  }, [toast]);


  useEffect(() => {
    // Initial greeting from Orbii
    const fetchGreeting = async () => {
      try {
        const output = await getOrbiiGreeting({ isNewUser: true }); // Assuming new user for initial load
        setOrbiiResponse(output.response);
        // If voice chat is enabled by default or via user setting, speak here
        // if (isVoiceChatEnabled) speakText(output.response);
      } catch (error) {
        console.error("Error with initial Orbii greeting:", error);
        toast({ variant: 'destructive', title: 'Orbii Error', description: 'Could not get initial greeting.' });
      }
    };
    fetchGreeting();
  }, [toast]); // Add toast to dependency array if used inside


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
          handleOrbiiInteraction(transcript); // Use current imageUrl if any
          toast({ title: 'Voice Input Received', description: transcript });
          setIsListening(false);
        };

        recog.onerror = (event: SpeechRecognitionErrorEvent) => {
          let errorMsg = event.error;
          if (event.error === 'no-speech') {
            errorMsg = "I didn't catch that. Could you please try speaking again?";
          } else if (event.error === 'audio-capture') {
            errorMsg = "Hmm, I'm having trouble with your microphone. Please check if it's working.";
          } else if (event.error === 'not-allowed') {
            errorMsg = "It looks like I don't have permission to use your microphone. Please check your browser settings.";
          }
          toast({ variant: 'destructive', title: 'Voice Error', description: errorMsg });
          setIsListening(false);
        };
        setRecognition(recog);
      } else {
        console.warn("SpeechRecognition API not supported in this browser.");
        // Optionally toast here if speech is a critical feature
      }
    }
  }, [toast]); // Removed handleOrbiiInteraction from deps as it causes re-init


  const speakText = useCallback((text: string) => {
    if (!isVoiceChatEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    setIsOrbiiTalking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsOrbiiTalking(false);
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setIsOrbiiTalking(false);
      toast({ variant: 'destructive', title: 'Speech Error', description: 'Could not read the text aloud.' });
    };
    window.speechSynthesis.cancel(); // Cancel any previous speech
    window.speechSynthesis.speak(utterance);
  }, [isVoiceChatEnabled, toast]);


  const handleOrbiiInteraction = useCallback(async (userInput: string, imageInputDataUrl?: string) => {
    if (!isSubscribed && userInput.toLowerCase() !== 'test_subscription') {
      toast({ variant: 'destructive', title: 'Subscription Required', description: 'Please subscribe for full access or start a free trial.' });
      setShowCheckout(true);
      return;
    }

    setLoading(true);
    setOrbiiResponse(null); // Clear previous Orbii direct response
    setCurrentAnswer(null); // Clear previous structured answer
    setCurrentLessonPlan(null); // Clear previous lesson plan

    addToConversation({ role: 'user', content: userInput, isImage: !!imageInputDataUrl });
    if (imageInputDataUrl) {
      addToConversation({ role: 'user', content: imageInputDataUrl, isImage: true });
    }

    try {
      const orbiiInput: OrbiiInput = {
        type: imageInputDataUrl ? 'image' : 'text',
        data: imageInputDataUrl || userInput,
        intent: 'homework_help', // This could be more dynamic based on context or buttons
        userMood: userMood,
        topic: topic || userInput, // Use explicit topic if set, else use userInput
        // gradeLevel, learningStrengths, learningStruggles would be sourced from user profile
      };
      if (imageInputDataUrl) {
        orbiiInput.textContextForImage = userInput;
      }


      const output = await orbiiFlow(orbiiInput);
      setOrbiiResponse(output.response); // Display Orbii's conversational response
      addToConversation({ role: 'orbii', content: output.response });
      if (isVoiceChatEnabled) speakText(output.response);

      // Simulate mastery progress for demo
      setMasteryLevel(prev => Math.min(100, prev + Math.floor(Math.random() * 5) + 3));
      setStudentProgressData(prev => {
        const lastWeek = prev[prev.length - 1];
        const newQuestions = lastWeek.questions + 1;
        const newMastery = Math.min(100, lastWeek.mastery + Math.floor(Math.random() * 5) + 3);
        if (prev.length >= 4) { // Keep history to a certain length if desired
            // return [...prev.slice(1), { ...lastWeek, name: `Week ${prev.length}`, questions: newQuestions, mastery: newMastery }];
             return [...prev.slice(0,-1), {...lastWeek, questions: newQuestions, mastery: newMastery}]; // Or just update last entry
        }
        return [...prev, { name: `Week ${prev.length + 1}`, questions: newQuestions, mastery: newMastery }];
      });


      // Generate lesson plan based on the interaction
      if (output.response.length > 30 && (topic || userInput)) { // Condition to generate a lesson plan
        const lessonPlanResponse = await generateLessonPlan({
          topic: topic || userInput,
          studentLevel: "intermediate", // Placeholder, ideally from user profile
          learningStyle: "visual", // Placeholder, ideally from user profile or getLearningStyle flow
        });
        setCurrentLessonPlan(lessonPlanResponse);
        // toast({ title: "Lesson Plan Created!", description: "Check the lesson plan section."});
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
      setQuestion('');
      setImageUrl('');
      // setTopic(''); // Decide if topic should be cleared
    }
  }, [isSubscribed, toast, userMood, isVoiceChatEnabled, speakText, topic]);

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
        // Automatically submit if user prefers, or wait for text + send
        // handleOrbiiInteraction(question || "Please help with this image.", result);
        toast({title: "Image Selected", description: "Add any text notes and click 'Send to Orbii'"});
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
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
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
      } else {
        setHasCameraPermission(false);
        console.log("navigator.mediaDevices not available");
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
        setImageUrl(dataUrl);
        toast({title: "Image Captured", description: "Add text if needed and click 'Send to Orbii'"});
      }
    } else {
        toast({variant: 'destructive', title: 'Camera Error', description: 'Could not capture image. Check permissions or camera connection.'});
    }
  };


  // Function to handle voice input
  const handleVoiceInput = () => {
    if (recognition && !isListening) {
      setIsListening(true);
      try {
        recognition.start();
        toast({ title: "Listening...", description: "Speak your question now."});
      } catch (e: any) {
        console.error("Speech recognition start error:", e);
        toast({ variant: 'destructive', title: 'Voice Error', description: e.message || 'Could not start voice recognition.' });
        setIsListening(false);
      }
    } else if (isListening && recognition) {
      recognition.stop();
      setIsListening(false);
      // toast({ title: "Stopped Listening"}); // Optional: notify user listening stopped
    } else if (!recognition) {
        toast({ variant: 'destructive', title: 'Voice Not Available', description: 'Speech recognition is not supported or enabled in your browser.' });
    }
  };


  if (typeof window !== 'undefined' && !stripePromise && !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && isClient) {
     // This console.warn will only run on the client if stripePromise couldn't be initialized.
    console.warn("Stripe public key is missing or invalid. Subscription feature will not work.");
  }


  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/50">
        <Brain className="h-16 w-16 text-primary animate-pulse" />
        <p className="text-xl text-foreground mt-4">Loading Orbii...</p>
      </div>
    );
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
              <p className="text-sm text-foreground text-center whitespace-pre-wrap">{orbiiResponse}</p>
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
                {stripePromise ? " Credit card required to start trial." : " (Payment system currently unavailable)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => {
                  if (stripePromise) {
                    setShowCheckout(true)
                  } else {
                    toast({ variant: "destructive", title: "Payment System Unavailable", description: "Stripe is not configured correctly."})
                  }
                }} 
                className="w-full text-lg py-3 bg-accent hover:bg-accent/90 text-accent-foreground"
                disabled={!stripePromise}
              >
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
            <Card className="shadow-lg max-h-96 overflow-y-auto p-4 space-y-3 bg-background/70 scroll-smooth">
              <CardHeader className="p-2 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                <CardTitle className="text-lg">Conversation with Orbii</CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {conversationHistory.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-2 rounded-lg shadow ${msg.role === 'user' ? 'bg-primary/80 text-primary-foreground' : 'bg-muted'}`}>
                      {msg.isImage ? <Image src={msg.content} alt="User upload" width={200} height={200} className="rounded-md object-contain max-h-48" data-ai-hint="homework image" /> : <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                    </div>
                  </div>
                ))}
                 {loading && (
                    <div className="flex justify-start">
                        <div className="max-w-[70%] p-2 rounded-lg bg-muted flex items-center shadow">
                            <Brain className="animate-pulse h-5 w-5 mr-2 text-primary" />
                            <p className="text-sm italic">Orbii is thinking...</p>
                        </div>
                    </div>
                )}
              </CardContent>
            </Card>

            {/* Input Area */}
            <Card className="shadow-xl sticky bottom-2 bg-background/90 backdrop-blur-sm p-1 md:p-2 z-20">
              <CardContent className="p-2 md:p-4 space-y-3">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                    <Input 
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Optional: What's the topic?"
                        className="text-sm"
                    />
                    <Select onValueChange={(value: 'happy' | 'neutral' | 'sad') => handleMoodSelect(value)} defaultValue={userMood}>
                        <SelectTrigger className="w-full text-sm">
                            <SelectValue placeholder="How are you feeling?" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="happy"><Smile className="inline mr-2 h-4 w-4" />Happy</SelectItem>
                            <SelectItem value="neutral"><Meh className="inline mr-2 h-4 w-4" />Neutral</SelectItem>
                            <SelectItem value="sad"><Frown className="inline mr-2 h-4 w-4" />A bit stuck</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-end space-x-2">
                  <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask Orbii anything or describe your image..."
                    className="flex-grow resize-none text-sm min-h-[40px] md:min-h-[60px]"
                    rows={2}
                    onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleOrbiiInteraction(question, imageUrl);}}}
                  />
                  <Button onClick={() => handleOrbiiInteraction(question, imageUrl)} disabled={loading || (!question && !imageUrl)} size="icon" className="h-10 w-10 md:h-12 md:w-12 bg-primary hover:bg-primary/90 shrink-0">
                    <Send className="h-5 w-5 md:h-6 md:w-6"/>
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Button onClick={handleVoiceInput} variant="outline" size="icon" className={`h-9 w-9 md:h-10 md:w-10 shrink-0 ${isListening ? 'bg-destructive text-destructive-foreground animate-pulse' : ''}`}>
                      <Mic className="h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Button asChild variant="outline" size="icon" className="h-9 w-9 md:h-10 md:w-10 shrink-0">
                        <span><Upload className="h-4 w-4 md:h-5 md:w-5" /></span>
                      </Button>
                      <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                     <Button onClick={captureImageFromCamera} variant="outline" size="icon" className="h-9 w-9 md:h-10 md:w-10 shrink-0" disabled={hasCameraPermission === false}>
                        <Camera className="h-4 w-4 md:h-5 md:w-5" />
                     </Button>
                  </div>
                  <div className="flex items-center">
                    <Switch id="voice-chat-switch" checked={isVoiceChatEnabled} onCheckedChange={setIsVoiceChatEnabled} />
                    <Label htmlFor="voice-chat-switch" className="ml-2 text-xs md:text-sm">Voice Replies</Label>
                  </div>
                </div>
                 {imageUrl && (
                    <div className="mt-2 relative w-24 h-24 border rounded-md p-1 bg-muted/20">
                        <Image src={imageUrl} alt="Image preview" layout="fill" objectFit="cover" className="rounded-md" data-ai-hint="preview homework"/>
                        <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 bg-destructive/80 text-destructive-foreground rounded-full" onClick={() => setImageUrl('')}>
                            <X className="h-3 w-3"/>
                        </Button>
                    </div>
                )}
                {hasCameraPermission === false && isClient && ( // Only render alert on client after permission check
                    <Alert variant="destructive" className="mt-2">
                        <Camera className="h-4 w-4" />
                        <AlertTitle>Camera Access Denied</AlertTitle>
                        <AlertDescription>Allow camera access in browser settings to use the camera feature. You may need to serve the app over HTTPS or localhost.</AlertDescription>
                    </Alert>
                )}
                 {hasCameraPermission === true && isClient && ( // Only render video on client if permission granted
                    <div className="mt-2 w-full max-w-xs mx-auto">
                        <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay muted playsInline />
                    </div>
                 )}


              </CardContent>
            </Card>

            {/* Additional Features Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start py-6 text-base"><BookOpen className="mr-3 h-5 w-5 text-primary" />View Lesson Plan</Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                        <DialogTitle>Today's Lesson Plan</DialogTitle>
                        <DialogDescription>Based on your last interaction with Orbii:</DialogDescription>
                        </DialogHeader>
                        {currentLessonPlan && currentLessonPlan.lessonPlan ? (
                        <div className="prose prose-sm dark:prose-invert max-h-[60vh] overflow-y-auto p-1" dangerouslySetInnerHTML={{ __html: currentLessonPlan.lessonPlan.replace(/\n/g, '<br />').replace(/\* \*(.*?)\* \*/g, '<strong>$1</strong>').replace(/\* (.*?)\n/g, '<li>$1</li>').replace(/<\/li><br \/>/g, '</li>') }} />
                        ) : (
                        <p>No lesson plan generated yet. Ask Orbii a question about a topic to get started!</p>
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start py-6 text-base"><Palette className="mr-3 h-5 w-5 text-primary" />Orbii's Whiteboard</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl h-[80vh]">
                        <DialogHeader>
                        <DialogTitle>Orbii's Whiteboard</DialogTitle>
                        <DialogDescription>Let's visualize this concept! Orbii might draw something here for you.</DialogDescription>
                        </DialogHeader>
                        <iframe title="Excalidraw Whiteboard" src="https://excalidraw.com/?theme=light" className="w-full h-[calc(100%-5rem)] border-0 rounded-md"></iframe>
                    </DialogContent>
                </Dialog>
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start py-6 text-base"><BarChart2 className="mr-3 h-5 w-5 text-primary" />My Progress</Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                        <DialogTitle>Your Learning Progress</DialogTitle>
                        </DialogHeader>
                        <Card className="my-4">
                            <CardHeader><CardTitle className="text-lg">Mastery Level</CardTitle></CardHeader>
                            <CardContent>
                                <Progress value={masteryLevel} className="w-full h-3" />
                                <p className="text-center mt-2 text-sm">{masteryLevel}% Mastery (Estimated)</p>
                                <p className="text-xs text-muted-foreground text-center">Keep practicing to improve!</p>
                            </CardContent>
                        </Card>
                        {isClient && (
                        <ResponsiveContainer width="100%" height={300} className="mt-4">
                        <LineChart data={studentProgressData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="questions" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} name="Questions Asked"/>
                            <Line type="monotone" dataKey="mastery" stroke="hsl(var(--accent))" name="Mastery %"/>
                        </LineChart>
                        </ResponsiveContainer>
                        )}
                         <Button variant="link" className="mt-2 p-0 h-auto text-sm" onClick={async () => {
                            if (conversationHistory.length === 0) {
                                toast({ title: "No sessions yet", description: "Interact with Orbii to generate a progress report.", variant: "default" });
                                return;
                            }
                            try {
                                setLoading(true);
                                const reportOutput = await generateProgressReport({
                                    sessions: conversationHistory.filter(s=>s.role === 'orbii').slice(-5).map(s => ({ // Use last 5 Orbii interactions for report
                                        topic: topic || "General",
                                        successLevel: Math.floor(Math.random() * 3) + 3, // Placeholder success
                                        notes: s.content.substring(0,100) + "..." // Truncate notes
                                    }))
                                });
                                toast({ title: "Full Progress Report", description: reportOutput.report, duration: 15000, className:"max-w-md" });
                            } catch (e : any) {
                                toast({ variant: "destructive", title: "Report Error", description: e.message });
                            } finally {
                                setLoading(false);
                            }
                        }}>
                            Generate Detailed Report
                        </Button>
                    </DialogContent>
                </Dialog>
            </div>


             {/* Guardian View Toggle and Dashboard */}
            <Card className="mt-6 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <CardTitle className="text-lg">Guardian Tools</CardTitle>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="guardian-mode" className="text-sm">Guardian View</Label>
                  <Switch id="guardian-mode" checked={isGuardianView} onCheckedChange={toggleGuardianView} />
                </div>
              </CardHeader>
              {isGuardianView && (
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 text-md">Student Insights:</h3>
                  <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                    <li>Total questions this session: {conversationHistory.filter(msg => msg.role === 'user' && !msg.isImage).length}</li>
                    <li>Current mood setting: {userMood}</li>
                    <li>Learning Style Tip (Example): Focus on visual explanations and step-by-step examples. Orbii can help with this!</li>
                     <li>Session Topics: {topic || "General Chat"}</li>
                  </ul>
                  <Button variant="link" className="mt-3 p-0 h-auto text-sm" onClick={async () => {
                       if (conversationHistory.length === 0) {
                                toast({ title: "No sessions yet", description: "Interact with Orbii to generate a progress report.", variant: "default" });
                                return;
                            }
                      try {
                        setLoading(true);
                        const reportOutput = await generateProgressReport({
                             sessions: conversationHistory.filter(s=>s.role === 'orbii').slice(-10).map(s => ({
                                topic: topic || "General",
                                successLevel: Math.floor(Math.random() * 3) + 3,
                                notes: s.content.substring(0,100) + "..."
                            }))
                        });
                        // Use a dialog for long reports
                         toast({ title: "Generated Guardian Progress Report", description: reportOutput.report, duration: 20000, className:"max-w-md whitespace-pre-wrap" });
                      } catch (e : any) {
                        toast({ variant: "destructive", title: "Report Error", description: e.message });
                      } finally {
                        setLoading(false);
                      }
                  }}>
                    Generate Full Progress Report for Guardian
                  </Button>
                </CardContent>
              )}
            </Card>

          </>
        )}
      </main>

      <footer className="w-full max-w-3xl mt-8 text-center text-muted-foreground text-xs space-y-2">
        <p>
          Kind Mind Learning &copy; {new Date().getFullYear()}. Powered by Genkit AI.
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="ghost" size="sm" onClick={async () => {
              try {
                  setLoading(true);
                  console.log("Testing Gemini Model...");
                  const result = await testGeminiModel();
                  console.log("Gemini Test Result:", result);
                  toast({title: "Gemini Model Test", description: result });
              } catch (e: any) {
                  console.error("Gemini test error:", e);
                  toast({title: "Gemini Test Error", description: e.message, variant: "destructive"});
              } finally {
                  setLoading(false);
              }
          }}>Test Gemini</Button>
           <Button variant="ghost" size="sm" onClick={async () => {
              try {
                  setLoading(true);
                  console.log("Testing OpenAI Model...");
                  const result = await testOpenAIModel();
                  console.log("OpenAI Test Result:", result);
                  toast({title: "OpenAI Model Test", description: result });
              } catch (e: any) {
                  console.error("OpenAI test error:", e);
                  toast({title: "OpenAI Test Error", description: e.message, variant: "destructive"});
              } finally {
                  setLoading(false);
              }
          }}>Test OpenAI</Button>
        </div>
      </footer>
    </div>
  );
}

// Helper to ensure Stripe is loaded before rendering CheckoutForm
const StripeCheckout = ({ onSuccess, onError }: { onSuccess: () => void; onError: (error: any) => void }) => {
  if (!stripePromise) {
    // This should ideally not be reached if the button is disabled correctly
    return <p className="text-destructive text-center">Stripe is not available. Please configure the Stripe public key.</p>;
  }
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
};
