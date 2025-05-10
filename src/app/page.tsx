// ✅ Orbii's upgraded page.tsx with Genkit brain integration
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { OrbiiInput, OrbiiOutput } from '@/ai/flows/orbiiFlow';
import { orbiiFlow, getOrbiiGreeting } from '@/ai/flows/orbiiFlow';
import { generateLessonPlan, type GenerateLessonPlanOutput } from '@/ai/flows/generate-lesson-plan';
import { generateProgressReport } from '@/ai/flows/generate-progress-report';
import { testGeminiModel, testOpenAIModel } from '@/ai/testActions'; // Updated import path


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
import type { Stripe, StripeElements } from '@stripe/stripe-js'; // Keep if CardElement used directly
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js'; // CardElement for direct use
import { Progress } from "@/components/ui/progress";
import Image from 'next/image';
import { Tldraw } from 'tldraw'


// Log for checking if Stripe public key is loaded on the client
if (typeof window !== 'undefined') {
  // console.log('Stripe Public Key (Client-side):', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const Mascot = ({ talking, mood }: { talking: boolean; mood: string }) => {
  const [imageSrc, setImageSrc] = useState('/orbii_neutral.png'); // Default
  
  useEffect(() => {
    let newImageSrc = '/orbii_neutral.png';
    if (mood === 'happy') newImageSrc = '/orbii_happy.png';
    if (mood === 'sad') newImageSrc = '/orbii_sad.png'; // Assuming you have orbii_sad.png
    setImageSrc(newImageSrc);
  }, [mood]);

  return (
    <div className={`relative w-32 h-32 md:w-48 md:h-48 mb-4 ${talking ? 'animate-bounce' : ''}`}>
      <Image src={imageSrc} alt="Orbii Mascot" width={192} height={192} data-ai-hint="friendly robot" priority />
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
      // This is where you would typically call your backend to create a Checkout Session or PaymentIntent
      // For this example, we simulate a call to a Firebase Function that creates a Stripe Checkout Session
      // const response = await fetch('/api/create-stripe-checkout-session', { // Replace with your actual backend endpoint
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ priceId: 'YOUR_STRIPE_PRICE_ID' }), // Send price ID or other relevant data
      // });
      // const session = await response.json();

      // if (session.error) {
      //   throw new Error(session.error);
      // }

      // // Redirect to Stripe Checkout
      // const result = await stripe.redirectToCheckout({ sessionId: session.sessionId });
      // if (result.error) {
      //   throw result.error;
      // }
      
      // SIMPLIFIED SIMULATION FOR NOW:
      console.log("Simulating payment processing...");
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network latency
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
  const [topic, setTopic] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const { toast } = useToast();
  const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'orbii'; content: string; isImage?: boolean }[]>([]);
  const [isVoiceChatEnabled, setIsVoiceChatEnabled] = useState(false);
  const [currentLessonPlan, setCurrentLessonPlan] = useState<GenerateLessonPlanOutput | null>(null);
  const [userMood, setUserMood] = useState<'happy' | 'neutral' | 'sad'>('neutral');
  const [isSubscribed, setIsSubscribed] = useState(false); // Default to false
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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Indicate component has mounted on client
  }, []);

  useEffect(() => {
    if (isClient && !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      const errorMessage = "Stripe public key is not defined. Stripe functionality will be disabled. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env.local file and restart the server.";
      console.error(errorMessage); 
      toast({
        variant: 'destructive',
        title: 'Stripe Configuration Error',
        description: errorMessage,
        duration: 10000,
      });
    }
  }, [isClient, toast]);


  useEffect(() => {
    const fetchGreeting = async () => {
      setLoading(true);
      try {
        const output = await getOrbiiGreeting({ 
          isNewUser: conversationHistory.length === 0, 
          lastSessionContext: conversationHistory.length > 1 ? conversationHistory.findLast(msg => msg.role === 'orbii')?.content.substring(0,50) + "..." : undefined
        });
        setOrbiiResponse(output.response);
        addToConversation({ role: 'orbii', content: output.response });
        if (isVoiceChatEnabled && output.response) speakText(output.response);
      } catch (error) {
        console.error("Error with initial Orbii greeting:", error);
        const errText = "Sorry, I couldn't start our conversation properly. Please try refreshing!";
        setOrbiiResponse(errText);
        addToConversation({ role: 'orbii', content: errText });
        toast({ variant: 'destructive', title: 'Orbii Error', description: 'Could not get initial greeting.' });
      } finally {
        setLoading(false);
      }
    };
    if (isClient && conversationHistory.length === 0) { 
        fetchGreeting();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]); 


  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      const SpeechRecognitionService =
        window.SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognitionService) {
        const recog = new SpeechRecognitionService();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = 'en-US';

        recog.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setQuestion(transcript); // Set the question state with the transcript
          handleOrbiiInteraction(transcript, imageUrl || undefined); // Immediately process
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
        if(isClient) console.warn("SpeechRecognition API not supported in this browser.");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, imageUrl, toast]); // Re-initialize if imageUrl changes (though unlikely needed here)


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
    window.speechSynthesis.cancel(); 
    window.speechSynthesis.speak(utterance);
  }, [isVoiceChatEnabled, toast]);


  const handleOrbiiInteraction = useCallback(async (userInput: string, imageInputDataUrl?: string) => {
    if (!userInput && !imageInputDataUrl) {
        toast({title: "Nothing to send", description: "Please type a question or upload an image."});
        return;
    }
    if (!isSubscribed && userInput.toLowerCase() !== 'test_subscription_override') { // Added an override for testing
      toast({ variant: 'destructive', title: 'Subscription Required', description: 'Please subscribe for full access or start a free trial.' });
      setShowCheckout(true);
      return;
    }

    setLoading(true);
    setOrbiiResponse(null);
    // setCurrentAnswer(null); // This state is not defined, consider removing or defining it if needed for other flows
    setCurrentLessonPlan(null);

    addToConversation({ role: 'user', content: userInput || "Image query", isImage: !!imageInputDataUrl });
    
    try {
      const orbiiInput: OrbiiInput = {
        type: imageInputDataUrl ? 'image' : 'text',
        data: imageInputDataUrl || userInput, 
        intent: 'homework_help', 
        userMood: userMood,
        topic: topic || userInput.substring(0, 30), // Use specific topic or a snippet of user input
        gradeLevel: "5th Grade", 
        learningStrengths: "Visual learner", 
        learningStruggles: "Math concepts", 
        isNewUser: conversationHistory.length <= 1, 
        lastSessionContext: conversationHistory.findLast(msg => msg.role === 'orbii')?.content.substring(0,50) + "...",
        textContextForImage: imageInputDataUrl ? userInput : undefined
      };

      const output = await orbiiFlow(orbiiInput);
      setOrbiiResponse(output.response);
      addToConversation({ role: 'orbii', content: output.response });
      if (isVoiceChatEnabled) speakText(output.response);

      setMasteryLevel(prev => Math.min(100, prev + Math.floor(Math.random() * 5) + 3));
      setStudentProgressData(prev => {
        const lastEntry = prev.length > 0 ? prev[prev.length - 1] : { name: 'Week 0', questions: 0, mastery: 0 };
        const newQuestions = (lastEntry.questions || 0) + 1;
        const newMastery = Math.min(100, (lastEntry.mastery || 0) + Math.floor(Math.random() * 5) + 3);
        const weekNumber = prev.length + 1;
        return [...prev, { name: `Week ${weekNumber}`, questions: newQuestions, mastery: newMastery }];
      });

      if (output.response.length > 20 && (topic || userInput)) { 
        const lessonPlanResponse = await generateLessonPlan({
          topic: topic || userInput,
          studentLevel: "intermediate", 
          learningStyle: "visual", 
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
      setQuestion(''); // Clear question input after sending
      // Consider clearing imageUrl as well, or provide a clear button
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubscribed, toast, userMood, isVoiceChatEnabled, speakText, topic, conversationHistory]); // Removed imageUrl from deps to avoid re-creating function unnecessarily

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
      if (isClient && typeof navigator !== 'undefined' && navigator.mediaDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error accessing camera:", err);
          setHasCameraPermission(false);
        }
      } else if (isClient) {
        setHasCameraPermission(false);
        // console.log("navigator.mediaDevices not available");
      }
    };
    if(isClient) { 
        getCameraPerm();
    }
  }, [isClient]);

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
      recognition.stop(); // Should stop listening
      setIsListening(false);
    } else if (!recognition && isClient) { // Only toast if client and recognition is not set up
        toast({ variant: 'destructive', title: 'Voice Not Available', description: 'Speech recognition is not supported or enabled in your browser.' });
    }
  };

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
        {orbiiResponse && !loading && conversationHistory.length > 0 && conversationHistory.findLast(msg => msg.role === 'orbii')?.content === orbiiResponse && (
          <Card className="bg-primary/10 border-primary/30 shadow-lg w-full max-w-md mx-auto mt-2">
            <CardContent className="p-3">
              <p className="text-sm text-foreground text-center whitespace-pre-wrap">{orbiiResponse}</p>
            </CardContent>
          </Card>
        )}
      </header>

      <main className="w-full max-w-3xl flex-1 space-y-6">
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


        {isSubscribed && (
          <>
            <Card className="shadow-lg max-h-96 overflow-y-auto p-4 space-y-3 bg-background/70 scroll-smooth">
              <CardHeader className="p-2 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                <CardTitle className="text-lg">Conversation with Orbii</CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {conversationHistory.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-2 rounded-lg shadow ${msg.role === 'user' ? 'bg-primary/80 text-primary-foreground' : 'bg-muted'}`}>
                      {msg.isImage && msg.content.startsWith('data:image') ? <Image src={msg.content} alt="User upload" width={200} height={200} className="rounded-md object-contain max-h-48" data-ai-hint="homework image" /> : <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                    </div>
                  </div>
                ))}
                 {loading && (
                    <div className="flex justify-start mt-2">
                        <div className="max-w-[70%] p-2 rounded-lg bg-muted flex items-center shadow">
                            <Brain className="animate-pulse h-5 w-5 mr-2 text-primary" />
                            <p className="text-sm italic text-muted-foreground">Orbii is thinking...</p>
                        </div>
                    </div>
                )}
              </CardContent>
            </Card>

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
                    onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleOrbiiInteraction(question, imageUrl || undefined);}}}
                  />
                  <Button onClick={() => handleOrbiiInteraction(question, imageUrl || undefined)} disabled={loading || (!question && !imageUrl)} size="icon" className="h-10 w-10 md:h-12 md:w-12 bg-primary hover:bg-primary/90 shrink-0">
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
                {hasCameraPermission === false && isClient && (
                    <Alert variant="destructive" className="mt-2">
                        <Camera className="h-4 w-4" />
                        <AlertTitle>Camera Access Denied</AlertTitle>
                        <AlertDescription>Allow camera access in browser settings to use the camera feature. You may need to serve the app over HTTPS or localhost.</AlertDescription>
                    </Alert>
                )}
                 {hasCameraPermission === true && isClient && (
                    <div className="mt-2 w-full max-w-xs mx-auto">
                        <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay muted playsInline />
                    </div>
                 )}


              </CardContent>
            </Card>

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
                        <div className="prose prose-sm dark:prose-invert max-h-[60vh] overflow-y-auto p-1" dangerouslySetInnerHTML={{ __html: currentLessonPlan.lessonPlan.replace(/\n/g, '<br />').replace(/\* \*(.*?)\* \*/g, '<strong>$1</strong>').replace(/\* (.*?)(?:\n|<br \/>)/g, '<li>$1</li>').replace(/<\/li><br \/>/g, '</li>') }} />
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
                        {/* Replace iframe with Tldraw component */}
                        <div style={{ width: '100%', height: 'calc(100% - 5rem)' }}>
                            <Tldraw />
                        </div>
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
                        {isClient && studentProgressData.length > 0 && (
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
                                    sessions: conversationHistory.filter(s=>s.role === 'orbii').slice(-5).map(s => ({
                                        topic: topic || "General", 
                                        successLevel: Math.floor(Math.random() * 3) + 3, 
                                        notes: s.content.substring(0,100) + "..."
                                    }))
                                });
                                // Displaying long report in toast might not be ideal. Consider a dialog.
                                toast({ title: "Full Progress Report", description: reportOutput.report, duration: 15000, className:"max-w-md whitespace-pre-wrap" });
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

// StripeCheckout component is not directly used in Home, but available if needed elsewhere or for a different checkout flow.
// const StripeCheckout = ({ onSuccess, onError }: { onSuccess: () => void; onError: (error: any) => void }) => {
//   if (!stripePromise) {
//     return <p className="text-destructive text-center">Stripe is not available. Please configure the Stripe public key.</p>;
//   }
//   return (
//     <Elements stripe={stripePromise}>
//       <CheckoutForm onSuccess={onSuccess} onError={onError} />
//     </Elements>
//   );
// };
