declare var SpeechRecognition: any;

// expose the WebKit version as well
interface Window {
  webkitSpeechRecognition: typeof SpeechRecognition;
}

declare class SpeechRecognition extends EventTarget {
  constructor();
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  // …add other members you need
  start(): void;
  stop(): void;
}
