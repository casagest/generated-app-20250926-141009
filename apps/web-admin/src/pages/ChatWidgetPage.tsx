import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { WebSocketMessage } from '@shared/types';
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};
export function ChatWidgetPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);
  const connect = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) return;
    const wsUrl = new URL('/api/chat/qualify', window.location.href);
    wsUrl.protocol = wsUrl.protocol.replace('http', 'ws');
    ws.current = new WebSocket(wsUrl.toString());
    ws.current.onopen = () => console.log('WebSocket connected');
    ws.current.onclose = () => console.log('WebSocket disconnected');
    ws.current.onerror = (error) => console.error('WebSocket error:', error);
    ws.current.onmessage = (event) => {
      setIsTyping(false);
      const data = JSON.parse(event.data) as WebSocketMessage;
      if (data.type === 'message') {
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: data.content }]);
      } else if (data.type === 'typing') {
        setIsTyping(true);
      } else if (data.type === 'error') {
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `Error: ${data.content}` }]);
      }
    };
  };
  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && (!ws.current || ws.current.readyState !== WebSocket.OPEN)) {
      connect();
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    const wsMessage: WebSocketMessage = { type: 'message', content: input.trim() };
    ws.current.send(JSON.stringify(wsMessage));
    setInput('');
    setIsTyping(true);
  };
  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-80 h-[28rem] bg-card rounded-lg shadow-2xl flex flex-col border"
          >
            <header className="p-3 border-b flex items-center justify-between bg-card rounded-t-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 border-2 border-primary">
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-sm">Aura Dental Assistant</p>
                  <p className="text-xs text-emerald-500">● Online</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleToggle} className="h-7 w-7">
                <X className="h-4 w-4" />
              </Button>
            </header>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex items-end gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {msg.role === 'assistant' && <Bot className="h-5 w-5 text-primary flex-shrink-0" />}
                  <div
                    className={cn(
                      'max-w-[85%] p-2 px-3 rounded-2xl text-sm',
                      msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'
                    )}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2 justify-start">
                  <Bot className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="bg-muted rounded-2xl rounded-bl-none p-2 px-3">
                    <div className="flex space-x-1">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="p-3 border-t">
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 h-9"
                />
                <Button type="submit" size="icon" className="h-9 w-9 flex-shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          onClick={handleToggle}
          className="rounded-full w-14 h-14 bg-primary hover:bg-primary/90 shadow-lg"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
        </Button>
      </motion.div>
    </div>
  );
}