import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Volume2, VolumeX, X, AlertTriangle,
  Activity, Sparkles, Shield, Clock, CheckCircle2, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFlowStore } from '@/stores/flowStore';
import { toast } from 'sonner';

interface SpeechPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type SpeechMode = 'idle' | 'listening' | 'processing' | 'speaking';

interface SpeechLog {
  id: string;
  type: 'user' | 'system';
  text: string;
  timestamp: Date;
}

const SpeechPanel = ({ isOpen, onClose }: SpeechPanelProps) => {
  const [mode, setMode] = useState<SpeechMode>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechLogs, setSpeechLogs] = useState<SpeechLog[]>([]);
  const [isHolding, setIsHolding] = useState(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { systemHealth, executions, deployments } = useFlowStore();

  // ElevenLabs TTS function
  const speakWithElevenLabs = useCallback(async (text: string) => {
    if (isMuted) {
      setMode('idle');
      return;
    }

    setIsLoadingTTS(true);
    setMode('speaking');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            text,
            voiceId: 'JBFqnCBsd6RMkjVDRZzb' // George - professional voice
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setMode('idle');
        setIsLoadingTTS(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        console.error('Audio playback error');
        setMode('idle');
        setIsLoadingTTS(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
      setIsLoadingTTS(false);
    } catch (error) {
      console.error('TTS error:', error);
      toast.error('Voice synthesis unavailable');
      setMode('idle');
      setIsLoadingTTS(false);
    }
  }, [isMuted]);

  // Process query and generate response
  const processQuery = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    let response = '';

    if (lowerQuery.includes('status') || lowerQuery.includes('health')) {
      response = `System status is ${systemHealth.status}. Uptime is ${systemHealth.uptime}. There are ${systemHealth.activeFlows} active flows and ${systemHealth.pendingApprovals} pending approvals.`;
    } else if (lowerQuery.includes('deployment') || lowerQuery.includes('deploy')) {
      const lastDeploy = deployments[0];
      response = `Last deployment was version ${lastDeploy?.version || 'unknown'} to ${lastDeploy?.environment || 'production'}. Status: ${lastDeploy?.status || 'unknown'}.`;
    } else if (lowerQuery.includes('execution') || lowerQuery.includes('running')) {
      const running = executions.filter(e => e.status === 'running');
      response = `There are ${running.length} executions currently running. ${running.map(e => e.name).join(', ')}.`;
    } else if (lowerQuery.includes('failed') || lowerQuery.includes('error')) {
      const failed = executions.filter(e => e.status === 'failed');
      response = failed.length > 0 
        ? `There are ${failed.length} failed executions. ${failed.map(e => e.name).join(', ')}.`
        : 'No failed executions at this time.';
    } else if (lowerQuery.includes('approval') || lowerQuery.includes('pending')) {
      response = `There are ${systemHealth.pendingApprovals} pending approvals requiring attention.`;
    } else {
      response = 'I can provide information about system status, deployments, executions, and pending approvals. Please ask a specific question.';
    }

    return response;
  }, [systemHealth, executions, deployments]);

  const handleQuerySubmit = useCallback(async (query: string) => {
    // Add user query to log
    const userLog: SpeechLog = {
      id: `log-${Date.now()}`,
      type: 'user',
      text: query,
      timestamp: new Date(),
    };
    setSpeechLogs(prev => [...prev, userLog]);

    // Process and respond
    setMode('processing');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const response = processQuery(query);
    const systemLog: SpeechLog = {
      id: `log-${Date.now()}-sys`,
      type: 'system',
      text: response,
      timestamp: new Date(),
    };
    setSpeechLogs(prev => [...prev, systemLog]);
    
    // Speak the response with ElevenLabs
    await speakWithElevenLabs(response);
  }, [processQuery, speakWithElevenLabs]);

  const handlePushToTalkStart = useCallback(() => {
    setIsHolding(true);
    setMode('listening');
    setTranscript('');
    
    // Simulate speech recognition (would use Web Speech API in production)
    holdTimeoutRef.current = setTimeout(() => {
      setTranscript('Show me the current system status');
    }, 1500);
  }, []);

  const handlePushToTalkEnd = useCallback(async () => {
    if (!isHolding) return;
    
    setIsHolding(false);
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
    }

    if (transcript) {
      await handleQuerySubmit(transcript);
      setTranscript('');
    } else {
      setMode('idle');
    }
  }, [isHolding, transcript, handleQuerySubmit]);

  const handleQuickQuery = useCallback(async (query: string) => {
    setTranscript(query);
    await handleQuerySubmit(query);
    setTranscript('');
  }, [handleQuerySubmit]);

  // Stop audio when muted
  useEffect(() => {
    if (isMuted && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setMode('idle');
    }
  }, [isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-0 top-14 bottom-0 w-80 bg-card border-l border-border shadow-xl z-40 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                mode === 'speaking' && 'bg-ai-primary/20',
                mode === 'listening' && 'bg-sec-warning/20',
                mode === 'processing' && 'bg-exec-primary/20',
                mode === 'idle' && 'bg-secondary'
              )}>
                <Activity className={cn(
                  'w-4 h-4',
                  mode === 'speaking' && 'text-ai-primary',
                  mode === 'listening' && 'text-sec-warning',
                  mode === 'processing' && 'text-exec-primary',
                  mode === 'idle' && 'text-muted-foreground'
                )} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Voice Intelligence</h3>
                <p className="text-xs text-muted-foreground capitalize">
                  {mode === 'speaking' && isLoadingTTS ? 'Generating voice...' : mode}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* ElevenLabs Badge */}
          <div className="px-4 py-2 bg-ai-primary/5 border-b border-ai-primary/10 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-ai-primary" />
            <p className="text-xs text-muted-foreground">
              Powered by <strong className="text-ai-primary">ElevenLabs</strong> Voice AI
            </p>
          </div>

          {/* Permission Notice */}
          <div className="px-4 py-2 bg-sec-warning/10 border-b border-sec-warning/20 flex items-start gap-2">
            <Shield className="w-4 h-4 text-sec-warning mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Voice commands are <strong className="text-foreground">read-only</strong>. 
              Actions require visual confirmation.
            </p>
          </div>

          {/* Transcript Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {speechLogs.length === 0 ? (
              <div className="text-center py-8">
                <Mic className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Hold the microphone button to speak
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try: "What's the system status?"
                </p>
              </div>
            ) : (
              speechLogs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    'p-3 rounded-lg text-sm',
                    log.type === 'user' 
                      ? 'bg-primary/10 border border-primary/20 ml-4'
                      : 'bg-secondary/50 border border-border mr-4'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {log.type === 'user' ? (
                      <Mic className="w-3 h-3 text-primary" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-ai-primary" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {log.type === 'user' ? 'You' : 'Opzenix'} • {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-foreground">{log.text}</p>
                </div>
              ))
            )}

            {/* Live Transcript */}
            {mode === 'listening' && transcript && (
              <div className="p-3 rounded-lg bg-sec-warning/10 border border-sec-warning/30 ml-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-sec-warning animate-pulse" />
                  <span className="text-xs text-muted-foreground">Listening...</span>
                </div>
                <p className="text-sm text-foreground">{transcript}</p>
              </div>
            )}

            {mode === 'processing' && (
              <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 text-ai-primary animate-spin" />
                Processing query...
              </div>
            )}

            {mode === 'speaking' && (
              <div className="flex items-center gap-2 p-3 text-xs text-ai-primary">
                {isLoadingTTS ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Volume2 className="w-4 h-4 animate-pulse" />
                )}
                {isLoadingTTS ? 'Generating voice...' : 'Speaking response...'}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-3 border-t border-border bg-secondary/20">
            <p className="text-xs text-muted-foreground mb-2">Quick queries:</p>
            <div className="flex flex-wrap gap-1">
              {['System status', 'Last deployment', 'Failed executions', 'Pending approvals'].map((query) => (
                <button
                  key={query}
                  disabled={mode !== 'idle'}
                  className={cn(
                    'px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 text-muted-foreground rounded transition-colors',
                    mode !== 'idle' && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={() => handleQuickQuery(query)}
                >
                  {query}
                </button>
              ))}
            </div>
          </div>

          {/* Push-to-Talk Button */}
          <div className="p-4 border-t border-border">
            <button
              onMouseDown={handlePushToTalkStart}
              onMouseUp={handlePushToTalkEnd}
              onMouseLeave={handlePushToTalkEnd}
              onTouchStart={handlePushToTalkStart}
              onTouchEnd={handlePushToTalkEnd}
              disabled={mode === 'processing' || mode === 'speaking'}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all',
                isHolding
                  ? 'bg-sec-warning text-white'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90',
                (mode === 'processing' || mode === 'speaking') && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isHolding ? (
                <>
                  <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
                  Listening...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Hold to Speak
                </>
              )}
            </button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              All voice interactions are logged for audit
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SpeechPanel;
