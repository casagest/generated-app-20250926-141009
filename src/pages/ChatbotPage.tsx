import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Send, Sparkles, Wrench, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatService, formatTime, renderToolCall } from '@/lib/chat';
import type { ChatState } from '../../worker/types';
export function ChatbotPage() {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    sessionId: chatService.getSessionId(),
    isProcessing: false,
    model: 'google-ai-studio/gemini-2.5-flash',
    streamingMessage: ''
  });
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [chatState.messages, chatState.streamingMessage]);
  const loadCurrentSession = useCallback(async () => {
    const response = await chatService.getMessages();
    if (response.success && response.data) {
      setChatState(prev => ({ ...prev, ...response.data, sessionId: chatService.getSessionId() }));
    }
  }, []);
  useEffect(() => {
    chatService.newSession();
    loadCurrentSession();
  }, [loadCurrentSession]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatState.isProcessing) return;
    const message = input.trim();
    setInput('');
    const userMessage = { id: crypto.randomUUID(), role: 'user' as const, content: message, timestamp: Date.now() };
    setChatState(prev => ({ ...prev, messages: [...prev.messages, userMessage], streamingMessage: '', isProcessing: true }));
    await chatService.sendMessage(message, chatState.model, (chunk) => {
      setChatState(prev => ({ ...prev, streamingMessage: (prev.streamingMessage || '') + chunk }));
    });
    await loadCurrentSession();
    setChatState(prev => ({ ...prev, isProcessing: false, streamingMessage: '' }));
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  const handleClear = async () => {
    await chatService.clearMessages();
    await loadCurrentSession();
  };
  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-4xl font-bold font-display">AI Lead Qualification</h1>
      <Card className="h-[75vh] flex flex-col shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-primary">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Aura AI Assistant</CardTitle>
              <p className="text-sm text-muted-foreground">Online</p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={handleClear} title="Clear conversation">
            <Trash2 className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full p-6">
            <div className="space-y-6">
              {chatState.messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && <Bot className="w-6 h-6 text-primary flex-shrink-0" />}
                  <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'}`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-current/20 space-y-1">
                        <div className="flex items-center gap-1 text-xs opacity-80">
                          <Wrench className="w-3 h-3" />
                          <span>Tool Used:</span>
                        </div>
                        {msg.toolCalls.map((tool, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {renderToolCall(tool)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && <User className="w-6 h-6 text-muted-foreground flex-shrink-0" />}
                </motion.div>
              ))}
              {chatState.streamingMessage && (
                <div className="flex items-end gap-3 justify-start">
                  <Bot className="w-6 h-6 text-primary flex-shrink-0" />
                  <div className="max-w-[80%] p-3 rounded-2xl bg-muted rounded-bl-none">
                    <p className="whitespace-pre-wrap">{chatState.streamingMessage}<span className="animate-pulse">|</span></p>
                  </div>
                </div>
              )}
              {chatState.isProcessing && !chatState.streamingMessage && (
                <div className="flex items-end gap-3 justify-start">
                  <Bot className="w-6 h-6 text-primary flex-shrink-0" />
                  <div className="p-3 rounded-2xl bg-muted rounded-bl-none">
                    <div className="flex space-x-1.5">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
        </CardContent>
        <div className="p-4 border-t bg-background">
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="flex-1 min-h-[42px] max-h-32 resize-none"
              rows={1}
              disabled={chatState.isProcessing}
            />
            <Button type="submit" disabled={!input.trim() || chatState.isProcessing} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}