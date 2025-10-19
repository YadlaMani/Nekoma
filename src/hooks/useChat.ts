import { useState, useCallback } from 'react';
import { useTransferWithPermissions } from './useTransferWithPermissions';
<<<<<<< HEAD
=======
import { useSwapWithPermissions } from './useSwapWithPermissions';
>>>>>>> 21034bc643d8b42729dc17e1985311756fdb7e01

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolUsed?: {
    name: string;
    parameters?: Record<string, unknown>;
    result?: unknown;
    error?: string;
  };
}

export interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
<<<<<<< HEAD
  const { executeTransfer, isExecuting } = useTransferWithPermissions();
=======
  const { executeTransfer, isExecuting: isTransferExecuting } = useTransferWithPermissions();
  const { executeSwap, isExecuting: isSwapExecuting } = useSwapWithPermissions();
>>>>>>> 21034bc643d8b42729dc17e1985311756fdb7e01

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Prepare conversation history (last 10 messages for context)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          conversationHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();
      
      console.log('Chat API response:', JSON.stringify(data, null, 2));
<<<<<<< HEAD

      // Check if client-side execution is required
      if (data.executeClientSide && data.transactionParams) {
        console.log('Client-side execution detected!', data.transactionParams);
        
        // Add a message indicating transfer is starting
        const preparingMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response + "\n\nExecuting transfer (with retry logic)...",
=======
      console.log('executeClientSide?', data.executeClientSide);
      console.log('transactionParams?', data.transactionParams);
      console.log('swapType?', data.swapType);

      // Check if client-side execution is required
      if (data.executeClientSide && data.transactionParams) {
        console.log('✅ Client-side execution detected!', data.transactionParams);
        
        // Add a message indicating operation is starting
        const preparingMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response + `\n\nExecuting ${data.swapType ? 'swap' : 'transfer'} (with retry logic)...`,
>>>>>>> 21034bc643d8b42729dc17e1985311756fdb7e01
          timestamp: new Date(),
          ...(data.toolUsed && { toolUsed: data.toolUsed }),
        };
        
        setMessages(prev => [...prev, preparingMessage]);

<<<<<<< HEAD
        console.log('🚀 Starting client-side transfer execution...');
        
        // Execute the transfer client-side
        const transferResult = await executeTransfer(data.transactionParams);
        
        console.log('📋 Transfer result:', transferResult);
        
        // Create the final result message based on success/failure
        let resultContent = transferResult.message;
        if (transferResult.success && transferResult.explorerUrl) {
          resultContent += `\n\nView transaction: ${transferResult.explorerUrl}`;
=======
        console.log(`🚀 Starting client-side ${data.swapType ? 'swap' : 'transfer'} execution...`);
        
        let operationResult;
        try {
          if (data.swapType) {
            console.log('📊 Executing SWAP with params:', data.transactionParams);
            operationResult = await executeSwap(data.transactionParams);
          } else {
            console.log('💸 Executing TRANSFER with params:', data.transactionParams);
            operationResult = await executeTransfer(data.transactionParams);
          }
          
          console.log('📋 Operation result:', operationResult);
        } catch (executionError) {
          console.error('❌ Client-side execution failed:', executionError);
          operationResult = {
            success: false,
            message: `Execution failed: ${executionError instanceof Error ? executionError.message : 'Unknown error'}`,
            error: executionError instanceof Error ? executionError.message : 'Unknown error'
          };
        }
        
        let resultContent = operationResult.message;
        if (operationResult.success && operationResult.explorerUrl) {
          resultContent += `\n\nView transaction: ${operationResult.explorerUrl}`;
>>>>>>> 21034bc643d8b42729dc17e1985311756fdb7e01
        }
        
        const resultMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: resultContent,
          timestamp: new Date(),
          toolUsed: {
<<<<<<< HEAD
            name: 'sendUSDCTransaction',
            result: transferResult
=======
            name: data.swapType ? 'swapUSDCForToken' : 'sendUSDCTransaction',
            result: operationResult
>>>>>>> 21034bc643d8b42729dc17e1985311756fdb7e01
          }
        };

        setMessages(prev => [...prev, resultMessage]);
      } else {
        console.log('📝 Regular message response, no client-side execution needed');
<<<<<<< HEAD
=======
        console.log('🔍 Response data check:', {
          hasExecuteClientSide: !!data.executeClientSide,
          hasTransactionParams: !!data.transactionParams,
          swapType: data.swapType,
          toolUsed: data.toolUsed?.name
        });
>>>>>>> 21034bc643d8b42729dc17e1985311756fdb7e01
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          ...(data.toolUsed && { toolUsed: data.toolUsed }),
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [messages, executeTransfer, executeSwap]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
<<<<<<< HEAD
    isLoading: isLoading || isExecuting,
=======
    isLoading: isLoading || isTransferExecuting || isSwapExecuting,
>>>>>>> 21034bc643d8b42729dc17e1985311756fdb7e01
    error,
    sendMessage,
    clearChat,
  };
}
