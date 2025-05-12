// ✅ Orbii's upgraded page.tsx with Genkit brain integration and UI Revamp

'use client';

import { useState, useCallback, useRef, useEffect, type CSSProperties } from 'react';
import {
  getOrbiiGreeting,
  orbiiFlow,
  type OrbiiInput,
  type OrbiiOutput,
} from '@/ai/flows/orbiiFlow';
import { generateLessonPlan, type GenerateLessonPlanOutput } from '@/ai/flows/generate-lesson-plan';
import { generateProgressReport, type GenerateProgressReportOutput } from '@/ai/flows/generate-progress-report';
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
import { Camera, Speech, Upload, Bot, Brain, Palette, BarChart3, UserCog, DollarSign, Settings, PlayCircle, FileText, Smile, Meh, Frown, Sun, Zap, CheckCircle, XCircle, Mic, BookOpen, Award, Headphones, Sparkles, Send, Wind } from 'lucide-react';
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
import { asdTutor, type AsdTutorOutput } from '@/ai/flows/asd-tutor-flow';
import { testGeminiModel, testOpenAIModel } from '@/ai/testActions';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

if (!stripePromise && typeof window !== 'undefined') { 
  console.error("Stripe public key is not defined in .env.local NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY. Stripe functionality will be disabled.");
}

// Orbii Mascot Component
const OrbiiMascot = ({ talking, mood, isLoading }: { talking: boolean; mood: string; isLoading: boolean }) => {
  const [isClientMascot, setIsClientMascot] = useState(false);
  useEffect(() => {
    setIsClientMascot(true);
  }, []);

  if (!isClientMascot) {
    return <div className="w-40 h-40 bg-gray-200 rounded-full animate-pulse mx-auto shadow-lg" data-ai-hint="robot mascot"></div>;
  }

  let moodBgColor = 'bg-primary'; // Default color (calm teal)
  let eyeShape = 'rounded-full';
  let mouthShape = 'w-10 h-3 bg-primary-foreground/70 rounded-sm'; // Neutral mouth

  if (isLoading) {
    moodBgColor = 'bg-secondary animate-pulse'; // Pulsing gray when thinking
    eyeShape = 'w-5 h-2 bg-primary-foreground/70 rounded-sm animate-ping'; // Blinking/thinking eyes
    mouthShape = 'w-8 h-2 bg-primary-foreground/50 rounded-full'; // Thin line for thinking
  } else {
    switch (mood) {
      case 'happy':
        moodBgColor = 'bg-green-400'; // Brighter green for happy
        eyeShape = 'w-6 h-6 bg-primary-foreground rounded-full'; // Wide eyes
        mouthShape = 'w-12 h-6 bg-primary-foreground/80 rounded-t-full border-b-4 border-primary-foreground/80'; // Smile
        break;
      case 'sad':
      case 'frustrated':
        moodBgColor = 'bg-red-400'; // Softer red for sad/frustrated
        eyeShape = 'w-6 h-4 bg-primary-foreground rounded-sm'; // Squinted/sad eyes
        mouthShape = 'w-10 h-3 bg-primary-foreground/70 rounded-b-full border-t-2 border-primary-foreground/70'; // Frown
        break;
      case 'neutral':
      default:
        moodBgColor = 'bg-primary'; // Calm teal
        eyeShape = 'w-6 h-6 bg-primary-foreground rounded-full';
        mouthShape = 'w-10 h-3 bg-primary-foreground/70 rounded-sm';
        break;
    }
  }

  return (
    <div className={`relative w-40 h-40 rounded-full shadow-xl transition-all duration-300 ease-in-out ${moodBgColor} flex flex-col items-center justify-center transform ${talking ? 'scale-105 animate-bounce' : 'scale-100'} mx-auto border-4 border-white overflow-hidden`}
      style={{'--bounce-amount': talking ? '5px' : '0px'} as CSSProperties}
    >
      {/* Eyes */}
      <div className="flex space-x-5 mb-2">
        <div className={`transition-all duration-300 ${eyeShape} ${isLoading ? '' : 'border-2 border-primary-foreground/50'}`}></div>
        <div className={`transition-all duration-300 ${eyeShape} ${isLoading ? '' : 'border-2 border-primary-foreground/50'}`}></div>
      </div>
      {/* Mouth */}
      <div className={`transition-all duration-300 ${mouthShape} ${talking ? 'animate-pulse' : ''}`}></div>
      
      {/* Subtle shine/reflection */}
      <div className="absolute top-4 left-8 w-8 h-8 bg-white/30 rounded-full blur-sm"></div>
      {!isLoading && <Sparkles className="absolute bottom-4 right-4 w-6 h-6 text-white/70 animate-ping opacity-50" />}
    </div>
  );
};


const SpeechBubble = ({ text, isUser }: { text: string; isUser?: boolean }) => {
  const [isClientBubble, setIsClientBubble] = useState(false);
  useEffect(() => {
    setIsClientBubble(true);
  }, []);

  if (!isClientBubble || !text) return null;

  const bubbleClasses = isUser 
    ? "bg-accent text-accent-foreground self-end" 
    : "bg-card text-card-foreground self-start";
  const tailClasses = isUser
    ? "absolute right-0 -bottom-2 w-0 h-0 border-l-8 border-l-transparent border-r-0 border-t-8 border-t-accent transform translate-x-1/2"
    : "absolute left-0 -bottom-2 w-0 h-0 border-r-8 border-r-transparent border-l-0 border-t-8 border-t-card transform -translate-x-1/2";

  return (
    <div className={`relative ${bubbleClasses} p-4 rounded-lg shadow-md max-w-md mt-4 mx-auto break-words w-auto inline-block clear-both mb-2`}>
      <p className="whitespace-pre-wrap text-left">{text}</p> {/* Ensure text aligns left for readability */}
      <div className={tailClasses}></div>
    </div>
  );
};


const MoodSelector = ({ onSelectMood, currentMood }: { onSelectMood: (mood: string) => void; currentMood: string }) => {
  const moods = [
    { value: "happy", label: "Feeling Great!", icon: <Smile className="mr-2 h-6 w-6" />, color: "text-green-500", bgColor: "hover:bg-green-100 dark:hover:bg-green-700" },
    { value: "neutral", label: "I'm Okay", icon: <Meh className="mr-2 h-6 w-6" />, color: "text-yellow-500", bgColor: "hover:bg-yellow-100 dark:hover:bg-yellow-700" },
    { value: "frustrated", label: "A Bit Stuck", icon: <Frown className="mr-2 h-6 w-6" />, color: "text-red-500", bgColor: "hover:bg-red-100 dark:hover:bg-red-700" },
  ];

  return (
    <Card className="w-full mb-6 shadow-lg border border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold"><Palette className="mr-3 h-6 w-6 text-primary" /> How are you feeling right now?</CardTitle>
        <CardDescription>Let Orbii know so I can help you best!</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row justify-around gap-3 p-4">
        {moods.map((mood) => (
          <Button
            key={mood.value}
            variant={currentMood === mood.value ? "default" : "outline"}
            className={`flex-1 text-md px-4 py-6 rounded-lg shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105 focus:ring-2 focus:ring-primary ${mood.bgColor} ${currentMood === mood.value ? 'ring-2 ring-primary bg-primary/20' : ''}`}
            onClick={() => onSelectMood(mood.value)}
            aria-pressed={currentMood === mood.value}
            aria-label={`Select mood: ${mood.label}`}
          >
            {React.cloneElement(mood.icon, {className: `mr-2 h-8 w-8 ${mood.color}`})} 
            <span className="text-lg">{mood.label}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

const initialProgressData = [
  { name: 'Start', questions: 0, mastery: 0, points: 0 },
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
    
    // In a real app, you'd call your backend to create a checkout session/subscription here
    // For this demo, we simulate success
    toast({
      title: "Free Trial Activated!",
      description: "You now have full access to KindMind Learning. You'll be reminded before your trial ends. ($9.99/month after trial)",
      variant: "default",
      duration: 7000,
      action: <CheckCircle className="text-green-500"/>
    });
    onSuccess(); 
    setError(null);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4">
       <Alert variant="default" className="bg-primary/10 border-primary/30">
        <Zap className="h-5 w-5 text-primary" />
        <AlertTitle className="font-semibold text-primary">Unlock Premium Access</AlertTitle>
        <AlertDescription>
          Start your 1-month free trial today! After your trial, KindMind Learning is just $9.99 per month.
          <br/>No credit card is needed to start the trial for this demo.
        </AlertDescription>
      </Alert>
      {/* CardElement would go here in a real integration, but removed for this demo as no actual payment processing. */}
      {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <Button 
        type="submit" 
        disabled={loading} 
        className="w-full bg-accent text-accent-foreground py-4 text-xl font-semibold rounded-lg shadow-md hover:bg-accent/90 transition-colors transform hover:scale-105"
        size="lg"
      >
        {loading ? <><Icons.spinner className="animate-spin mr-2" /> Processing...</> : <><Sparkles className="mr-2 h-6 w-6"/> Start My Free Trial!</>}
      </Button>
    </form>
  );
};

const AppContent = () => {
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [orbiiResponse, setOrbiiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const { toast } = useToast();
  const [userMessages, setUserMessages] = useState<string[]>([]); // Store user messages
  const [orbiiMessages, setOrbiiMessages] = useState<string[]>([]); // Store Orbii messages

  const [isVoiceChatEnabled, setIsVoiceChatEnabled] = useState(false);
  const [orbiiIsTalking, setOrbiiIsTalking] = useState(false); // For mascot animation
  const [userIsSpeaking, setUserIsSpeaking] = useState(false); // For microphone visual feedback

  const [currentMood, setCurrentMood] = useState("neutral");
  const [adaptiveLessonPlan, setAdaptiveLessonPlan] = useState<GenerateLessonPlanOutput | null>(null);
  const [showLessonPlan, setShowLessonPlan] = useState(false);
  
  const [progressData, setProgressData] = useState(initialProgressData);
  const [totalPoints, setTotalPoints] = useState(0);
  const [masteryLevel, setMasteryLevel] = useState("Beginner");

  const [isGuardianView, setIsGuardianView] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false); // Default to false
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [asdAnswer, setAsdAnswer] = useState<AsdTutorOutput | null>(null);
  const [studentProfile, setStudentProfile] = useState({
    grade: '',
    strengths: '',
    struggles: '',
  });

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<null | HTMLDivElement>(null); // For scrolling chat

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [userMessages, orbiiMessages]);

  const speakText = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isVoiceChatEnabled) {
      setOrbiiIsTalking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      // Try to find a child-friendly or gentle voice
      let chosenVoice = voices.find(voice => voice.name.includes('Google US English') && voice.lang.startsWith('en-US'));
      if (!chosenVoice) chosenVoice = voices.find(voice => voice.lang.startsWith('en-US')); // Fallback to any US English
      if (chosenVoice) utterance.voice = chosenVoice;
      
      utterance.lang = 'en-US';
      utterance.rate = 0.9; 
      utterance.pitch = 1.2; // Slightly higher pitch, can sound friendlier
      utterance.onend = () => setOrbiiIsTalking(false);
      window.speechSynthesis.cancel(); 
      window.speechSynthesis.speak(utterance);
    } else if (isVoiceChatEnabled) {
      toast({ title: "Speech Error", description: "Text-to-speech is not supported in this browser or is disabled.", variant: "destructive" });
    }
  }, [toast, isVoiceChatEnabled]);

  const memoizedGetOrbiiGreeting = useCallback(getOrbiiGreeting, []);

  useEffect(() => {
    // Only show initial greeting if not subscribed and not already in subscription flow
    if (!isSubscribed && !showSubscriptionModal && orbiiMessages.length === 0) {
       const returningUser = localStorage.getItem('kindMindUserHasVisited');
      if (!returningUser) {
         memoizedGetOrbiiGreeting({ isNewUser: true }).then(res => {
            setOrbiiMessages(prev => [...prev, res.response]);
            speakText(res.response);
            localStorage.setItem('kindMindUserHasVisited', 'true');
        }).catch(error => {
            console.error("Error getting initial greeting:", error);
            setOrbiiMessages(prev => [...prev, 'Hi! I had a little trouble starting up. Please try refreshing!']);
            toast({variant: 'destructive', title: 'Connection Error', description: 'Could not connect to Orbii.'});
        });
      } else {
        const lastTopic = localStorage.getItem('kindMindLastTopic') || "where we left off";
         memoizedGetOrbiiGreeting({ isNewUser: false, lastSessionContext: lastTopic }).then(res => {
            setOrbiiMessages(prev => [...prev, res.response]);
            speakText(res.response);
        }).catch(error => {
            console.error("Error getting returning greeting:", error);
            setOrbiiMessages(prev => [...prev, 'Welcome back! I had a little trouble starting up. Please try refreshing!']);
            toast({variant: 'destructive', title: 'Connection Error', description: 'Could not connect to Orbii.'});
        });
      }
    }
  }, [isSubscribed, showSubscriptionModal, speakText, toast, memoizedGetOrbiiGreeting, orbiiMessages.length]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = 'en-US';

        recog.onstart = () => {
          setUserIsSpeaking(true);
        };

        recog.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setCurrentQuestion(transcript); // Set to input field for confirmation
          toast({ title: 'Voice Input Received', description: `Orbii heard: "${transcript}"`, icon: <Mic className="text-primary"/> });
          setUserIsSpeaking(false);
          // Automatically submit if confidence is high enough (optional)
          // handleSubmit(transcript); 
        };

        recog.onerror = (event: SpeechRecognitionEventMap['error']) => {
          console.error('Speech recognition error', event.error, event.message);
          let errorMessage = `Could not understand audio.`;
          if (event.error === 'no-speech') errorMessage = "I didn't hear anything. Could you try speaking a bit louder?";
          else if (event.error === 'network') errorMessage = "There's a network issue with the speech service. Please check your connection.";
          else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') errorMessage = "Microphone access is not allowed. Please enable it in your browser settings.";
          else if (event.error === 'aborted') errorMessage = "Voice input was stopped. Try again?"
          else errorMessage = `Voice input error: ${event.error}. Try again?`
          
          toast({ variant: 'destructive', title: 'Voice Input Error', description: errorMessage, duration: 5000 });
          setUserIsSpeaking(false);
        };
        
        recog.onend = () => {
            setUserIsSpeaking(false); 
        };
        recognitionRef.current = recog;
      } else {
        console.warn("Speech Recognition API not supported in this browser.");
        toast({variant: 'destructive', title: 'Unsupported Browser', description: "Voice input is not available on this browser."})
      }
    }
  }, [toast]);


  const handleStudentProfileChange = (field: keyof typeof studentProfile, value: string) => {
    setStudentProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = useCallback(async (questionToSubmit?: string) => {
    const finalQuestion = questionToSubmit || currentQuestion;
    if (!finalQuestion.trim() && !imageUrl) { // Allow submission if only image is present
      toast({ title: "It's Quiet!", description: "Please type or speak a question, or upload an image.", variant: "default", icon: <Headphones className="text-primary"/>});
      return;
    }
    if (!isSubscribed) {
      setShowSubscriptionModal(true);
      toast({ variant: 'destructive', title: 'Subscription Required', description: 'Please subscribe to ask questions and use premium features.' });
      return;
    }

    setLoading(true);
    setUserMessages(prev => [...prev, finalQuestion || "Image submitted"]); // Add user's question to chat
    setOrbiiMessages(prev => [...prev, 'Orbii is thinking...']); // Placeholder for Orbii's response
    speakText('Let me think about that for you...');
    setAdaptiveLessonPlan(null); // Clear previous lesson plan
    setAsdAnswer(null); // Clear previous ASD answer
    setCurrentQuestion(''); // Clear input field
    // setImageUrl(''); // Optionally clear image after submission

    try {
      const input: OrbiiInput = {
        type: imageUrl ? 'image' : 'text',
        data: imageUrl ? imageUrl : finalQuestion, // Send image data URI if present, else text
        intent: 'homework_help', 
        gradeLevel: studentProfile.grade || undefined,
        learningStrengths: studentProfile.strengths || undefined,
        learningStruggles: studentProfile.struggles || undefined,
        userMood: currentMood,
        topic: "General Inquiry", // More specific topic can be derived or asked
        textContextForImage: imageUrl ? finalQuestion : undefined, // Text accompanying image
        isNewUser: !localStorage.getItem('kindMindUserHasVisited'),
        lastSessionContext: localStorage.getItem('kindMindLastTopic') || undefined,
      };

      const result = await orbiiFlow(input);
      setOrbiiMessages(prev => [...prev.slice(0, -1), result.response]); // Replace placeholder
      speakText(result.response);
      localStorage.setItem('kindMindLastTopic', input.topic || finalQuestion.substring(0,30) + "...");

      // Rewards
      const pointsEarned = Math.floor(Math.random() * 5) + 5; // Random points 5-10
      setTotalPoints(prev => prev + pointsEarned);
      toast({ title: "Great Question!", description: `You earned ${pointsEarned} points! Orbii is proud of you!`, icon: <Award className="text-yellow-500"/>});
      
      const lessonPlanInput = {
        topic: input.topic || finalQuestion.substring(0, 30) + "...",
        studentLevel: studentProfile.grade || "Intermediate",
        learningStyle: studentProfile.strengths || "Visual and Interactive", 
      };
      const lp = await generateLessonPlan(lessonPlanInput);
      setAdaptiveLessonPlan(lp);
      setShowLessonPlan(true); // Auto-show lesson plan

      const asdRes = await asdTutor({
        question: finalQuestion,
        topic: input.topic || "General Topic",
        currentGrades: studentProfile.grade,
        strengths: studentProfile.strengths,
        struggles: studentProfile.struggles,
        additionalNotes: `Current mood: ${currentMood}. Learner is interacting via ${isVoiceChatEnabled ? 'voice' : 'text'}. Please be extra patient and clear.`,
      });
      setAsdAnswer(asdRes);

      // Update Progress Data
      setProgressData(prev => {
        const newWeekNum = prev.length; // Number of entries represents "weeks" or sessions
        const lastEntry = prev[prev.length -1] || {questions:0, mastery:0, points:0};
        const newQuestions = lastEntry.questions + 1;
        const newMastery = Math.min(100, lastEntry.mastery + Math.floor(Math.random()*8)+2); 
        return [...prev.slice(-9), { name: `S${newWeekNum}`, questions: newQuestions, mastery: newMastery, points: totalPoints + pointsEarned }];
      });
      const currentMasteryVal = progressData[progressData.length -1]?.mastery || 0;
      if (currentMasteryVal > 75) setMasteryLevel("Expert Explorer");
      else if (currentMasteryVal > 40) setMasteryLevel("Clever Creator");
      else if (currentMasteryVal > 10) setMasteryLevel("Curious Learner");
      else setMasteryLevel("Brave Beginner");

    } catch (error: any) {
      console.error("Error during handleSubmit:", error);
      const errorMessage = error.message || 'Oops! Orbii had a little brain-spark. Could you try asking that again?';
      setOrbiiMessages(prev => [...prev.slice(0, -1), errorMessage]);
      toast({ variant: 'destructive', title: 'Orbii Error', description: errorMessage });
      speakText(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentQuestion, imageUrl, toast, isSubscribed, studentProfile, currentMood, isVoiceChatEnabled, speakText, progressData, totalPoints]);


  const handleMoodSelect = (mood: string) => {
    setCurrentMood(mood);
    const moodMessages: {[key: string]: string} = {
      happy: "That's wonderful to hear you're feeling happy! Let's make learning super fun today!",
      neutral: "Okay, feeling steady! We can focus and learn something amazing together.",
      frustrated: "It's totally okay to feel a bit stuck or frustrated. Orbii is here to help, and we can go at your pace, nice and easy.",
    };
    const selectedMessage = moodMessages[mood] || "Thanks for sharing! Let's get started with your learning adventure!";
    
    // Add mood change to Orbii's chat
    setOrbiiMessages(prev => [...prev, `Orbii notes: You're feeling ${mood}. ${selectedMessage}`]);
    speakText(selectedMessage);
    
    toast({ 
        title: "Orbii understands!", 
        description: `Adjusting to help you learn best while you're feeling ${mood}.`, 
        icon: mood === "happy" ? <Smile className="text-green-500 h-6 w-6"/> : mood === "frustrated" ? <Frown className="text-red-500 h-6 w-6"/> : <Meh className="text-yellow-500 h-6 w-6"/>,
        duration: 4000
    });
  };

  const handleToggleVoiceChat = () => {
    setIsVoiceChatEnabled(prev => {
      const turningOn = !prev;
      if (turningOn) {
        toast({title: "Voice Chat ON", description: "Orbii will now speak responses out loud.", icon: <Speech className="text-primary"/>});
        // Speak the last Orbii message if turning on and messages exist
        if(orbiiMessages.length > 0) speakText(orbiiMessages[orbiiMessages.length - 1]); 
      } else {
         if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
        toast({title: "Voice Chat OFF", description: "Orbii will be quiet now. Click again to turn on voice.", icon: <Speech className="text-muted-foreground"/>});
      }
      return turningOn;
    });
  };

  const handleListen = () => {
    if (!isSubscribed) {
      setShowSubscriptionModal(true);
       toast({ variant: 'destructive', title: 'Subscription Required', description: 'Voice input is a premium feature. Please subscribe.' });
      return;
    }
    if (recognitionRef.current && !userIsSpeaking) {
      try {
        recognitionRef.current.start();
        // Orbii doesn't need to say "listening" here as the button state indicates it
      } catch (e: any) {
        console.error("Error starting speech recognition:", e);
        toast({ variant: "destructive", title: "Voice Error", description: e.message || "Could not start listening. Please try again or check microphone permissions." });
        setUserIsSpeaking(false);
      }
    } else if (userIsSpeaking && recognitionRef.current) {
      recognitionRef.current.stop(); // User manually stops listening
      setUserIsSpeaking(false);
    } else if (!recognitionRef.current) {
        toast({ variant: "destructive", title: "Voice Error", description: "Speech recognition is not available in your browser or permission was denied." });
    }
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
          toast({variant: "destructive", title: "File Too Large!", description: "Please upload images under 5MB so Orbii can see them clearly."});
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        toast({ title: "Image Ready!", description: `Orbii can now see: ${file.name}`, icon: <CheckCircle className="text-green-500" /> });
      };
      reader.onerror = () => {
          toast({variant: "destructive", title: "Oops!", description: "Orbii couldn't quite see that image. Please try again."});
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
          // Toast for camera permission denial is handled in captureImageFromCamera if user tries to use it
        }
      } else {
        console.warn('Camera API not available.');
        setHasCameraPermission(false);
      }
    };
    getCameraPermission();
    // Cleanup function to stop camera stream when component unmounts
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, []);

  const captureImageFromCamera = useCallback(() => {
    if (hasCameraPermission === false) {
        toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Please enable camera permissions in your browser settings. KindMind needs this to see your homework! (The site may also need to be served over HTTPS or localhost for camera access).', duration: 7000 });
        return;
    }
    if (hasCameraPermission === null) {
        toast({ variant: 'default', title: 'Camera Permission', description: 'Still checking camera permission, please wait a moment or try again.', duration: 3000 });
        return;
    }

    if (videoRef.current && videoRef.current.readyState >= videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const capturedUrl = canvas.toDataURL('image/png');
        setImageUrl(capturedUrl);
        toast({ title: 'Photo Snapped!', description: 'Orbii can now see your homework from the camera.', icon: <CheckCircle className="text-green-500"/> });
      } else {
         toast({ variant: 'destructive', title: 'Capture Error', description: 'Hmm, the camera capture didn\'t work. Try again?' });
      }
    } else {
      toast({ variant: 'destructive', title: 'Camera Not Ready', description: 'Your camera isn\'t quite ready. Please make sure it\'s connected and try again in a moment.' });
    }
  }, [hasCameraPermission, toast]);


  const handleTestModels = async () => {
    if (!isSubscribed) {
      setShowSubscriptionModal(true);
       toast({ variant: 'destructive', title: 'Subscription Required', description: 'This feature is for subscribed users.' });
      return;
    }
    setLoading(true);
    setOrbiiMessages(prev => [...prev, "Orbii is testing the AI models... One moment!"]);
    speakText("Okay, I'm running a quick check on my brain connections!");
    try {
      const geminiResult = await testGeminiModel();
      toast({ title: "Gemini Model Test", description: geminiResult, duration: 7000, icon: <Brain className="text-primary"/> });
      const openaiResult = await testOpenAIModel();
      toast({ title: "OpenAI (GPT-4o) Model Test", description: openaiResult, duration: 7000, icon: <Brain className="text-accent"/> });
      
      const combinedResult = `Orbii's AI Brain Check:\n\nGemini Status: ${geminiResult.includes("Success") ? "✅ Online" : "⚠️ Issues"}\nOpenAI (GPT-4o) Status: ${openaiResult.includes("Success") ? "✅ Online" : "⚠️ Issues"}\n\nFull details in the pop-up notifications!`;
      setOrbiiMessages(prev => [...prev.slice(0,-1), combinedResult]);
      speakText(combinedResult);
    } catch (e: any) {
      const errorMsg = `Oh dear, something went wrong during the AI model tests: ${e.message}`;
      toast({ title: "Test Error", description: errorMsg, variant: "destructive" });
      setOrbiiMessages(prev => [...prev.slice(0,-1), errorMsg]);
      speakText(errorMsg);
    }
    setLoading(false);
  };

  const [showCalmCorner, setShowCalmCorner] = useState(false);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-6 bg-gradient-to-br from-background to-secondary/30 px-2 sm:px-4 md:px-6">
      <header className="w-full max-w-4xl text-center mb-8">
        <div className="flex justify-center items-center mb-3">
         <Image src="https://picsum.photos/80/80" alt="Kind Mind Learning Logo" width={80} height={80} className="mr-4 rounded-2xl shadow-md" data-ai-hint="brain logo"/>
          <h1 className="text-5xl font-bold text-primary tracking-tight">Kind Mind Learning</h1>
        </div>
        <p className="text-muted-foreground text-xl">With Orbii: Your Friendly AI Learning Companion!</p>
      </header>

      <main className="w-full max-w-4xl flex-1 flex flex-col items-center space-y-6">
        <div className="relative flex flex-col items-center mb-6 w-full">
          <OrbiiMascot talking={orbiiIsTalking} mood={currentMood} isLoading={loading && orbiiMessages[orbiiMessages.length -1] === 'Orbii is thinking...'} />
          {/* Chat area */}
          <Card className="w-full max-w-2xl mt-4 shadow-xl bg-card h-[300px] overflow-y-auto p-4 flex flex-col space-y-3 rounded-xl">
            {orbiiMessages.map((msg, index) => (
              <SpeechBubble key={`orbii-${index}`} text={msg} />
            ))}
            {userMessages.map((msg, index) => (
               // This is a simplified display. In a real chat, user/Orbii messages would be interleaved by timestamp.
               // For this demo, showing user messages separately after Orbii's for simplicity.
              <SpeechBubble key={`user-${index}`} text={msg} isUser />
            ))}
             <div ref={chatEndRef} />
          </Card>
        </div>
        
        {!isSubscribed && !showSubscriptionModal && (
           <Card className="w-full max-w-2xl shadow-xl border-primary border-2 bg-card p-2 sm:p-4 rounded-xl">
            <CardHeader>
              <CardTitle className="text-3xl text-accent flex items-center"><Zap className="mr-3 h-8 w-8"/> Unlock Orbii's Full Power!</CardTitle>
              <CardDescription className="text-lg text-muted-foreground mt-1">Start your 1-month free trial to access all features. Then, it's just $9.99/month. No credit card needed for the trial in this demo!</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                size="lg" 
                className="w-full bg-accent text-accent-foreground py-5 text-2xl font-semibold rounded-lg shadow-md hover:bg-accent/90 focus:ring-2 focus:ring-accent focus:ring-offset-2 transform hover:scale-105 transition-transform" 
                onClick={() => {setIsSubscribed(true); toast({title: "Free Trial Started!", description: "Wonderful! You now have full access to learn with Orbii!", icon: <Sparkles className="text-yellow-400 h-6 w-6"/>, duration: 5000})}}
                aria-label="Start Free Trial"
              >
                <Sun className="mr-3 h-7 w-7"/> Start My Free Trial
              </Button>
            </CardContent>
          </Card>
        )}

        {showSubscriptionModal && stripePromise && (
          <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
            <DialogContent className="sm:max-w-lg bg-card shadow-2xl rounded-xl p-0">
              <DialogHeader className="p-6 pb-4">
                <DialogTitle className="text-2xl font-bold text-primary">Join KindMind Learning Premium</DialogTitle>
                <DialogDescription className="text-md text-muted-foreground">
                  Unlock unlimited access to Orbii, personalized lesson plans, progress tracking, and all special features!
                </DialogDescription>
              </DialogHeader>
              <div className="px-6 py-2">
                 <CheckoutForm onSuccess={() => { setIsSubscribed(true); setShowSubscriptionModal(false); }} />
              </div>
              <DialogFooter className="p-6 pt-4 border-t">
                <DialogClose asChild>
                  <Button variant="outline" className="w-full sm:w-auto">Maybe Later</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
         {showSubscriptionModal && !stripePromise && (
             <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
                <DialogContent className="bg-card rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-destructive text-xl">Subscription System Offline</DialogTitle>
                        <DialogDescription>We're having a little trouble with our subscription system right now. Please try again later, or contact support if this continues.</DialogDescription>
                    </DialogHeader>
                     <DialogFooter className="mt-4">
                        <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
             </Dialog>
         )}
        
        {isSubscribed && (
          <>
            <MoodSelector onSelectMood={handleMoodSelect} currentMood={currentMood} />

            <Card className="w-full max-w-2xl shadow-xl bg-card p-2 sm:p-4 rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-2xl font-semibold"><Brain className="mr-3 h-7 w-7 text-primary" /> Talk to Orbii!</CardTitle>
                <CardDescription>Ask a question, get help with homework, or explore a new topic!</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                
                <Card className="p-4 bg-secondary/30 border rounded-lg">
                    <CardTitle className="text-lg mb-2 font-medium">About the Learner (Optional):</CardTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <Label htmlFor="student-grade" className="font-medium text-sm text-muted-foreground">Grade Level</Label>
                            <Input id="student-grade" value={studentProfile.grade} onChange={(e) => handleStudentProfileChange('grade', e.target.value)} placeholder="e.g., 5th Grade" className="mt-1 text-base p-3"/>
                        </div>
                        <div>
                            <Label htmlFor="student-strengths" className="font-medium text-sm text-muted-foreground">Learning Strengths</Label>
                            <Input id="student-strengths" value={studentProfile.strengths} onChange={(e) => handleStudentProfileChange('strengths', e.target.value)} placeholder="e.g., Visuals, Stories" className="mt-1 text-base p-3"/>
                        </div>
                        <div>
                            <Label htmlFor="student-struggles" className="font-medium text-sm text-muted-foreground">Learning Struggles</Label>
                            <Input id="student-struggles" value={studentProfile.struggles} onChange={(e) => handleStudentProfileChange('struggles', e.target.value)} placeholder="e.g., Long texts, Math steps" className="mt-1 text-base p-3"/>
                        </div>
                    </div>
                </Card>

                <Textarea
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  placeholder="Type your question for Orbii here..."
                  className="min-h-[120px] text-lg p-4 rounded-md shadow-inner border-border focus:ring-2 focus:ring-primary"
                  aria-label="Question input area"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => handleSubmit()} disabled={loading || userIsSpeaking} className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground py-4 text-xl font-semibold rounded-lg shadow-md transform hover:scale-105 transition-transform">
                    <Send className="mr-2 h-6 w-6" /> {loading ? 'Orbii is thinking...' : 'Ask Orbii'}
                  </Button>
                  <Button 
                    onClick={handleListen} 
                    variant={userIsSpeaking ? "destructive" : "secondary"} 
                    className={`flex-1 py-4 text-xl font-semibold rounded-lg shadow-md transform hover:scale-105 transition-all ${userIsSpeaking ? 'animate-pulse' : ''}`}
                    aria-pressed={userIsSpeaking}
                    aria-label={userIsSpeaking ? "Stop listening" : "Speak to Orbii"}
                  >
                    <Mic className="mr-2 h-6 w-6" /> {userIsSpeaking ? 'Listening...' : 'Speak Question'}
                  </Button>
                </div>
                 <Card className="p-4 bg-secondary/30 border rounded-lg">
                    <CardTitle className="text-lg mb-3 text-center font-medium">Got Homework with Pictures?</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Label htmlFor="image-upload" className="flex-1 flex items-center justify-center cursor-pointer text-primary hover:text-primary/80 border-2 border-dashed border-primary rounded-lg p-6 hover:bg-primary/10 transition-colors text-lg font-medium">
                            <Upload className="mr-3 h-7 w-7" /> Upload Image File
                        </Label>
                        <Input id="image-upload" type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="flex-1 text-lg py-6 border-2 border-primary hover:bg-primary/10 text-primary font-medium"><Camera className="mr-3 h-7 w-7"/> Use Camera</Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card rounded-xl">
                                <DialogHeader><DialogTitle className="text-xl text-primary">Live Camera Capture</DialogTitle></DialogHeader>
                                {hasCameraPermission === null && <p className="text-center p-4 text-muted-foreground">Requesting camera permission...</p>}
                                {hasCameraPermission === false && <Alert variant="destructive" className="my-4"><Camera className="h-5 w-5"/> <AlertTitle>Camera Access Denied</AlertTitle><AlertDescription>Please grant camera access in your browser settings. For camera usage, this site may need to be served over HTTPS or localhost.</AlertDescription></Alert>}
                                {/* Ensure video tag is always rendered to avoid hydration issues, control visibility with CSS if needed or let it be small */}
                                <video ref={videoRef} className={`w-full rounded-md aspect-video bg-black ${hasCameraPermission ? 'block' : 'hidden'}`} autoPlay playsInline muted />
                                <DialogFooter>
                                    <Button onClick={captureImageFromCamera} disabled={!hasCameraPermission || loading} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 py-3 text-lg">
                                      <Camera className="mr-2"/> Capture Photo
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                 </Card>
                {imageUrl && (
                  <div className="mt-3 p-3 border rounded-lg bg-secondary/20 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Image for Orbii:</p>
                    <Image src={imageUrl} alt="Homework Preview" width={250} height={180} style={{ objectFit: 'contain', maxHeight: '180px', width: 'auto' }} className="rounded-lg border-2 border-primary shadow-md mx-auto" />
                    <Button variant="ghost" size="sm" onClick={() => setImageUrl('')} className="text-xs text-destructive hover:text-destructive/80 mt-2">
                        <XCircle className="inline mr-1 h-4 w-4"/> Clear Image
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {adaptiveLessonPlan && (
              <Card className="w-full max-w-2xl shadow-xl bg-card p-2 sm:p-4 rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="flex items-center text-xl font-semibold"><BookOpen className="mr-3 h-6 w-6 text-primary" /> Orbii's Lesson Ideas</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowLessonPlan(prev => !prev)} aria-label={showLessonPlan ? "Hide lesson plan" : "Show lesson plan"}>
                    {showLessonPlan ? <XCircle className="h-6 w-6 text-muted-foreground hover:text-foreground"/> : <PlayCircle className="h-6 w-6 text-primary"/>}
                  </Button>
                </CardHeader>
                {showLessonPlan && (
                  <CardContent>
                    <ul className="list-disc pl-6 space-y-2 text-md text-foreground/90">
                      {(adaptiveLessonPlan.lessonPlan || "No specific steps generated yet, but we can explore this topic together!").split('\n').filter(s => s.trim() !== '').map((step, i) => (
                        <li key={i} className="leading-relaxed">
                          {step.includes("http://") || step.includes("https://") ? 
                            (() => {
                                const linkIndex = step.search(/https?:\/\//);
                                const textPart = step.substring(0, linkIndex);
                                const linkPart = step.substring(linkIndex);
                                return <>
                                    {textPart}
                                    <a href={linkPart} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline hover:text-accent/80 transition-colors font-medium">
                                    <PlayCircle className="inline h-4 w-4 ml-1 mr-1"/> Watch/Explore Link
                                    </a>
                                </>;
                            })()
                             : 
                          step}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            )}
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full max-w-2xl py-4 text-xl font-semibold rounded-lg shadow-md hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-primary border-2 border-primary text-primary hover:border-accent hover:text-accent-foreground"><Palette className="mr-3 h-6 w-6"/> Open Orbii's Whiteboard</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 flex flex-col bg-card rounded-xl shadow-2xl">
                <DialogHeader className="p-4 border-b flex flex-row justify-between items-center">
                  <DialogTitle className="text-xl font-bold text-primary">Orbii's Interactive Whiteboard</DialogTitle>
                  <DialogClose asChild><Button variant="ghost" size="icon"><X className="h-5 w-5"/></Button></DialogClose>
                </DialogHeader>
                <DialogDescription className="px-4 pb-2 text-sm text-muted-foreground">Let's draw and learn together! Orbii might suggest ideas based on our topic.</DialogDescription>
                <div className="flex-grow overflow-hidden rounded-b-xl"> 
                    <iframe src="https://excalidraw.com/" title="Excalidraw Whiteboard" width="100%" height="100%" frameBorder="0"></iframe>
                </div>
              </DialogContent>
            </Dialog>

            <Card className="w-full max-w-2xl shadow-xl bg-card p-2 sm:p-4 rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-xl font-semibold"><BarChart3 className="mr-3 h-6 w-6 text-primary" /> My Learning Journey</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                    <div>
                        <p className="text-3xl font-bold text-primary">{userMessages.length}</p>
                        <p className="text-sm text-muted-foreground">Questions Asked</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-accent">{totalPoints}</p>
                        <p className="text-sm text-muted-foreground">Learning Points</p>
                    </div>
                </div>
                <p className="text-lg text-center mb-3">Estimated Mastery: <span className="font-bold text-primary">{masteryLevel}</span></p>
                <div className="h-72 sm:h-80 mt-4">
                  {progressData.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progressData} margin={{ top: 5, right: 25, left: -20, bottom: 5 }}> 
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--foreground))" tick={{fontSize: 12}} />
                        <YAxis yAxisId="left" stroke="hsl(var(--primary))" tick={{fontSize: 12}} />
                        <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--accent))" tick={{fontSize: 12}} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }} 
                          labelStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: 'bold' }}
                          itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        />
                        <Legend wrapperStyle={{fontSize: 14, paddingTop: '10px'}}/>
                        <Line yAxisId="left" type="monotone" dataKey="questions" name="Questions" stroke="hsl(var(--primary))" strokeWidth={3} activeDot={{ r: 7 }} dot={{r: 4, strokeWidth: 2, fill: 'hsl(var(--background))'}}/>
                        <Line yAxisId="right" type="monotone" dataKey="mastery" name="Mastery %" stroke="hsl(var(--accent))" strokeWidth={3} activeDot={{ r: 7 }} dot={{r: 4, strokeWidth: 2, fill: 'hsl(var(--background))'}}/>
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground mt-10">Ask some questions to see your progress chart grow!</p>
                  )}
                </div>
              </CardContent>
            </Card>
             <Dialog open={showCalmCorner} onOpenChange={setShowCalmCorner}>
              <DialogTrigger asChild>
                 <Button variant="outline" className="w-full max-w-2xl py-4 text-xl font-semibold rounded-lg shadow-md hover:bg-green-100 dark:hover:bg-green-700 focus:ring-2 focus:ring-green-500 border-2 border-green-500 text-green-600 dark:text-green-400 hover:border-green-600 hover:text-green-700"><Wind className="mr-3 h-6 w-6"/> Open Orbii's Calm Corner</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-card rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-green-600 dark:text-green-400 flex items-center"><Wind className="mr-2"/>Calm Corner</DialogTitle>
                  <DialogDescription className="text-md">Let's take a few deep breaths together. Focus on the animation.</DialogDescription>
                </DialogHeader>
                <div className="flex justify-center items-center h-64">
                  {/* Simple CSS animation for breathing - replace with Lottie or more complex if needed */}
                  <div className="w-40 h-40 bg-blue-300 dark:bg-blue-600 rounded-full animate-pulse-slow flex items-center justify-center">
                     <p className="text-center text-blue-800 dark:text-blue-200 text-lg font-medium">Breathe In...<br/>Breathe Out...</p>
                  </div>
                  <style jsx global>{`
                    .animate-pulse-slow {
                      animation: pulse-slow 5s infinite ease-in-out;
                    }
                    @keyframes pulse-slow {
                      0%, 100% { transform: scale(1); opacity: 0.7; }
                      50% { transform: scale(1.15); opacity: 1; }
                    }
                  `}</style>
                </div>
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button className="bg-green-500 hover:bg-green-600 text-white">Feeling Better!</Button>
                    </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>


            <Card className="w-full max-w-2xl shadow-xl bg-card p-2 sm:p-4 rounded-xl">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-xl font-semibold"><Settings className="mr-3 h-6 w-6 text-primary"/>App & Learner Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border">
                        <Label htmlFor="guardian-view" className="text-lg font-medium flex items-center"><UserCog className="mr-2 text-primary"/> Enable Guardian View</Label>
                        <Switch id="guardian-view" checked={isGuardianView} onCheckedChange={setIsGuardianView} aria-label="Toggle Guardian View"/>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border">
                        <Label htmlFor="voice-chat-toggle" className="text-lg font-medium flex items-center"><Speech className="mr-2 text-primary"/> Enable Orbii's Voice (TTS)</Label>
                        <Switch id="voice-chat-toggle" checked={isVoiceChatEnabled} onCheckedChange={handleToggleVoiceChat} aria-label="Toggle Voice Chat"/>
                    </div>
                    <Button onClick={handleTestModels} className="w-full py-4 text-xl font-semibold rounded-lg shadow-md" variant="outline"><Zap className="mr-3 h-6 w-6"/>Test AI Models</Button>
                </CardContent>
            </Card>

            {isGuardianView && (
              <Card className="w-full max-w-2xl shadow-2xl border-accent border-2 bg-card p-2 sm:p-4 rounded-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-2xl font-semibold text-accent"><UserCog className="mr-3 h-7 w-7"/> Guardian Dashboard</CardTitle>
                  <CardDescription className="text-md">Insights into the student's learning journey with Orbii.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 text-md">
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-primary">Recent Chat Snippets (Last 3):</h3>
                    {orbiiMessages.length > 0 || userMessages.length > 0 ? (
                        <ul className="list-none pl-2 space-y-2 text-sm max-h-40 overflow-y-auto rounded-md bg-secondary/20 p-3 border">
                        {[...orbiiMessages, ...userMessages].slice(-6).map((item, i) => <li key={i} className={`p-1 rounded ${i%2 === 0 ? 'text-muted-foreground' : 'text-foreground/80'}`}>{(item.length > 70 ? item.substring(0,67) + "..." : item )}</li>)}
                        </ul>
                    ) : <p className="text-sm text-muted-foreground">No interactions yet in this session.</p>}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-primary">Student Mood Insights:</h3>
                    <p className="text-sm">Current session mood: <span className={`font-bold capitalize ${currentMood === 'happy' ? 'text-green-500' : currentMood === 'frustrated' ? 'text-red-500' : 'text-yellow-500'}`}>{currentMood}</span>. (More detailed historical mood tracking and patterns analysis coming soon!)</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-primary">Tips for Supporting Autistic Learners:</h3>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground leading-relaxed">
                        <li>Use clear, direct, and concise language. Avoid sarcasm or idioms.</li>
                        <li>Break down complex tasks into smaller, manageable steps. Visual schedules can help!</li>
                        <li>Establish routines and provide predictable structures for learning sessions.</li>
                        <li>Offer frequent positive reinforcement and specific praise for effort and achievements.</li>
                        <li>Utilize visual aids, timers, and checklists to support understanding and task completion.</li>
                        <li>Be patient and allow for extra processing time. Sensory sensitivities are common.</li>
                        <li>Minimize distractions in the learning environment. A calm space is key.</li>
                        <li>Focus on strengths and special interests to build engagement.</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      <footer className="w-full max-w-4xl mt-12 pt-8 border-t border-border text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} KindMind Learning. All rights reserved.</p>
        <p className="mt-1">Empowering neurodiverse learners with Orbii, their AI friend and guide.</p>
         <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {isSubscribed && <Button variant="link" className="text-primary hover:underline text-base" onClick={() => setShowSubscriptionModal(true)}>Manage Subscription</Button>}
            <Button variant="link" className="text-primary hover:underline text-base">Terms of Service</Button>
            <Button variant="link" className="text-primary hover:underline text-base">Privacy Policy</Button>
        </div>
      </footer>
    </div>
  );
}


// Main export ensuring client-side rendering for Stripe and Web APIs
export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Basic skeleton loader to prevent hydration errors on initial server render for dynamic parts
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/50 p-6">
            <div className="flex justify-center items-center mb-3">
                <div className="w-20 h-20 bg-gray-300 rounded-2xl animate-pulse mr-4"></div>
                <div className="h-12 w-64 bg-gray-300 rounded animate-pulse"></div>
            </div>
            <div className="w-40 h-40 bg-gray-300 rounded-full animate-pulse mx-auto shadow-lg my-6"></div>
            <div className="w-full max-w-md h-16 bg-gray-300 rounded-lg animate-pulse"></div>
            <p className="text-xl text-foreground mt-6">Loading Orbii's Learning Universe...</p>
        </div>
    );
  }

  if (!stripePromise) { // Check if Stripe loaded correctly on client
    return (
      <div className="flex flex-col items-center justify-start min-h-screen py-6 bg-gradient-to-br from-background to-secondary/50 px-4 md:px-6">
        <header className="w-full max-w-4xl text-center mb-8">
           <div className="flex justify-center items-center mb-3">
             <Image src="https://picsum.photos/80/80" alt="Kind Mind Learning Logo Placeholder" width={80} height={80} className="mr-4 rounded-2xl shadow-md" data-ai-hint="brain logo"/>
             <h1 className="text-5xl font-bold text-primary tracking-tight">Kind Mind Learning</h1>
           </div>
           <p className="text-muted-foreground text-xl">With Orbii: Your Friendly AI Learning Companion!</p>
        </header>
        <main className="w-full max-w-4xl flex-1 flex flex-col items-center space-y-6">
          <Alert variant="destructive" className="max-w-2xl">
            <Zap className="h-5 w-5" />
            <AlertTitle className="text-xl font-semibold">Stripe System Offline</AlertTitle>
            <AlertDescription className="text-md">
              Oh dear! It looks like our payment system (Stripe) isn't configured correctly right now. 
              This means subscription features are temporarily unavailable. 
              Please ensure the <code className="font-mono bg-muted px-1 rounded text-destructive/80">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> is set up.
              The app admin will need to fix this. You can still explore some of Orbii's basic features!
            </AlertDescription>
          </Alert>
           {/* Render a simplified version of AppContent without Stripe-dependent features or show a message */}
           <Card className="w-full max-w-2xl shadow-xl bg-card p-4 rounded-xl mt-6">
            <CardHeader>
                <CardTitle className="text-2xl text-primary">Orbii is Here!</CardTitle>
                <CardDescription>While subscriptions are offline, you can still say hi to Orbii!</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button onClick={() => alert("Hi! I'm Orbii. My full features will be back soon!")} className="w-full bg-primary text-primary-foreground py-3 text-lg">Say Hi to Orbii</Button>
            </CardContent>
           </Card>
        </main>
        <footer className="w-full max-w-4xl mt-12 pt-8 border-t border-border text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} KindMind Learning. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <AppContent />
    </Elements>
  );
}

