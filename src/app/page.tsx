'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { orbiiFlow, getOrbiiGreeting, OrbiiInput, OrbiiOutput } from '@/ai/flows/orbiiFlow';
import { generateLessonPlan } from '@/ai/flows/generate-lesson-plan';
import { generateProgressReport } from '@/ai/flows/generate-progress-report';
import { asdTutor, AsdTutorInput } from '@/ai/flows/asd-tutor-flow';
import { testGeminiModel, testOpenAIModel } from '@/ai/testActions'; // Corrected import path
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Mic, Camera, Bot, FileText, BarChart3, Smile, Meh, Frown, Send, Sparkles, Wind, BookOpen, UserCog, Settings, Zap, CheckCircle, XCircle, Headphones, Award, Palette, Brain, MessageCircle, Users, LogOut, Moon, Sun, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import Image from 'next/image';
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
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Stripe setup
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
let stripePromise: ReturnType<typeof loadStripe> | null = null;
if (stripePublishableKey) {
  stripePromise = loadStripe(stripePublishableKey);
} else {
  if (typeof window !== 'undefined') { // check typeof window to prevent SSR error
    console.error("Stripe public key is not defined. Stripe functionality will be disabled.");
  }
}

const Mascot = ({ talking, mood }: { talking: boolean; mood: string }) => {
  // Determine Orbii's appearance based on mood
  let moodClasses = 'bg-sky-400'; // Neutral
  let eyeShape = 'rounded-full';
  let mouthShape = 'w-10 h-3 bg-sky-800 rounded-sm'; // Neutral mouth

  if (mood === 'happy') {
    moodClasses = 'bg-green-400';
    mouthShape = 'w-10 h-5 bg-green-800 rounded-b-full'; // Happy smile
  } else if (mood === 'frustrated' || mood === 'sad') {
    moodClasses = 'bg-red-400';
    mouthShape = 'w-10 h-3 bg-red-800 rounded-t-full transform rotate-0'; // Sad mouth (simplified)
  } else if (mood === 'confused') {
    moodClasses = 'bg-yellow-400';
    eyeShape = 'w-5 h-3 bg-yellow-800 rounded-sm'; // Squinted/confused eyes
  }


  return (
    <div className="flex flex-col items-center mb-4 relative">
      {/* Floating effect for Orbii */}
      <div className={`relative w-32 h-32 rounded-full shadow-2xl transition-all duration-500 ease-in-out transform hover:scale-105 ${talking ? 'animate-bounce' : 'animate-pulse' } ${moodClasses} flex flex-col items-center justify-center border-4 border-white overflow-hidden`} data-ai-hint="robot mascot">
        {/* Eyes */}
        <div className="flex space-x-4 mt-2">
          <div className={`w-6 h-6 bg-white ${eyeShape} flex items-center justify-center shadow-inner`}>
            <div className={`w-3 h-3 bg-sky-800 rounded-full ${talking ? 'animate-ping' : ''}`}></div>
          </div>
          <div className={`w-6 h-6 bg-white ${eyeShape} flex items-center justify-center shadow-inner`}>
            <div className={`w-3 h-3 bg-sky-800 rounded-full ${talking ? 'animate-ping' : ''}`}></div>
          </div>
        </div>
        {/* Mouth */}
        <div className={`mt-3 ${mouthShape} transition-all duration-300`}></div>
        {/* Glasses - simple line, could be more complex SVG */}
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <svg width="100" height="30" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="15" r="12" stroke="#334155" strokeWidth="2.5"/>
            <circle cx="80" cy="15" r="12" stroke="#334155" strokeWidth="2.5"/>
            <line x1="32" y1="15" x2="68" y2="15" stroke="#334155" strokeWidth="2.5"/>
          </svg>
        </div>
        {/* Optional: Sparkles or glow effect */}
        {!talking && <Sparkles className="absolute bottom-2 right-2 w-5 h-5 text-white/70 animate-ping opacity-50" />}
      </div>
      <p className="text-sm text-muted-foreground mt-2 capitalize">Orbii is {talking ? "listening..." : mood}</p>
    </div>
  );
};


const SpeechBubble = ({ text, isUser, audioSrc, onPlayAudio }: { text: string; isUser?: boolean, audioSrc?: string, onPlayAudio?: () => void }) => {
  if (!text && !audioSrc) return null;
  const bubbleClasses = isUser
    ? "bg-accent text-accent-foreground self-end rounded-lg rounded-br-none"
    : "bg-card text-card-foreground self-start rounded-lg rounded-bl-none";
  
  return (
    <div className={`relative ${bubbleClasses} p-3 shadow-md max-w-md mt-3 break-words w-auto inline-block clear-both mb-2 text-left text-sm`}>
      {text && <p className="whitespace-pre-wrap">{text}</p>}
      {audioSrc && onPlayAudio && (
        <Button onClick={onPlayAudio} variant="ghost" size="sm" className="mt-2">
          <Headphones className="mr-2 h-4 w-4" /> Play Audio
        </Button>
      )}
    </div>
  );
};

const MoodSelector = ({ onSelectMood }: { onSelectMood: (mood: OrbiiInput['userMood']) => void }) => {
  const moods: { mood: OrbiiInput['userMood'], icon: React.ReactNode, label: string }[] = [
    { mood: 'happy', icon: <Smile className="h-8 w-8 text-green-500" />, label: "Happy" },
    { mood: 'neutral', icon: <Meh className="h-8 w-8 text-yellow-500" />, label: "Okay" },
    { mood: 'confused', icon: <HelpCircle className="h-8 w-8 text-orange-500" />, label: "Confused"},
    { mood: 'frustrated', icon: <Frown className="h-8 w-8 text-red-500" />, label: "Frustrated"},
    { mood: 'sad', icon: <Frown className="h-8 w-8 text-blue-500" />, label: "Sad"}, // Using Frown for sad too, differentiated by color
  ];

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">How are you feeling today?</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-around items-center p-4">
        {moods.map(({ mood, icon, label }) => (
          <Button key={mood} variant="ghost" onClick={() => onSelectMood(mood)} className="flex flex-col h-auto p-2 hover:bg-secondary/50" aria-label={`Select mood: ${label}`}>
            {icon}
            <span className="text-xs mt-1">{label}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};


// Dummy data for progress chart
const initialProgressData = [
  { name: 'Week 1', questions: 5, mastery: 20 },
  { name: 'Week 2', questions: 8, mastery: 35 },
  { name: 'Week 3', questions: 12, mastery: 50 },
  { name: 'Week 4', questions: 10, mastery: 60 },
];

const CheckoutForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      toast({ variant: "destructive", title: "Stripe not loaded!" });
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast({ variant: "destructive", title: "Card details not found!" });
      setLoading(false);
      return;
    }

    // Here, you would typically create a PaymentMethod and then
    // call a backend (Firebase Function) to create a subscription.
    // For this test, we'll simulate a successful payment.
    // const { error, paymentMethod } = await stripe.createPaymentMethod({
    //   type: 'card',
    //   card: cardElement,
    // });

    // if (error || !paymentMethod) {
    //   toast({ variant: "destructive", title: error?.message || "Payment failed." });
    //   setLoading(false);
    //   return;
    // }

    // console.log('Simulating payment method:', paymentMethod.id);
    // Assume backend call to create subscription is successful
    
    setTimeout(() => { // Simulate network delay
      toast({ title: "Subscription Started!", description: "Welcome to Kind Mind Learning Premium!", icon: <CheckCircle className="text-green-500" /> });
      onSuccess(); // Call the onSuccess callback passed from parent
      setLoading(false);
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardElement options={{ style: { base: { fontSize: '16px' } } }} className="p-3 border rounded-md" />
      <Button type="submit" disabled={!stripe || loading} className="w-full bg-primary hover:bg-primary/90">
        {loading ? "Processing..." : "Start Free Trial & Subscribe ($9.99/mo after trial)"}
      </Button>
    </form>
  );
};

interface AppContentProps {
  initialIsSubscribed: boolean;
}


const AppContent: React.FC<AppContentProps> = ({ initialIsSubscribed }) => {
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ type: 'user' | 'orbii'; text: string; audioSrc?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMood, setCurrentMood] = useState<OrbiiInput['userMood']>('neutral');
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const chatEndRef = useRef<null | HTMLDivElement>(null);
  const [currentTopic, setCurrentTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [learningStrengths, setLearningStrengths] = useState('');
  const [learningStruggles, setLearningStruggles] = useState('');
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);


  // Progress and Lesson Plan States
  const [lessonPlan, setLessonPlan] = useState<string | null>(null);
  const [progressData, setProgressData] = useState(initialProgressData);
  const [masteryLevel, setMasteryLevel] = useState<'Beginner' | 'Proficient' | 'Master'>('Beginner');
  const [showGuardianView, setShowGuardianView] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        window.SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false; // Process after user stops speaking
        recog.interimResults = false; // Only final results
        recog.lang = 'en-US';

        recog.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setUserInput(transcript); // Set the input field with the transcript
          toast({ title: 'Voice Input Received', description: `"${transcript}" - Ready to send to Orbii!` });
          setIsListening(false);
          // Automatically submit after successful recognition if desired
          // handleUserSubmit(transcript); 
        };

        recog.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error', event.error);
          let errorMsg = event.error;
          if (event.error === 'no-speech') errorMsg = "I didn't hear anything. Could you try again?";
          if (event.error === 'audio-capture') errorMsg = "Hmm, I can't seem to access your microphone.";
          if (event.error === 'not-allowed') errorMsg = "Microphone access was denied. Please enable it in your browser settings.";
          
          toast({ variant: "destructive", title: 'Voice Error', description: errorMsg });
          setIsListening(false);
        };
        
        recog.onstart = () => {
          setIsListening(true);
          toast({description: "Orbii is listening..."});
        }
        recog.onend = () => {
          setIsListening(false);
        }

        recognitionRef.current = recog;
      } else {
        toast({variant: "destructive", title: "Voice Input Not Supported", description: "Your browser doesn't support voice recognition."});
      }
    }
  }, [toast]);
  
  const handleToggleListening = () => {
    if (!recognitionRef.current) {
      toast({variant: "destructive", title: "Voice Input Not Ready", description: "Speech recognition is not available."});
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error starting recognition:", e);
        toast({variant: "destructive", title: "Could not start voice input", description: "Please ensure microphone permissions are granted."});
        setIsListening(false);
      }
    }
  };


  useEffect(() => {
    // Initial greeting from Orbii
     const fetchGreeting = async () => {
      setLoading(true);
      try {
        const greetingResponse = await getOrbiiGreeting({ isNewUser: true }); // Assuming new user for simplicity
        setChatHistory([{ type: 'orbii', text: greetingResponse.response }]);
      } catch (error: any) {
        console.error("Failed to get Orbii's greeting:", error);
        setChatHistory([{ type: 'orbii', text: "Hello! I'm Orbii. I seem to be having a little trouble starting up, but let's try our best!" }]);
      } finally {
        setLoading(false);
      }
    };
    fetchGreeting();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Camera Permission Effect
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
          // Toast is handled in captureImage or when trying to display video now
        }
      } else {
        setHasCameraPermission(false);
      }
    };
    getCameraPermission();
    return () => { // Cleanup: stop camera stream when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const playAudio = (audioDataUri: string) => {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    }
    const audio = new Audio(audioDataUri);
    setActiveAudio(audio);
    audio.play().catch(e => console.error("Error playing audio:", e));
  };

  const handleUserSubmit = async (textInput?: string) => {
    const currentMessage = textInput || userInput;
    if (!currentMessage.trim() && !imageUrl) {
      toast({ title: "Say Something!", description: "Please type a question or upload an image.", variant: "default" });
      return;
    }

    if (!isSubscribed) {
        setShowSubscriptionModal(true);
        return;
    }

    setLoading(true);
    const userMessageForHistory = currentMessage || (imageUrl ? "Image uploaded" : "Empty message");
    setChatHistory(prev => [...prev, { type: 'user', text: userMessageForHistory }]);
    
    // Clear input field, keep image if it was just used with text
    if (!textInput) setUserInput(''); 
    // Consider if image should be cleared immediately or after successful processing
    // For now, let's keep it until Orbii responds or a new one is uploaded.

    try {
      const orbiiInputPayload: OrbiiInput = {
        type: imageUrl ? 'image' : 'text',
        data: imageUrl || currentMessage,
        intent: 'homework_help', // This could be more dynamic
        userMood: currentMood,
        gradeLevel,
        learningStrengths,
        learningStruggles,
        topic: currentTopic,
        textContextForImage: imageUrl ? currentMessage : undefined,
        isNewUser: chatHistory.length <= 1, // Simple check
        lastSessionContext: chatHistory.length > 1 ? chatHistory[chatHistory.length-2]?.text.substring(0,50) : undefined
      };

      const response = await orbiiFlow(orbiiInputPayload);
      let orbiiResponseText = response.response || "I'm not sure how to answer that just yet.";
      let audioDataUri: string | undefined = undefined;

      if (response.audio) { // Assuming orbiiFlow can return audio
        const blob = new Blob([response.audio], { type: 'audio/mpeg' });
        audioDataUri = URL.createObjectURL(blob);
      }
      
      setChatHistory(prev => [...prev, { type: 'orbii', text: orbiiResponseText, audioSrc: audioDataUri }]);
      
      if (audioDataUri) {
        playAudio(audioDataUri);
      }

      // Clear image URL after successful processing by Orbii
      if (imageUrl) setImageUrl('');


      // Adaptive Lesson Plan
      if (orbiiResponseText) { // Generate lesson plan based on Orbii's response to the main question
        const planResponse = await generateLessonPlan({
            topic: currentTopic || "the current discussion", // Use current topic or a generic placeholder
            studentLevel: gradeLevel || "their current level", // Use grade level or generic
            learningStyle: learningStrengths || "their preferred style" // Use strengths or generic
        });
        setLessonPlan(planResponse.lessonPlan);
      }

      // Update Progress (Simplified)
      setProgressData(prev => {
        const newWeek = `Week ${prev.length + 1}`;
        const newQuestions = (prev[prev.length-1]?.questions || 0) + 1;
        const newMastery = Math.min(100, (prev[prev.length-1]?.mastery || 0) + Math.floor(Math.random() * 10) + 5); // Random small increase
        if (newMastery > 70) setMasteryLevel("Master");
        else if (newMastery > 40) setMasteryLevel("Proficient");
        else setMasteryLevel("Beginner");
        return [...prev, { name: newWeek, questions: newQuestions, mastery: newMastery }];
      });


    } catch (error: any) {
      console.error('Orbii error:', error);
      const errorMessage = `Oops! Something went wrong: ${error.message || 'Unknown error'}`;
      setChatHistory(prev => [...prev, { type: 'orbii', text: errorMessage }]);
      toast({ variant: "destructive", title: "Orbii Connection Error", description: error.message || "Could not reach Orbii's brain." });
    } finally {
      setLoading(false);
    }
  };
  
  const handleMoodSelect = (mood: OrbiiInput['userMood']) => {
    setCurrentMood(mood);
    setChatHistory(prev => [...prev, { type: 'orbii', text: `Orbii notes: You're feeling ${mood}. I'll adjust my approach!` }]);
    toast({ title: "Mood Updated!", description: `Orbii will now be extra ${mood === 'happy' ? 'cheerful' : mood === 'frustrated' ? 'patient' : 'focused'}!` });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ variant: "destructive", title: "File Too Large!", description: "Please upload images under 5MB." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        toast({ title: "Image Ready!", description: `Orbii can now see: ${file.name}`, icon: <CheckCircle className="text-green-500" /> });
      };
      reader.onerror = () => {
        toast({ variant: "destructive", title: "Oops!", description: "Couldn't load that image." });
      };
      reader.readAsDataURL(file);
    }
  };

  const captureImageFromCamera = useCallback(() => {
    if (hasCameraPermission === false) {
      toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Please enable camera permissions in your browser settings to use this app. The site must be served over HTTPS or localhost for camera access.', duration: 7000 });
      return;
    }
     if (!hasCameraPermission) { // Still null, permission not yet determined or failed silently
        toast({ variant: 'destructive', title: 'Camera Not Ready', description: 'Camera permission might not be granted or is still initializing.' });
        return;
    }
    if (videoRef.current && videoRef.current.readyState >= videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setImageUrl(dataUrl);
        toast({ title: 'Photo Snapped!', description: 'Orbii can see your image now.', icon: <CheckCircle className="text-green-500" /> });
      }
    } else {
      toast({ variant: 'destructive', title: 'Camera Not Ready', description: 'The video stream is not available yet. Please wait a moment.' });
    }
  }, [hasCameraPermission, toast]);

  const handleTestGemini = async () => {
    setLoading(true);
    const result = await testGeminiModel();
    toast({ title: "Gemini Test Result", description: result, duration: 10000 });
    setLoading(false);
  };

  const handleTestOpenAI = async () => {
    setLoading(true);
    const result = await testOpenAIModel();
    toast({ title: "OpenAI Test Result", description: result, duration: 10000 });
    setLoading(false);
  };
  
  const handleSubscriptionSuccess = () => {
    setIsSubscribed(true);
    setShowSubscriptionModal(false);
  };


  return (
     <div className="flex flex-col items-center justify-start min-h-screen py-4 bg-gradient-to-br from-background to-secondary/50 px-2 md:px-4">
      <header className="w-full max-w-3xl text-center mb-6">
        <div className="flex justify-center items-center mb-2">
         <Image src="https://picsum.photos/64/64" alt="Kind Mind Learning Logo" width={64} height={64} className="mr-3 rounded-full" data-ai-hint="brain logo"/>
          <h1 className="text-4xl font-bold text-primary">Kind Mind Learning</h1>
        </div>
        <p className="text-muted-foreground text-lg">Orbii: Your friendly AI learning companion!</p>
      </header>

      <main className="flex-grow flex flex-col items-center overflow-hidden max-w-3xl w-full">
        <Mascot talking={loading || isListening} mood={currentMood} />
        <MoodSelector onSelectMood={handleMoodSelect} />

        {/* Chat Area */}
        <div className="w-full flex-grow overflow-y-auto bg-card/50 p-3 rounded-lg shadow-inner space-y-3 mb-3 min-h-[200px] max-h-[50vh]">
          {chatHistory.map((chat, index) => (
            <SpeechBubble 
              key={index} 
              text={chat.text} 
              isUser={chat.type === 'user'} 
              audioSrc={chat.audioSrc}
              onPlayAudio={chat.audioSrc ? () => playAudio(chat.audioSrc!) : undefined}
            />
          ))}
          <div ref={chatEndRef} />
           {loading && (
            <div className="self-start flex items-center space-x-2 p-2">
              <Bot className="w-6 h-6 text-primary animate-pulse" />
              <p className="text-sm text-muted-foreground">Orbii is thinking...</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <Card className="w-full p-3 shadow-xl sticky bottom-2 bg-background/90 backdrop-blur-sm rounded-xl">
          {imageUrl && (
            <div className="mb-2 text-center relative">
              <Image src={imageUrl} alt="Preview" width={100} height={75} style={{ objectFit: 'contain', maxHeight: '75px', width: 'auto' }} className="rounded-md border inline-block" />
              <Button variant="ghost" size="icon" onClick={() => setImageUrl('')} className="absolute top-0 right-0 text-destructive hover:text-destructive/80 bg-background/50 rounded-full h-6 w-6 p-1">
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask Orbii anything, or describe your image..."
              className="flex-grow resize-none rounded-lg p-3 text-base min-h-[50px]"
              rows={1}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleUserSubmit();
                }
              }}
            />
             <Button onClick={handleToggleListening} variant="outline" size="icon" className={`h-12 w-12 rounded-lg ${isListening ? 'bg-destructive text-destructive-foreground animate-pulse' : ''}`} aria-label="Toggle voice input">
              <Mic className="h-6 w-6" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-lg" aria-label="Upload or use camera">
                  <Camera className="h-6 w-6" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Homework Image</DialogTitle>
                  <DialogDescription>You can upload a file or snap a new photo with your camera.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-3">
                  <Label htmlFor="image-upload-input" className="w-full text-center cursor-pointer flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg hover:bg-secondary/50 transition-colors">
                    <FileText className="h-6 w-6 text-muted-foreground"/> Click to Upload File
                  </Label>
                  <Input id="image-upload-input" type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  
                  {/* Camera Section */}
                  <div className="text-center text-sm text-muted-foreground my-2">OR</div>
                  
                  <video ref={videoRef} className="w-full aspect-video rounded-md bg-slate-900 border" autoPlay playsInline muted />

                  {hasCameraPermission === null && <p className="text-center text-muted-foreground">Requesting camera access...</p>}
                  {hasCameraPermission === false && (
                     <Alert variant="destructive">
                        <Camera className="h-5 w-5"/> <AlertTitle>Camera Access Denied or Unavailable</AlertTitle>
                        <AlertDescription>Please allow camera access in your browser settings. Note: Camera requires HTTPS or localhost.</AlertDescription>
                     </Alert>
                  )}
                   <DialogClose asChild>
                    <Button onClick={captureImageFromCamera} className="w-full" disabled={loading || hasCameraPermission === false}>
                        <Camera className="mr-2 h-5 w-5"/> Snap Photo & Use
                    </Button>
                   </DialogClose>
                </div>
                 <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                 </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={()=>handleUserSubmit()} disabled={loading || isListening} className="h-12 w-12 rounded-lg bg-primary text-primary-foreground" aria-label="Send message">
              {loading ? <Sparkles className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
            </Button>
          </div>
        </Card>

        {/* Action Buttons & Student Info */}
         <Accordion type="single" collapsible className="w-full mt-4">
          <AccordionItem value="student-info">
            <AccordionTrigger className="text-primary hover:text-primary/90 font-semibold">Your Learning Profile</AccordionTrigger>
            <AccordionContent className="space-y-3 p-1">
              <Input placeholder="Current Topic (e.g., Algebra)" value={currentTopic} onChange={(e) => setCurrentTopic(e.target.value)} />
              <Input placeholder="Your Grade Level (e.g., 5th Grade)" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} />
              <Textarea placeholder="Your Learning Strengths (e.g., Visuals, Storytelling)" value={learningStrengths} onChange={(e) => setLearningStrengths(e.target.value)} />
              <Textarea placeholder="Learning Struggles (e.g., Long texts, Staying focused)" value={learningStruggles} onChange={(e) => setLearningStruggles(e.target.value)} />
            </AccordionContent>
          </AccordionItem>

          {lessonPlan && (
            <AccordionItem value="lesson-plan">
                <AccordionTrigger className="text-primary hover:text-primary/90 font-semibold">Orbii's Suggested Lesson Plan</AccordionTrigger>
                <AccordionContent>
                    <pre className="whitespace-pre-wrap text-sm bg-secondary/30 p-3 rounded-md overflow-x-auto">{lessonPlan}</pre>
                </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>


        {/* Progress Overview Card */}
        <Card className="w-full mt-4">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><BarChart3 className="mr-2 h-6 w-6 text-primary"/>Progress Overview</CardTitle>
            <CardDescription>Track your learning journey with Orbii.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Questions Asked</p>
                <p className="text-2xl font-bold">{progressData[progressData.length - 1]?.questions || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Mastery</p>
                <p className={`text-2xl font-bold ${masteryLevel === 'Master' ? 'text-green-500' : masteryLevel === 'Proficient' ? 'text-yellow-500' : 'text-red-500'}`}>
                  {masteryLevel}
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--foreground))" fontSize={12}/>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="questions" stroke="hsl(var(--chart-1))" strokeWidth={2} activeDot={{ r: 6 }} name="Questions"/>
                <Line type="monotone" dataKey="mastery" stroke="hsl(var(--chart-2))" strokeWidth={2} activeDot={{ r: 6 }} name="Mastery (%)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Guardian View Toggle & Content */}
        <Card className="w-full mt-4">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl flex items-center"><Users className="mr-2 h-6 w-6 text-primary"/>Guardian Dashboard</CardTitle>
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="guardian-mode">Guardian View</Label>
                        <Switch id="guardian-mode" checked={showGuardianView} onCheckedChange={setShowGuardianView} />
                    </div>
                </div>
                <CardDescription>View student progress and insights.</CardDescription>
            </CardHeader>
            {showGuardianView && (
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-md mb-1">Quiz History (Sample)</h3>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                            <li>Algebra Basics: 85%</li>
                            <li>Photosynthesis Intro: 92%</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-md mb-1">Student Mood Patterns (Sample)</h3>
                        <p className="text-sm text-muted-foreground">Often feels 'confused' with word problems. Generally 'happy' during visual tasks.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-md mb-1">Learning Tips for ASD (Sample)</h3>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                            <li>Use visual schedules for study sessions.</li>
                            <li>Break down complex tasks into smaller, manageable steps.</li>
                            <li>Provide clear, direct instructions and avoid idioms.</li>
                        </ul>
                    </div>
                </CardContent>
            )}
        </Card>
        
        {/* Mind Map Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="mt-4 w-full md:w-auto">
              <Brain className="mr-2 h-5 w-5" /> Open Mind Map with Orbii
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl h-[80vh] p-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle>Orbii's Mind Map</DialogTitle>
              <DialogDescription>
                Let's explore ideas! Orbii might suggest something based on our topic: "{currentTopic || 'your learning'}"
              </DialogDescription>
            </DialogHeader>
            {/* Embed Excalidraw or a similar whiteboard. This is a simplified example. */}
            <iframe 
              src="https://excalidraw.com/" 
              className="w-full h-full border-0"
              title="Excalidraw Whiteboard"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms" // Important for security
            ></iframe>
          </DialogContent>
        </Dialog>

      </main>

      {/* Subscription Modal */}
        <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-xl text-primary">Unlock Full Access!</DialogTitle>
                    <DialogDescription>
                        Subscribe to Kind Mind Learning for $9.99/month. Your first month is FREE!
                        No credit card needed to start your free trial today.
                        (Test Mode: Card details are for testing and won't be charged).
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {stripePromise ? (
                        <Elements stripe={stripePromise}>
                            <CheckoutForm onSuccess={handleSubscriptionSuccess} />
                        </Elements>
                    ) : (
                       <Alert variant="destructive">
                            <AlertTitle>Stripe Not Configured</AlertTitle>
                            <AlertDescription>
                                Stripe payments are currently unavailable. Please check the console for errors regarding the Stripe public key.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
                 <DialogFooter>
                    <DialogClose asChild><Button variant="outline" onClick={() => setShowSubscriptionModal(false)}>Maybe Later</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      
      <footer className="w-full max-w-3xl mt-8 py-4 text-center text-muted-foreground text-xs border-t">
        <div className="flex justify-center gap-4 mb-2">
          <Button variant="ghost" size="sm" onClick={handleTestGemini} disabled={loading}><Zap className="mr-1 h-4 w-4"/>Test Gemini</Button>
          <Button variant="ghost" size="sm" onClick={handleTestOpenAI} disabled={loading}><Sparkles className="mr-1 h-4 w-4"/>Test OpenAI</Button>
        </div>
        <p>&copy; {new Date().getFullYear()} Kind Mind Learning. All rights reserved.</p>
        <p>Powered by Firebase Studio & Genkit AI.</p>
      </footer>
      <Toaster />
    </div>
  );
};

export default function Home() {
  // This outer component can handle checks that should only run once on the client
  // or data fetching that might be needed before AppContent mounts.
  // For now, assuming initialIsSubscribed might come from a higher-level context or auth check in a real app.
  const [clientLoaded, setClientLoaded] = useState(false);
  useEffect(() => {
    setClientLoaded(true);
  }, []);

  if (!clientLoaded) {
    // Render a loading state or null to avoid hydration mismatches related to Stripe or other client-side inits
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/50">
        <Bot className="h-16 w-16 text-primary animate-pulse mb-4" />
        <p className="text-muted-foreground">Orbii is waking up...</p>
      </div>
    );
  }
  
  return <AppContent initialIsSubscribed={false} />; // Default to not subscribed
}
