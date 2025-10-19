import { useState, useCallback } from 'react';
import { getRawPermissions } from '@/utils/spendUtils';
import { getPermissionStatus } from '@base-org/account/spend-permission/browser';
import { prepareSpendCallData } from '@base-org/account/spend-permission/browser';
import axios from 'axios';

interface SwapParams {
  tokenAddress: string;
  amount: string;
  amountUSD: number;
  userAddress: string;
  smartAccountAddress: string;
  tokenSymbol?: string;
}

interface SwapResult {
  success: boolean;
  message: string;
  error?: string;
  transactionHash?: string;
  explorerUrl?: string;
  details?: Record<string, unknown>;
}

export const useSwapWithPermissions = () => {
  const [isExecuting, setIsExecuting] = useState(false);

  const executeSwap = useCallback(async (params: SwapParams): Promise<SwapResult> => {
    setIsExecuting(true);
    
    try {
      const maxRetries = 5;
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const { tokenAddress, amount, amountUSD, userAddress, smartAccountAddress, tokenSymbol } = params;

          console.log(`Swap attempt ${attempt}/${maxRetries}:`, { 
            tokenAddress, 
            tokenSymbol, 
            amountUSD, 
            userAddress 
          });

          const rawPermissions = await getRawPermissions(userAddress, smartAccountAddress);

          if (!rawPermissions || rawPermissions.length === 0) {
            return {
              success: false,
              message: "No spend permissions found. Please set up spend permissions first.",
              error: "No permissions available"
            };
          }

          const requiredAmount = BigInt(amount);
          let remainingAmount = requiredAmount;
          const spendCalls: unknown[] = [];

          for (const perm of rawPermissions) {
            if (remainingAmount <= 0) break;

            const status = await getPermissionStatus(perm);

            if (status.remainingSpend <= BigInt(0)) continue;

            const spendAmount = remainingAmount > status.remainingSpend 
              ? status.remainingSpend 
              : remainingAmount;

            const call = await prepareSpendCallData(perm, spendAmount);
            spendCalls.push(call);

            remainingAmount -= spendAmount;
          }

          if (remainingAmount > BigInt(0)) {
            return {
              success: false,
              message: `Insufficient spend permission allowance. Need ${Number(remainingAmount) / 1_000_000} more USDC in permissions.`,
              error: "Insufficient permissions"
            };
          }

          console.log(`Executing ${spendCalls.length} spend calls for swap (attempt ${attempt})...`);

          const response = await axios.post('/api/swap', {
            tokenAddress,
            sender: userAddress,
            amount: amount,
            spendCalls,
          });

          if (response.data.success) {
            console.log(`Swap successful on attempt ${attempt}`);
            const tokenName = tokenSymbol || `token at ${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`;
            
            return {
              success: true,
              message: `Swap successful! Exchanged $${amountUSD} USDC for ${tokenName}${attempt > 1 ? ` (succeeded on attempt ${attempt})` : ''}`,
              transactionHash: response.data.tradeTransactionHash,
              explorerUrl: response.data.explorerUrl || "https://account.base.app/activity",
              details: response.data
            };
          } else {
            throw new Error(response.data.error || 'Swap failed');
          }

        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          console.error(`Swap attempt ${attempt}/${maxRetries} failed:`, lastError.message);
          
          if (attempt === maxRetries) {
            break;
          }
          
          const waitTime = Math.pow(2, attempt - 1) * 1000;
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

      return {
        success: false,
        message: `Swap failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
        error: lastError?.message || 'Unknown error'
      };
      
    } finally {
      setIsExecuting(false);
    }
  }, []);

  return {
    executeSwap,
    isExecuting
  };
};
