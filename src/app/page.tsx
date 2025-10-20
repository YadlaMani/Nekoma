"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { SignInWithBaseButton } from "@/components/SignInWithBase";
import SpendSection from "@/components/SpendSection";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useChat } from "@/hooks/useChat";
import { ChatMessages } from "@/components/ChatMessages";
import { ChatInput } from "@/components/ChatInput";
import TransactionHistory from "@/components/TransactionHistory";
import { Trash2, Bot, Wallet } from "lucide-react";
import { getRawPermissions } from "@/utils/spendUtils";
import { getPermissionStatus } from "@base-org/account/spend-permission/browser";
import { prepareSpendCallData } from "@base-org/account/spend-permission/browser";
interface ServerWalletResponse {
  address: string;
  smartAccountAddress?: string;
}
export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userAddress, setUserAddress] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  
  const { messages, isLoading: isChatLoading, error: chatError, sendMessage, clearChat } = useChat(userAddress);

  useEffect(() => {
    checkAuthStatus();
  });
  const checkAuthStatus = async () => {
    try {
      const res = await axios.get("/api/auth/status");
      if (res.data.isAuthenticated) {
        setIsAuthenticated(true);
        setUserAddress(res.data.address);
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignIn = async (address: string) => {
    console.log("User authenticated with address:", address);
    setIsAuthenticated(true);
    setUserAddress(address);
  };

  const handleSignOut = async () => {
    console.log("Signing out user");
    try {
      await axios.get("/api/auth/signout");
      setIsAuthenticated(false);
      setUserAddress(undefined);
      toast.success("Signed out successfully");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#020617] relative flex items-center justify-center">
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white relative z-10"></div>
      </div>
    );
  }
  return (
    <main className="min-h-screen w-full bg-[#020617] relative">
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
      <header className="bg-gray-900/80 backdrop-blur-sm shadow-lg border-b border-gray-700 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Image 
                src="/nekoma-logo.png" 
                alt="Nekoma Agent" 
                width={150} 
                height={150} 
                className="rounded-full mr-3"
              />
            </div>
            {isAuthenticated && (
              <Button 
                onClick={handleSignOut} 
                variant="secondary"
                className="relative overflow-hidden bg-gradient-to-br from-red-600/20 via-red-700/20 to-red-800/20 hover:from-red-500/30 hover:via-red-600/30 hover:to-red-700/30 border-red-400/30 text-red-300 hover:text-red-200 font-medium shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-red-500/20 hover:scale-105 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
              >
                Sign-Out
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {!isAuthenticated ? (
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <Image 
                src="/nekoma.jpeg" 
                alt="Nekoma Agent" 
                width={60} 
                height={60} 
                className="rounded-full mr-4"
              />
              <h2 className="text-3xl font-bold text-white">
                Nekoma Agent
              </h2>
            </div>

            <div className="flex justify-center">
              <SignInWithBaseButton
                onSignIn={handleSignIn}
                colorScheme="dark"
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                   
                    <SpendSection />
                   
              </div>

              <div>
                <Card className="h-[700px] flex flex-col overflow-hidden bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                  <CardHeader className="border-b border-white/20 flex-shrink-0">
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
                    {chatError && (
                      <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md break-words">
                        Error: {chatError}
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col p-0 overflow-hidden min-h-0">
                    <ChatMessages messages={messages} isLoading={isChatLoading} />
                    <ChatInput onSendMessage={sendMessage} disabled={isChatLoading} />
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Transaction History Section */}
            <div className="mt-8">
              <TransactionHistory userAddress={userAddress || ""} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
