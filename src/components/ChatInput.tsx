import { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = async () => {
    if (inputValue.trim() && !disabled) {
      await onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-2 p-4 border-t border-white/20 bg-white/5 backdrop-blur-sm">
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        disabled={disabled}
        className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400/50 focus:ring-blue-400/30"
      />
      <Button
        onClick={handleSubmit}
        disabled={disabled || !inputValue.trim()}
        size="icon"
        className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-400 hover:via-blue-500 hover:to-blue-600 text-white font-semibold shadow-lg border border-blue-400/30 transition-all duration-300 hover:shadow-blue-500/25 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:via-transparent before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
