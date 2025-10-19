/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { SignInWithBaseButton } from "@/components/SignInWithBase";
import SpendSection from "@/components/SpendSection";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useChat } from "@/hooks/useChat";
import { ChatMessages } from "@/components/ChatMessages";
import { ChatInput } from "@/components/ChatInput";
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
  
  // Chat functionality
  const { messages, isLoading: isChatLoading, error: chatError, sendMessage, clearChat } = useChat();

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
  const sendTransaction = async () => {
    try {
      const smartWallet = await fetch("/api/serverwallet");
      const data: ServerWalletResponse = await smartWallet.json();

      const rawPermissions = await getRawPermissions(
        userAddress!,
        data.smartAccountAddress!
      );

      const requiredAmount = BigInt(100_000);
      let remainingAmount = requiredAmount;
      const spendCalls: any[] = [];

      for (const perm of rawPermissions) {
        if (remainingAmount <= 0) break;

        const status = await getPermissionStatus(perm);

        if (status.remainingSpend <= BigInt(0)) continue;

        const spendAmount =
          remainingAmount > status.remainingSpend
            ? status.remainingSpend
            : remainingAmount;

        const call = await prepareSpendCallData(perm, spendAmount);
        spendCalls.push(call);

        remainingAmount -= spendAmount;
      }

      if (remainingAmount > BigInt(0)) {
        throw new Error(
          `Not enough permission to cover the required amount. Still need ${Number(
            remainingAmount
          )} units`
        );
      }

      console.log("Spend calls to send:", spendCalls);

      const res = await axios.post("/api/transfer", {
        recipient: "0xF77A1B7294c761ea5DbD77D3AC3050c9AC802Cc3",
        sender: userAddress,
        amount: requiredAmount.toString(),
        spendCalls,
      });

      if (res.data.success) {
        toast.success("Transaction sent successfully");
        console.log("Transaction response:", res.data);
      } else {
        toast.error("Transaction failed: " + res.data.error);
      }
    } catch (err) {
      console.error("Error sending transaction:", err);
      toast.error("Error sending transaction");
    }
  };
  const swapTokens = async () => {
    try {
      const smartWallet = await fetch("/api/serverwallet");
      const data: ServerWalletResponse = await smartWallet.json();

      const rawPermissions = await getRawPermissions(
        userAddress!,
        data.smartAccountAddress!
      );

      const requiredAmount = BigInt(10_000);
      let remainingAmount = requiredAmount;
      const spendCalls: any[] = [];

      for (const perm of rawPermissions) {
        if (remainingAmount <= 0) break;

        const status = await getPermissionStatus(perm);

        if (status.remainingSpend <= BigInt(0)) continue;

        const spendAmount =
          remainingAmount > status.remainingSpend
            ? status.remainingSpend
            : remainingAmount;

        const call = await prepareSpendCallData(perm, spendAmount);
        spendCalls.push(call);

        remainingAmount -= spendAmount;
      }

      if (remainingAmount > BigInt(0)) {
        throw new Error(
          `Not enough permission to cover the required amount. Still need ${Number(
            remainingAmount
          )} units`
        );
      }

      console.log("Spend calls to send:", spendCalls);

      const res = await axios.post("/api/swap", {
        tokenAddress: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
        sender: userAddress,
        amount: requiredAmount.toString(),
        spendCalls,
      });

      if (res.data.success) {
        toast.success("Token swap transaction sent successfully");
        console.log("Transaction response:", res.data);
      } else {
        toast.error("Transaction failed: " + res.data.error);
      }
    } catch (err) {
      console.error("Error sending token swap transaction:", err);
      toast.error("Error sending token swap transaction");
    }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-base-blue"></div>
      </div>
    );
  }
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Coinbase Agent
              </h1>
            </div>
            {isAuthenticated && (
              <Button onClick={handleSignOut}>Sign-Out</Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isAuthenticated ? (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Coinbase Agent
            </h2>

            <div className="flex justify-center">
              <SignInWithBaseButton
                onSignIn={handleSignIn}
                colorScheme="light"
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Wallet Section */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Wallet & Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <SpendSection />
                    <div className="pt-4 border-t space-y-4">
                      <p className="text-sm text-gray-600 text-center">
                        💬 Use the chat assistant to send USDC transactions with natural language commands like &quot;send 0.1 USDC to 0x...&quot;
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={sendTransaction} variant="outline" size="sm">
                          Send Transaction
                        </Button>
                        <Button onClick={swapTokens} variant="outline" size="sm">
                          Swap Tokens
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chat Section */}
              <div>
                <Card className="h-[700px] flex flex-col overflow-hidden">
                  <CardHeader className="border-b flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="h-6 w-6 text-primary" />
                        <CardTitle>Gemini Chat Assistant</CardTitle>
                      </div>
                      {messages.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearChat}
                          className="flex items-center gap-2"
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
          </div>
        )}
      </div>
    </main>
  );
}
