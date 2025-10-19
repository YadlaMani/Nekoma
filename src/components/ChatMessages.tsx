import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/hooks/useChat';
import { ChatMessageComponent } from '@/components/ChatMessage';
import { Loader2 } from 'lucide-react';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-300">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2 text-white">Welcome to Gemini Chat</h3>
            <p className="text-gray-400">Start a conversation by typing a message below.</p>
          </div>
        </div>
      )}
      
      {messages.map((message) => (
        <ChatMessageComponent key={message.id} message={message} />
      ))}
      
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white/10 backdrop-blur-sm text-gray-300 rounded-lg px-4 py-2 flex items-center gap-2 border border-white/20 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            <span>Gemini is thinking...</span>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
