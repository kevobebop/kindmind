// ✅ Orbii's upgraded page.tsx with Genkit brain integration

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  getOrbiiGreeting,
  orbiiFlow,
  OrbiiInput,
  OrbiiOutput,
} from '@/ai/flows/orbiiFlow';
import { generateLessonPlan } from '@/ai/flows/generate-lesson-plan';
import { generateProgressReport } from '@/ai/flows/generate-progress-report';
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
import { Camera, Speech, Upload, Bot, Brain, Palette, BarChart3, UserCog, DollarSign, Settings, PlayCircle, FileText, Smile, Meh, Frown, Sun, Zap, CheckCircle, XCircle, Mic } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import { asdTutor, AsdTutorOutput } from '@/ai/flows/asd-tutor-flow';
import { Tldraw } from 'tldraw';

import { testGeminiModel, testOpenAIModel } from '@/ai/testActions';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

if (!stripePromise && typeof window !== 'undefined') { 
  console.error("Stripe public key is not defined in .env.local NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY. Stripe functionality will be disabled.");
}

const Mascot = ({ talking, mood }: { talking: boolean; mood: string }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Fallback or placeholder for SSR to avoid hydration mismatch
    return <div className="w-32 h-32 bg-gray-200 rounded-full animate-pulse mx-auto"></div>;
  }

  let moodClasses = "bg-blue-400"; // Default mood
  if (mood === "happy") moodClasses = "bg-green-400";
  if (mood === "neutral") moodClasses = "bg-yellow-400";
  if (mood === "sad") moodClasses = "bg-red-500"; // More distinct for sad/frustrated

  return (
    <div className={`relative w-32 h-32 rounded-full shadow-xl transition-all duration-500 ease-in-out ${moodClasses} flex items-center justify-center transform ${talking ? 'scale-110 animate-pulse' : 'scale-100'} mx-auto border-4 border-white`}>
      {/* Eyes - bigger and more expressive for Orbii */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 flex space-x-4">
        <div className="w-10 h-10 bg-white rounded-full border-2 border-gray-700 flex items-center justify-center">
          <div className={`w-5 h-5 bg-gray-800 rounded-full ${talking ? 'animate-ping' : ''}`}></div> {/* Pupil */}
        </div>
        <div className="w-10 h-10 bg-white rounded-full border-2 border-gray-700 flex items-center justify-center">
          <div className={`w-5 h-5 bg-gray-800 rounded-full ${talking ? 'animate-ping delay-150' : ''}`}></div> {/* Pupil */}
        </div>
      </div>
      {/* Big round glasses outline */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 flex space-x-3 pointer-events-none">
        <div className="w-12 h-12 border-4 border-gray-700 rounded-full opacity-90 -translate-x-1"></div>
        <div className="w-12 h-12 border-4 border-gray-700 rounded-full opacity-90 translate-x-1"></div>
      </div>
      {/* A subtle glowing effect */}
      <div className={`absolute inset-0 rounded-full opacity-30 ${talking ? 'animate-ping' : ''} ${moodClasses} blur-md`}></div>
      {/* Orbii's 'O' initial, less prominent */}
      <div className="text-white text-xl font-bold opacity-50 mt-12">O</div>
    </div>
  );
};

const SpeechBubble = ({ text }: { text: string }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !text) return null; // Don't render on server or if no text

  return (
    <div className="relative bg-primary text-primary-foreground p-4 rounded-lg shadow-md max-w-md mt-4 mx-auto break-words">
      <p className="whitespace-pre-wrap">{text}</p>
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-primary"></div>
    </div>
  );
};


const MoodSelector = ({ onSelectMood }: { onSelectMood: (mood: string) => void }) => {
  const moods = [
    { value: "happy", label: "Happy", icon: <Smile className="mr-2 h-6 w-6" /> },
    { value: "neutral", label: "Okay", icon: <Meh className="mr-2 h-6 w-6" /> },
    { value: "sad", label: "Stuck", icon: <Frown className="mr-2 h-6 w-6" /> },
  ];

  return (
    <Card className="w-full mb-4 shadow-lg border border-border">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold"><Palette className="mr-2 h-5 w-5 text-primary" /> How are you feeling?</CardTitle>
        <CardDescription>Orbii will adjust to help you learn better!</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row justify-around gap-2">
        {moods.map((mood) => (
          <Button
            key={mood.value}
            variant="outline"
            className="flex-1 text-md px-4 py-3 rounded-lg shadow-sm hover:shadow-md transition-shadow hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-primary"
            onClick={() => onSelectMood(mood.value)}
            aria-label={`Select mood ${mood.label}`}
          >
            {mood.icon} {mood.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

const initialProgressData = [
  { name: 'Week 1', questions: 0, mastery: 0 },
  { name: 'Week 2', questions: 0, mastery: 0 },
  { name: 'Week 3', questions: 0, mastery: 0 },
  { name: 'Week 4', questions: 0, mastery: 0 },
];


const CheckoutForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      setError("Stripe has not loaded yet. Please try again in a moment.");
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card details not found. Please ensure the card form is visible.");
      setLoading(false);
      return;
    }
    
    // Simulate successful trial start without actual payment processing for now
    toast({
      title: "Subscription Started!",
      description: "Your free trial is active. You'll be charged $9.99/month after the trial.",
      variant: "default",
      duration: 5000,
    });
    onSuccess(); 
    setError(null);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4">
      <div className="p-3 border rounded-md bg-secondary/30">
        <Label htmlFor="card-element" className="block text-sm font-medium text-foreground mb-1">Card Details (Test Mode)</Label>
        <CardElement id="card-element" className="p-3 border rounded-md bg-background" />
      </div>
      {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <Button 
        type="submit" 
        disabled={!stripe || loading} 
        className="w-full bg-primary text-primary-foreground py-3 text-lg font-semibold rounded-md shadow-md hover:bg-primary/90 transition-colors"
        size="lg"
      >
        {loading ? <><Icons.spinner className="animate-spin mr-2" /> Processing...</> : <><Zap className="mr-2"/> Start Free Trial ($9.99/month after)</>}
      </Button>
    </form>
  );
};


export default function Home() {
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [orbiiResponse, setOrbiiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const { toast } = useToast();
  const [questionHistory, setQuestionHistory] = useState<{ question: string; answer: string }[]>([]);
  const [isVoiceChatEnabled, setIsVoiceChatEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [currentMood, setCurrentMood] = useState("neutral");
  const [adaptiveLessonPlan, setAdaptiveLessonPlan] = useState<string[] | null>(null);
  const [showLessonPlan, setShowLessonPlan] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [progressData, setProgressData] = useState(initialProgressData);
  const [estimatedMastery, setEstimatedMastery] = useState("Beginner");
  const [isGuardianView, setIsGuardianView] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [orbiiIsTalking, setOrbiiIsTalking] = useState(false);
  const [isClient, setIsClient] = useState(false);


  const [asdAnswer, setAsdAnswer] = useState<AsdTutorOutput | null>(null);
  const [studentProfile, setStudentProfile] = useState({
    grade: '',
    strengths: '',
    struggles: '',
  });

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setIsClient(true); // Component has mounted
    // Initialize SpeechRecognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false; // Listen for a single utterance
        recog.interimResults = false; // We only want final results
        recog.lang = 'en-US';

        recog.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setCurrentQuestion(transcript); // Update question input with transcript
          toast({ title: 'Voice Input Received', description: transcript });
          setIsListening(false);
          // handleSubmit(transcript); // Optionally auto-submit after voice input
        };

        recog.onerror = (event: SpeechRecognitionEventMap['error']) => {
          console.error('Speech recognition error', event.error, event.message);
          let errorMessage = `Could not understand audio: ${event.error}.`;
          if (event.error === 'no-speech') errorMessage = "Didn't hear anything. Try speaking louder?";
          if (event.error === 'network') errorMessage = "Network error with speech service. Check connection.";
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') errorMessage = "Microphone access denied. Please enable it in browser settings.";
          
          toast({ variant: 'destructive', title: 'Voice Error', description: errorMessage });
          setIsListening(false);
        };
        
        recog.onend = () => {
            setIsListening(false); // Ensure listening state is reset
        };
        recognitionRef.current = recog;
      } else {
        console.warn("Speech Recognition API not supported in this browser.");
      }
    }
  }, [toast]);


  const speakText = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setOrbiiIsTalking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9; 
      utterance.pitch = 1.1; 
      utterance.onend = () => setOrbiiIsTalking(false);
      window.speechSynthesis.cancel(); 
      window.speechSynthesis.speak(utterance);
    } else {
      toast({ title: "Speech Error", description: "Text-to-speech is not supported in this browser.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    if (isClient && !isSubscribed && !showSubscriptionModal) {
       // Only interact with localStorage on client
      const returningUser = localStorage.getItem('kindMindUserHasVisited');
      if (!returningUser) {
         getOrbiiGreeting({ isNewUser: true }).then(res => {
            setOrbiiResponse(res.response);
            if (isVoiceChatEnabled) speakText(res.response);
            localStorage.setItem('kindMindUserHasVisited', 'true');
        }).catch(error => {
            console.error("Error getting initial greeting:", error);
            toast({variant: 'destructive', title: 'Connection Error', description: 'Could not connect to Orbii.'});
        });
      } else {
        // Example: Fetch last session topic from localStorage or Firestore
        const lastTopic = localStorage.getItem('kindMindLastTopic') || "your previous learnings";
         getOrbiiGreeting({ isNewUser: false, lastSessionContext: lastTopic }).then(res => {
            setOrbiiResponse(res.response);
            if (isVoiceChatEnabled) speakText(res.response);
        }).catch(error => {
            console.error("Error getting returning greeting:", error);
            toast({variant: 'destructive', title: 'Connection Error', description: 'Could not connect to Orbii.'});
        });
      }
    }
  }, [isClient, isSubscribed, showSubscriptionModal, isVoiceChatEnabled, speakText, toast]);

  const handleStudentProfileChange = (field: keyof typeof studentProfile, value: string) => {
    setStudentProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = useCallback(async (questionToSubmit?: string) => {
    const finalQuestion = questionToSubmit || currentQuestion;
    if (!finalQuestion.trim()) {
      toast({ title: "Empty Question", description: "Please type or speak a question.", variant: "destructive" });
      return;
    }
    if (!isSubscribed) {
      setShowSubscriptionModal(true);
      toast({ variant: 'destructive', title: 'Subscription Required', description: 'Please subscribe to ask questions.' });
      return;
    }

    setLoading(true);
    setOrbiiResponse('Orbii is thinking...');
    if (isVoiceChatEnabled) speakText('Let me think about that...');
    setAdaptiveLessonPlan(null);
    setAsdAnswer(null);

    try {
      const input: OrbiiInput = {
        type: imageUrl ? 'image' : 'text',
        data: imageUrl || finalQuestion, // If image, data is image data URI, else it's the question text
        intent: 'homework_help', 
        gradeLevel: studentProfile.grade,
        learningStrengths: studentProfile.strengths,
        learningStruggles: studentProfile.struggles,
        userMood: currentMood,
        topic: "General", 
        textContextForImage: imageUrl ? finalQuestion : undefined, // if image, question is context
      };

      const result = await orbiiFlow(input);
      setOrbiiResponse(result.response);
      if (isVoiceChatEnabled) speakText(result.response);
      localStorage.setItem('kindMindLastTopic', input.topic || finalQuestion.substring(0,30) + "...");


      setQuestionHistory((prev) => [...prev, { question: finalQuestion, answer: result.response }]);

      // Generate adaptive lesson plan - Mock
      setAdaptiveLessonPlan([
        `1. Understand: ${result.response.substring(0,50)}...`,
        "2. Activity: Watch a short video about it. (Imagine a YouTube link here!)",
        "3. Practice: Let's try a related question!",
        "4. Visual: I can draw a mind map for this on the whiteboard!",
        "5. Review: What was the main idea we talked about?"
      ]);
      setShowLessonPlan(true);

      const asdRes = await asdTutor({
        question: finalQuestion,
        topic: input.topic || "General",
        currentGrades: studentProfile.grade,
        strengths: studentProfile.strengths,
        struggles: studentProfile.struggles,
        additionalNotes: `Current mood: ${currentMood}. Student is interacting via ${isVoiceChatEnabled ? 'voice' : 'text'}.`,
      });
      setAsdAnswer(asdRes);
      // Optionally speak ASD answer if different or as an add-on
      // if (isVoiceChatEnabled && asdRes.answer && asdRes.answer !== result.response) speakText("And here's another way to think about it: " + asdRes.answer);


      // Update progress (dummy update)
      setProgressData(prev => {
        const newWeekNum = prev.length > 0 ? prev.length + 1 : 1;
        const lastEntry = prev[prev.length -1] || {questions:0, mastery:0};
        const newQuestions = lastEntry.questions + Math.floor(Math.random()*2)+1; // Increase by 1 or 2
        const newMastery = Math.min(100, lastEntry.mastery + Math.floor(Math.random()*10)+5); // Increase by 5-14%
        return [...prev.slice(-3), { name: `Wk ${newWeekNum}`, questions: newQuestions, mastery: newMastery }];
      });
      const currentMasteryVal = progressData[progressData.length -1]?.mastery || 0;
      if (currentMasteryVal > 75) setEstimatedMastery("Master");
      else if (currentMasteryVal > 40) setEstimatedMastery("Proficient");
      else setEstimatedMastery("Beginner");


    } catch (error: any) {
      console.error("Error during handleSubmit:", error);
      const errorMessage = error.message || 'Oops! Orbii had a little hiccup. Please try again.';
      setOrbiiResponse(errorMessage);
      toast({ variant: 'destructive', title: 'Orbii Error', description: errorMessage });
      if (isVoiceChatEnabled) speakText(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentQuestion, imageUrl, toast, isSubscribed, studentProfile, currentMood, isVoiceChatEnabled, speakText, progressData]);


  const handleMoodSelect = (mood: string) => {
    setCurrentMood(mood);
    const moodMessages: {[key: string]: string} = {
      happy: "Great to hear you're feeling happy! Let's learn something fun!",
      neutral: "Okay, let's focus and learn something new!",
      sad: "It's okay to feel stuck sometimes. Orbii is here to help, nice and easy.",
    };
    toast({ title: "Mood Updated!", description: `Orbii will be extra ${mood === 'sad' ? 'gentle' : mood}.`, icon: mood === "happy" ? <Smile className="text-green-500"/> : mood === "neutral" ? <Meh className="text-yellow-500"/> : <Frown className="text-red-500"/> });
    setOrbiiResponse(moodMessages[mood] || "Let's get started!");
    if (isVoiceChatEnabled) speakText(moodMessages[mood] || "Let's get started!");
  };

  const handleToggleVoiceChat = () => {
    setIsVoiceChatEnabled(prev => {
      const turningOn = !prev;
      if (turningOn) {
        toast({title: "Voice Chat On", description: "Orbii will now speak responses."});
        if(orbiiResponse) speakText(orbiiResponse); // Speak current response if any
      } else {
         if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
        toast({title: "Voice Chat Off", description: "Orbii will be quiet now."});
      }
      return turningOn;
    });
  };

  const handleListen = () => {
    if (!isSubscribed) {
      setShowSubscriptionModal(true);
      return;
    }
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setOrbiiResponse("Orbii is listening...");
        toast({ title: "Listening...", description: "What's your question?" });
      } catch (e: any) {
        console.error("Error starting speech recognition:", e);
        toast({ variant: "destructive", title: "Voice Error", description: e.message || "Could not start listening. Please try again." });
        setIsListening(false);
      }
    } else if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setOrbiiResponse("Okay, processing your question!");
    } else if (!recognitionRef.current) {
        toast({ variant: "destructive", title: "Voice Error", description: "Speech recognition is not available in your browser or not allowed." });
    }
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast({variant: "destructive", title: "File too large", description: "Please upload images under 5MB."});
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        toast({ title: "Image Uploaded", description: file.name, icon: <CheckCircle className="text-green-500" /> });
      };
      reader.onerror = () => {
          toast({variant: "destructive", title: "File Error", description: "Could not read the image file."});
      };
      reader.readAsDataURL(file);
    }
  };
  
  useEffect(() => {
    const getCameraPermission = async () => {
      if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          // Toast is shown when user tries to use camera if permission is false
        }
      } else {
        console.warn('Camera API not available.');
        setHasCameraPermission(false);
      }
    };
    getCameraPermission();
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, []);

  const captureImageFromCamera = useCallback(() => {
    if (hasCameraPermission === false) {
        toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Please enable camera permissions in your browser settings. The site may also need to be served over HTTPS or localhost.' });
        return;
    }
    if (hasCameraPermission && videoRef.current && videoRef.current.readyState >= videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const capturedUrl = canvas.toDataURL('image/png');
        setImageUrl(capturedUrl);
        toast({ title: 'Image Captured!', description: 'Image from camera is ready.', icon: <CheckCircle className="text-green-500"/> });
      } else {
         toast({ variant: 'destructive', title: 'Capture Error', description: 'Could not get canvas context.' });
      }
    } else {
      toast({ variant: 'destructive', title: 'Camera Not Ready', description: 'Camera not available or video stream not ready. Please try again.' });
    }
  }, [hasCameraPermission, toast]);


  const handleTestModels = async () => {
    if (!isSubscribed) {
      setShowSubscriptionModal(true);
      return;
    }
    setLoading(true);
    setOrbiiResponse("Testing AI Models... Please wait.");
    if(isVoiceChatEnabled) speakText("Testing the AI models now.");
    try {
      const geminiResult = await testGeminiModel();
      toast({ title: "Gemini Test Result", description: geminiResult, duration: 7000 });
      const openaiResult = await testOpenAIModel();
      toast({ title: "OpenAI (GPT-4o) Test Result", description: openaiResult, duration: 7000 });
      const combinedResult = `Gemini Test:\n${geminiResult}\n\nOpenAI (GPT-4o) Test:\n${openaiResult}`;
      setOrbiiResponse(combinedResult);
      if(isVoiceChatEnabled) speakText(combinedResult);
    } catch (e: any) {
      const errorMsg = `Error during model testing: ${e.message}`;
      toast({ title: "Test Error", description: errorMsg, variant: "destructive" });
      setOrbiiResponse(errorMsg);
      if(isVoiceChatEnabled) speakText(errorMsg);
    }
    setLoading(false);
  };

  if (!isClient) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/50">
            <Mascot talking={false} mood="neutral" />
            <p className="text-xl text-foreground mt-4">Loading Orbii...</p>
        </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
    <div className="flex flex-col items-center justify-start min-h-screen py-4 bg-gradient-to-br from-background to-secondary/50 px-2 md:px-4">
      <header className="w-full max-w-3xl text-center mb-6">
        <div className="flex justify-center items-center mb-2">
         <Image src="https://picsum.photos/64/64" alt="Kind Mind Learning Logo" width={64} height={64} className="mr-3 rounded-full" data-ai-hint="brain logo"/>
          <h1 className="text-4xl font-bold text-primary">Kind Mind Learning</h1>
        </div>
        <p className="text-muted-foreground text-lg">Orbii: Your friendly AI learning companion!</p>
      </header>

      <main className="w-full max-w-3xl flex-1 flex flex-col items-center space-y-6">
        <div className="relative flex flex-col items-center mb-6 w-full">
          <Mascot talking={orbiiIsTalking} mood={currentMood} />
          {orbiiResponse && <SpeechBubble text={orbiiResponse} />}
        </div>
        
        {!isSubscribed && !showSubscriptionModal && (
           <Card className="w-full shadow-xl border-primary border-2 bg-card">
            <CardHeader>
              <CardTitle className="text-2xl text-primary flex items-center"><Zap className="mr-2 h-7 w-7"/> Unlock Full Learning Potential</CardTitle>
              <CardDescription className="text-md">Start your 1-month free trial, then $9.99/month. No credit card needed to begin your trial.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                size="lg" 
                className="w-full bg-primary text-primary-foreground py-4 text-xl font-semibold rounded-lg shadow-md hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2" 
                onClick={() => {setIsSubscribed(true); toast({title: "Free Trial Started!", description: "Enjoy full access with Orbii!", icon: <CheckCircle className="text-green-500"/>})}}
                aria-label="Start Free Trial"
              >
                <Sun className="mr-2 h-6 w-6"/> Start Free Trial
              </Button>
            </CardContent>
          </Card>
        )}

        {showSubscriptionModal && stripePromise && (
          <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
            <DialogContent className="sm:max-w-md bg-card shadow-2xl rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-primary">Subscribe to Kind Mind Learning</DialogTitle>
                <DialogDescription className="text-md">
                  Unlimited access to Orbii, personalized lesson plans, progress tracking, and more!
                </DialogDescription>
              </DialogHeader>
              <CheckoutForm onSuccess={() => { setIsSubscribed(true); setShowSubscriptionModal(false); }} />
              <DialogFooter className="mt-2">
                <DialogClose asChild>
                  <Button variant="outline" className="w-full sm:w-auto">Maybe Later</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
         {showSubscriptionModal && !stripePromise && (
             <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Subscription Unavailable</DialogTitle>
                        <DialogDescription>Stripe is not configured correctly. Please contact support.</DialogDescription>
                    </DialogHeader>
                     <DialogFooter className="mt-2">
                        <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
             </Dialog>
         )}
        
        {isSubscribed && (
          <>
            <Card className="w-full shadow-lg bg-card">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl font-semibold"><Brain className="mr-2 h-6 w-6 text-primary" /> Ask Orbii Anything!</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <MoodSelector onSelectMood={handleMoodSelect} />
                <Card className="p-4 bg-secondary/30 border">
                    <CardTitle className="text-lg mb-2">Tell Orbii about the learner:</CardTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <Label htmlFor="student-grade" className="font-medium">Grade Level</Label>
                            <Input id="student-grade" value={studentProfile.grade} onChange={(e) => handleStudentProfileChange('grade', e.target.value)} placeholder="e.g., 5th Grade" className="mt-1"/>
                        </div>
                        <div>
                            <Label htmlFor="student-strengths" className="font-medium">Learning Strengths</Label>
                            <Input id="student-strengths" value={studentProfile.strengths} onChange={(e) => handleStudentProfileChange('strengths', e.target.value)} placeholder="e.g., Visuals, Patterns" className="mt-1"/>
                        </div>
                        <div>
                            <Label htmlFor="student-struggles" className="font-medium">Learning Struggles</Label>
                            <Input id="student-struggles" value={studentProfile.struggles} onChange={(e) => handleStudentProfileChange('struggles', e.target.value)} placeholder="e.g., Long texts, Math" className="mt-1"/>
                        </div>
                    </div>
                </Card>

                <Textarea
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  placeholder="Type your question or use voice input..."
                  className="min-h-[100px] text-lg p-3 rounded-md shadow-inner border-border focus:ring-2 focus:ring-primary"
                  aria-label="Question input area"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => handleSubmit()} disabled={loading || isListening} className="flex-1 bg-primary text-primary-foreground py-3 text-lg font-semibold rounded-md shadow-md hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2">
                    <Bot className="mr-2 h-5 w-5" /> {loading ? 'Orbii is thinking...' : 'Ask Orbii'}
                  </Button>
                  <Button onClick={handleListen} variant="secondary" className={`flex-1 py-3 text-lg font-semibold rounded-md shadow-md ${isListening ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-primary'}`}>
                    <Mic className="mr-2 h-5 w-5" /> {isListening ? 'Listening...' : 'Speak to Orbii'}
                  </Button>
                </div>
                 <Card className="p-4 bg-secondary/30 border">
                    <CardTitle className="text-lg mb-3 text-center">Got Homework with Pictures?</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Label htmlFor="image-upload" className="flex-1 flex items-center justify-center cursor-pointer text-primary hover:underline border-2 border-dashed border-primary rounded-md p-4 hover:bg-primary/10 transition-colors">
                            <Upload className="mr-2 h-6 w-6" /> Upload Image File
                        </Label>
                        <Input id="image-upload" type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="flex-1 text-lg py-3"><Camera className="mr-2 h-6 w-6"/> Use Camera</Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card">
                                <DialogHeader><DialogTitle className="text-xl">Live Camera Capture</DialogTitle></DialogHeader>
                                {hasCameraPermission === null && <p className="text-center p-4">Requesting camera permission...</p>}
                                {hasCameraPermission === false && <Alert variant="destructive" className="my-4"><AlertTitle>Camera Access Denied</AlertTitle><AlertDescription>Please grant camera access in your browser settings. For camera usage, this site may need to be served over HTTPS or localhost.</AlertDescription></Alert>}
                                {hasCameraPermission && <video ref={videoRef} className="w-full rounded-md aspect-video bg-black" autoPlay playsInline muted />}
                                <DialogFooter>
                                    <Button onClick={captureImageFromCamera} disabled={!hasCameraPermission || loading} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                                      <Camera className="mr-2"/> Capture Photo
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                 </Card>
                {imageUrl && (
                  <div className="mt-2 p-2 border rounded-md bg-secondary/20">
                    <p className="text-sm text-muted-foreground mb-1">Image Preview:</p>
                    <Image src={imageUrl} alt="Homework Preview" width={200} height={150} style={{ objectFit: 'contain', maxHeight: '150px', width: 'auto' }} className="rounded-md border shadow-sm mx-auto" />
                    <Button variant="ghost" size="sm" onClick={() => setImageUrl('')} className="text-xs text-destructive hover:text-destructive/80 mt-1 block mx-auto">
                        <XCircle className="inline mr-1 h-3 w-3"/> Clear Image
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {adaptiveLessonPlan && showLessonPlan && (
              <Card className="w-full shadow-lg bg-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center text-xl font-semibold"><FileText className="mr-2 h-5 w-5 text-primary" /> Adaptive Lesson Plan</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowLessonPlan(false)} aria-label="Hide lesson plan">
                    <XCircle className="h-5 w-5 text-muted-foreground hover:text-foreground"/>
                  </Button>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2 text-md">
                    {adaptiveLessonPlan.map((step, i) => (
                      <li key={i} className="leading-relaxed">
                        {step.includes("http") || step.includes("www.") ? 
                          <a href={step.substring(step.indexOf("http"))} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline hover:text-accent/80 transition-colors">
                            {step.substring(0, step.indexOf("http"))} <PlayCircle className="inline h-4 w-4 ml-1"/> Link
                          </a> : 
                        step}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
             {!showLessonPlan && orbiiResponse && adaptiveLessonPlan && (
                <Button onClick={() => setShowLessonPlan(true)} variant="link" className="text-primary text-lg font-semibold hover:underline">
                    <FileText className="mr-2 h-5 w-5"/> Show Lesson Plan
                </Button>
            )}


            <Dialog open={isWhiteboardOpen} onOpenChange={setIsWhiteboardOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full py-3 text-lg font-semibold rounded-md shadow-md hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-primary"><Palette className="mr-2 h-5 w-5"/> Open Mind Map Whiteboard</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl w-[90vw] h-[85vh] p-0 flex flex-col bg-card">
                <DialogHeader className="p-4 border-b">
                  <DialogTitle className="text-xl font-bold text-primary">Orbii's Interactive Whiteboard</DialogTitle>
                  <DialogDescription>Let's visualize and learn together! Orbii might suggest drawings based on the topic.</DialogDescription>
                </DialogHeader>
                <div className="flex-grow"> 
                    <iframe src="https://excalidraw.com/" title="Excalidraw Whiteboard" width="100%" height="100%" frameBorder="0" className="rounded-b-md"></iframe>
                </div>
              </DialogContent>
            </Dialog>

            <Card className="w-full shadow-lg bg-card">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold"><BarChart3 className="mr-2 h-5 w-5 text-primary" /> Progress Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-md">Total Questions Asked: <span className="font-bold text-primary">{questionHistory.length}</span></p>
                <p className="text-md">Estimated Mastery: <span className="font-bold text-accent">{estimatedMastery}</span></p>
                <div className="h-72 mt-4"> {/* Increased height for better visibility */}
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressData} margin={{ top: 5, right: 20, left: -25, bottom: 5 }}> {/* Adjusted left margin */}
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--foreground))" tick={{fontSize: 12}} />
                      <YAxis stroke="hsl(var(--foreground))" tick={{fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }} 
                        labelStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: 'bold' }}
                        itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                      />
                      <Legend wrapperStyle={{fontSize: 12}}/>
                      <Line type="monotone" dataKey="questions" name="Questions/Week" stroke="hsl(var(--primary))" strokeWidth={3} activeDot={{ r: 7 }} dot={{r: 4}}/>
                      <Line type="monotone" dataKey="mastery" name="Mastery %" stroke="hsl(var(--accent))" strokeWidth={3} activeDot={{ r: 7 }} dot={{r: 4}}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="w-full shadow-lg bg-card">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl font-semibold"><Settings className="mr-2 h-5 w-5 text-primary"/>Guardian & App Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-md border">
                        <Label htmlFor="guardian-view" className="text-lg font-medium">Enable Guardian View</Label>
                        <Switch id="guardian-view" checked={isGuardianView} onCheckedChange={setIsGuardianView} aria-label="Toggle Guardian View"/>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-md border">
                        <Label htmlFor="voice-chat-toggle" className="text-lg font-medium">Enable Voice Chat (TTS)</Label>
                        <Switch id="voice-chat-toggle" checked={isVoiceChatEnabled} onCheckedChange={handleToggleVoiceChat} aria-label="Toggle Voice Chat"/>
                    </div>
                    <Button onClick={handleTestModels} className="w-full py-3 text-lg font-semibold rounded-md shadow-md" variant="outline"><Zap className="mr-2 h-5 w-5"/>Test AI Models</Button>
                </CardContent>
            </Card>

            {isGuardianView && (
              <Card className="w-full shadow-lg border-accent border-2 bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl font-semibold text-accent"><UserCog className="mr-2 h-6 w-6"/> Guardian Dashboard</CardTitle>
                  <CardDescription>Insights into the student's learning journey.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-md">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Recent Activity (Last 3):</h3>
                    {questionHistory.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                        {questionHistory.slice(-3).map((item, i) => <li key={i}>Q: "{item.question.substring(0,40)}..." <br/> <span className="text-muted-foreground">A: "{item.answer.substring(0,50)}..."</span></li>)}
                        </ul>
                    ) : <p className="text-sm text-muted-foreground">No questions asked yet.</p>}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Student Mood Patterns:</h3>
                    <p className="text-sm">Current session mood: <span className="font-bold capitalize">{currentMood}</span>. (More detailed historical mood tracking planned!)</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Tips for Supporting Autistic Learners:</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                        <li>Use clear, direct, and concise language.</li>
                        <li>Break down complex tasks into smaller, manageable steps.</li>
                        <li>Establish routines and provide predictable structures.</li>
                        <li>Offer frequent positive reinforcement and specific praise.</li>
                        <li>Utilize visual aids, timers, and checklists.</li>
                        <li>Be patient and allow for extra processing time.</li>
                        <li>Minimize sensory distractions during learning.</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}


          </>
        )}
      </main>

      <footer className="w-full max-w-3xl mt-10 pt-6 border-t border-border text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} Kind Mind Learning. All rights reserved.</p>
        <p className="mt-1">Empowering neurodiverse learners with Orbii, their AI friend.</p>
         <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
            {isSubscribed && <Button variant="link" className="text-primary hover:underline" onClick={() => setShowSubscriptionModal(true)}>Manage Subscription</Button>}
            <Button variant="link" className="text-primary hover:underline">Terms of Service</Button>
            <Button variant="link" className="text-primary hover:underline">Privacy Policy</Button>
        </div>
      </footer>
    </div>
    </Elements>
  );
}
