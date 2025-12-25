import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, X, Send, Loader2, Volume2, VolumeX, 
  User, Mic, MicOff, Square, Minus, Zap, BookOpen, DollarSign, Rocket, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import OpzenixLogo from '@/components/brand/OpzenixLogo';
import { Link } from 'react-router-dom';

// Type declarations for Web Speech API
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  inputMethod?: 'text' | 'voice';
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/opzenix-chat`;
const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

// Quick action buttons configuration
const QUICK_ACTIONS = [
  { icon: Rocket, label: 'Get Started', question: 'How do I get started with Opzenix?' },
  { icon: DollarSign, label: 'Pricing', question: 'What are the pricing plans for Opzenix?' },
  { icon: BookOpen, label: 'Features', question: 'What are the key features of Opzenix?' },
  { icon: HelpCircle, label: 'Support', question: 'How can I get support for Opzenix?' },
];

// Mini Opzenix logo for chat avatar
function ChatLogo({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center', className)}>
      <svg viewBox="0 0 48 48" className="w-full h-full p-1" fill="none">
        <path 
          d="M24 4L8 10V22C8 32 15 40 24 44C33 40 40 32 40 22V10L24 4Z" 
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeOpacity="0.9"
        />
        <path
          d="M16 24C16 24 18 20 21 20C24 20 24 24 24 24C24 24 24 28 27 28C30 28 32 24 32 24C32 24 30 20 27 20C24 20 24 24 24 24C24 24 24 28 21 28C18 28 16 24 16 24Z"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="16" cy="24" r="2" fill="white" />
        <circle cx="32" cy="24" r="2" fill="white" />
        <circle cx="24" cy="24" r="2.5" fill="white" />
      </svg>
    </div>
  );
}

// Typing indicator with Opzenix logo
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <ChatLogo className="w-8 h-8 shrink-0" />
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
        <motion.span
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
        />
        <motion.span
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
        />
        <motion.span
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
        />
      </div>
    </div>
  );
}

// Rich text renderer for markdown-like formatting
function RichTextMessage({ content, isUser }: { content: string; isUser: boolean }) {
  // Parse and render rich text with bold, underline, links, and colors
  const renderRichText = (text: string) => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    // Process the text for markdown-like patterns
    while (remaining.length > 0) {
      // Check for links [text](url)
      const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
      // Check for bold **text**
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
      // Check for underline __text__
      const underlineMatch = remaining.match(/__([^_]+)__/);
      // Check for colored text {{color:text}}
      const colorMatch = remaining.match(/\{\{(blue|green|orange|purple|red):([^}]+)\}\}/);

      // Find the earliest match
      const matches = [
        linkMatch ? { type: 'link', match: linkMatch, index: remaining.indexOf(linkMatch[0]) } : null,
        boldMatch ? { type: 'bold', match: boldMatch, index: remaining.indexOf(boldMatch[0]) } : null,
        underlineMatch ? { type: 'underline', match: underlineMatch, index: remaining.indexOf(underlineMatch[0]) } : null,
        colorMatch ? { type: 'color', match: colorMatch, index: remaining.indexOf(colorMatch[0]) } : null,
      ].filter(Boolean).sort((a, b) => (a?.index ?? 0) - (b?.index ?? 0));

      if (matches.length > 0 && matches[0]) {
        const earliest = matches[0];
        const beforeText = remaining.slice(0, earliest.index);
        
        if (beforeText) {
          parts.push(<span key={key++}>{beforeText}</span>);
        }

        if (earliest.type === 'link' && earliest.match) {
          const isExternal = earliest.match[2].startsWith('http');
          if (isExternal) {
            parts.push(
              <a 
                key={key++} 
                href={earliest.match[2]} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 underline font-medium"
              >
                {earliest.match[1]}
              </a>
            );
          } else {
            parts.push(
              <Link 
                key={key++} 
                to={earliest.match[2]}
                className="text-blue-500 hover:text-blue-600 underline font-medium"
              >
                {earliest.match[1]}
              </Link>
            );
          }
          remaining = remaining.slice(earliest.index + earliest.match[0].length);
        } else if (earliest.type === 'bold' && earliest.match) {
          parts.push(
            <strong key={key++} className="font-bold">
              {earliest.match[1]}
            </strong>
          );
          remaining = remaining.slice(earliest.index + earliest.match[0].length);
        } else if (earliest.type === 'underline' && earliest.match) {
          parts.push(
            <span key={key++} className="underline decoration-2">
              {earliest.match[1]}
            </span>
          );
          remaining = remaining.slice(earliest.index + earliest.match[0].length);
        } else if (earliest.type === 'color' && earliest.match) {
          const colorClasses: Record<string, string> = {
            blue: 'text-blue-500 font-semibold',
            green: 'text-green-500 font-semibold',
            orange: 'text-orange-500 font-semibold',
            purple: 'text-purple-500 font-semibold',
            red: 'text-red-500 font-semibold',
          };
          parts.push(
            <span key={key++} className={colorClasses[earliest.match[1]] || ''}>
              {earliest.match[2]}
            </span>
          );
          remaining = remaining.slice(earliest.index + earliest.match[0].length);
        }
      } else {
        parts.push(<span key={key++}>{remaining}</span>);
        break;
      }
    }

    return parts;
  };

  return (
    <div className={cn(
      'rounded-2xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap',
      isUser
        ? 'bg-primary text-primary-foreground rounded-tr-sm'
        : 'bg-muted rounded-tl-sm'
    )}>
      {renderRichText(content)}
    </div>
  );
}

export function OpzenixChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm **Maya**, the Lead Solutions Architect at {{blue:Opzenix}}. 🛡️\n\nI'm here to guide you through our CI/CD platform. You can:\n\n• Type your questions below\n• Click a quick action button\n• **Speak** and I'll respond with voice!\n\nWhat would you like to explore today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const autoSendTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastInputMethodRef = useRef<'text' | 'voice'>('text');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Hide quick actions after first user message
  useEffect(() => {
    if (messages.some(m => m.role === 'user')) {
      setShowQuickActions(false);
    }
  }, [messages]);

  // Initialize speech recognition with auto-send
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');
        setInput(transcript);
        lastInputMethodRef.current = 'voice';
        
        // Clear any existing auto-send timer
        if (autoSendTimerRef.current) {
          clearTimeout(autoSendTimerRef.current);
        }

        // Check if the speech is final
        const lastResult = event.results[event.results.length - 1];
        if (lastResult && lastResult.isFinal) {
          // Auto-send after 1.5 seconds of silence
          autoSendTimerRef.current = setTimeout(() => {
            if (transcript.trim()) {
              sendMessageWithMethod(transcript.trim(), 'voice');
              setInput('');
            }
          }, 1500);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please allow microphone access.');
        }
      };

      recognitionRef.current.onend = () => {
        // Restart if still in listening mode (for continuous listening)
        if (isListening && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {
            setIsListening(false);
          }
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (autoSendTimerRef.current) {
        clearTimeout(autoSendTimerRef.current);
      }
    };
  }, [isListening]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        lastInputMethodRef.current = 'voice';
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (autoSendTimerRef.current) {
        clearTimeout(autoSendTimerRef.current);
      }
    }
  }, [isListening]);

  const playAudio = async (text: string) => {
    if (!voiceEnabled) return;
    
    // Strip markdown formatting for TTS
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\{\{[^:]+:([^}]+)\}\}/g, '$1');
    
    try {
      setIsSpeaking(true);
      const response = await fetch(TTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: cleanText }),
      });

      if (!response.ok) {
        throw new Error('TTS failed');
      }

      const data = await response.json();
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const handleCloseChat = () => {
    setShowCloseDialog(true);
  };

  const confirmCloseChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
    stopAudio();
    stopListening();
    // Reset chat to initial state
    setMessages([
      {
        role: 'assistant',
        content: "Hello! I'm **Maya**, the Lead Solutions Architect at {{blue:Opzenix}}. 🛡️\n\nI'm here to guide you through our CI/CD platform. You can:\n\n• Type your questions below\n• Click a quick action button\n• **Speak** and I'll respond with voice!\n\nWhat would you like to explore today?",
      },
    ]);
    setShowQuickActions(true);
    setShowCloseDialog(false);
  };

  const sendMessageWithMethod = async (messageText: string, method: 'text' | 'voice') => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText.trim(), inputMethod: method };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please try again later.');
        } else if (response.status === 402) {
          toast.error('Service temporarily unavailable.');
        }
        throw new Error('Chat request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: 'assistant', content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Play audio for the response only if user asked via voice (speech-to-speech)
      if (assistantContent && voiceEnabled && method === 'voice') {
        // Speak the response for voice input
        const textToSpeak = assistantContent.slice(0, 600);
        playAudio(textToSpeak);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I apologize, but I encountered an issue. Let me try again — could you please rephrase your question?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    lastInputMethodRef.current = 'text';
    await sendMessageWithMethod(input, 'text');
  };

  const handleQuickAction = (question: string) => {
    lastInputMethodRef.current = 'text';
    sendMessageWithMethod(question, 'text');
  };

  const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  return (
    <>
      {/* Close Confirmation Dialog */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you wish to end this chat session? Your conversation history will be cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Chat</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCloseChat}>
              End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Chat Toggle Button - RIGHT SIDE */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized Chat Bar */}
      <AnimatePresence>
        {isOpen && isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div 
              onClick={() => setIsMinimized(false)}
              className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-full px-4 py-3 flex items-center gap-3 cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
            >
              <ChatLogo className="w-8 h-8" />
              <span className="text-white font-medium">Maya - Opzenix AI</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window - RIGHT SIDE */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)]"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[560px]">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <OpzenixLogo size="sm" showText={false} animate={false} />
                  <div>
                    <h3 className="font-semibold text-white">Maya</h3>
                    <p className="text-xs text-white/80">Lead Solutions Architect</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setVoiceEnabled(!voiceEnabled);
                      if (voiceEnabled) stopAudio();
                    }}
                    className="text-white hover:bg-white/20 h-8 w-8"
                    title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
                  >
                    {voiceEnabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMinimized(true)}
                    className="text-white hover:bg-white/20 h-8 w-8"
                    title="Minimize"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCloseChat}
                    className="text-white hover:bg-white/20 h-8 w-8"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        'flex gap-3',
                        msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      {msg.role === 'user' ? (
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                      ) : (
                        <ChatLogo className="w-8 h-8 shrink-0" />
                      )}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <RichTextMessage content={msg.content} isUser={msg.role === 'user'} />
                      </motion.div>
                    </motion.div>
                  ))}
                  {isLoading && <TypingIndicator />}
                </div>
              </ScrollArea>

              {/* Quick Actions */}
              {showQuickActions && !isLoading && (
                <div className="px-4 py-2 border-t border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Quick actions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_ACTIONS.map((action) => (
                      <Button
                        key={action.label}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5 hover:bg-blue-500/10 hover:border-blue-500/50"
                        onClick={() => handleQuickAction(action.question)}
                      >
                        <action.icon className="h-3 w-3" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Speaking Indicator */}
              {isSpeaking && (
                <div className="px-4 py-2 bg-blue-500/10 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                  <Volume2 className="h-3 w-3 animate-pulse text-blue-500" />
                  Maya is speaking...
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs ml-auto"
                    onClick={stopAudio}
                  >
                    Stop
                  </Button>
                </div>
              )}

              {/* Listening Indicator */}
              {isListening && (
                <div className="px-4 py-2 bg-red-500/10 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                  <Mic className="h-3 w-3 animate-pulse text-red-500" />
                  <span>Listening... (auto-sends after you stop speaking)</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs ml-auto"
                    onClick={stopListening}
                  >
                    <Square className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-border">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      lastInputMethodRef.current = 'text';
                    }}
                    placeholder="Ask Maya about Opzenix..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  {hasSpeechRecognition && (
                    <Button
                      type="button"
                      size="icon"
                      variant={isListening ? 'destructive' : 'outline'}
                      onClick={isListening ? stopListening : startListening}
                      disabled={isLoading}
                      title={isListening ? 'Stop listening' : 'Start voice input (auto-sends)'}
                    >
                      {isListening ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !input.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
