'use client';

import React from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatMessages } from '@/components/ChatMessages';
import { ChatInput } from '@/components/ChatInput';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Bot } from 'lucide-react';

const ChatPage = () => {
  const { messages, isLoading, error, sendMessage, clearChat } = useChat();

  return (
    <div className="min-h-screen w-full bg-[#020617] relative">
      {/* Dark Basic Grid Background - Slate 950 */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "#020617",
          backgroundImage: `
            linear-gradient(to right, rgba(100,116,139,0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(100,116,139,0.4) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="container mx-auto p-4 h-screen flex flex-col relative z-10">
        <Card className="flex-1 flex flex-col max-w-4xl mx-auto bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
        <CardHeader className="border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <CardTitle className="text-white">Gemini Chat Assistant</CardTitle>
            </div>
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="flex items-center gap-2 relative overflow-hidden bg-gradient-to-br from-orange-600/20 via-orange-700/20 to-orange-800/20 hover:from-orange-500/30 hover:via-orange-600/30 hover:to-orange-700/30 border-orange-400/30 text-orange-300 hover:text-orange-200 font-medium shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-orange-500/20 hover:scale-105 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
              >
                <Trash2 className="h-4 w-4" />
                Clear Chat
              </Button>
            )}
          </div>
          {error && (
            <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
              Error: {error}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          <ChatMessages messages={messages} isLoading={isLoading} />
          <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
        </CardContent>
      </Card>
    </div>
    </div>
  );
};

export default ChatPage;
