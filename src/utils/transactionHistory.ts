interface Transaction {
  id: string;
  type: "transfer" | "swap";
  amount: string;
  token: string;
  recipient?: string;
  fromToken?: string;
  toToken?: string;
  txHash: string;
  timestamp: Date;
  status: "pending" | "completed" | "failed";
  explorerUrl: string;
}

export const addTransactionToHistory = (
  userAddress: string,
  transaction: Omit<Transaction, "id" | "timestamp">
) => {
  if (typeof window === "undefined") return;

  const fullTransaction: Transaction = {
    ...transaction,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
  };

  const existing = localStorage.getItem(`transactions_${userAddress}`);
  const existingTransactions = existing ? JSON.parse(existing) : [];
  const updatedTransactions = [fullTransaction, ...existingTransactions];
  
  // Keep only the last 50 transactions to avoid storage bloat
  const limitedTransactions = updatedTransactions.slice(0, 50);
  
  localStorage.setItem(`transactions_${userAddress}`, JSON.stringify(limitedTransactions));

  // Trigger a custom event to update the UI
  window.dispatchEvent(new CustomEvent('transactionAdded', { 
    detail: fullTransaction 
  }));
};

export const getTransactionHistory = (userAddress: string): Transaction[] => {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(`transactions_${userAddress}`);
  if (!stored) return [];

  return JSON.parse(stored).map((tx: Transaction & { timestamp: string }) => ({
    ...tx,
    timestamp: new Date(tx.timestamp),
  }));
};

export const updateTransactionStatus = (
  userAddress: string,
  txHash: string,
  status: "pending" | "completed" | "failed"
) => {
  if (typeof window === "undefined") return;

  const transactions = getTransactionHistory(userAddress);
  const updatedTransactions = transactions.map(tx => 
    tx.txHash === txHash ? { ...tx, status } : tx
  );

  localStorage.setItem(`transactions_${userAddress}`, JSON.stringify(updatedTransactions));
  
  // Trigger a custom event to update the UI
  window.dispatchEvent(new CustomEvent('transactionUpdated', { 
    detail: { txHash, status } 
  }));
};
