"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink, History, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getTransactionHistory } from "@/utils/transactionHistory";

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

interface TransactionHistoryProps {
  userAddress: string;
}

export default function TransactionHistory({ userAddress }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load transactions from localStorage on component mount
  useEffect(() => {
    if (userAddress) {
      loadTransactions();
    }
  }, [userAddress]);

  // Listen for transaction events
  useEffect(() => {
    const handleTransactionAdded = () => {
      loadTransactions();
    };

    const handleTransactionUpdated = () => {
      loadTransactions();
    };

    window.addEventListener('transactionAdded', handleTransactionAdded);
    window.addEventListener('transactionUpdated', handleTransactionUpdated);

    return () => {
      window.removeEventListener('transactionAdded', handleTransactionAdded);
      window.removeEventListener('transactionUpdated', handleTransactionUpdated);
    };
  }, []);

  const loadTransactions = () => {
    if (userAddress) {
      const txHistory = getTransactionHistory(userAddress);
      setTransactions(txHistory);
    }
  };

  const refreshTransactions = () => {
    setIsLoading(true);
    // Simulate refresh delay
    setTimeout(() => {
      loadTransactions();
      setIsLoading(false);
    }, 1000);
  };

  const formatAmount = (amount: string, decimals: number = 6) => {
    const num = parseFloat(amount) / Math.pow(10, decimals);
    return num.toFixed(decimals);
  };

  const getTransactionDescription = (tx: Transaction) => {
    if (tx.type === "transfer") {
      return `Sent ${formatAmount(tx.amount)} ${tx.token} to ${tx.recipient?.slice(0, 6)}...${tx.recipient?.slice(-4)}`;
    } else if (tx.type === "swap") {
      return `Swapped ${formatAmount(tx.amount)} ${tx.fromToken} for ${tx.toToken}`;
    }
    return "Unknown transaction";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400";
      case "pending":
        return "text-yellow-400";
      case "failed":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const openExplorer = (explorerUrl: string) => {
    window.open(explorerUrl, "_blank");
  };

  if (!userAddress) {
    return null;
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshTransactions}
            disabled={isLoading}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No transactions yet</p>
            <p className="text-sm text-gray-500">Your transaction history will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/20">
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Description</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Time</TableHead>
                  <TableHead className="text-gray-300">Explorer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-white">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tx.type === "transfer" 
                          ? "bg-blue-500/20 text-blue-300" 
                          : "bg-purple-500/20 text-purple-300"
                      }`}>
                        {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-300 max-w-xs">
                      <div className="truncate">
                        {getTransactionDescription(tx)}
                      </div>
                    </TableCell>
                    <TableCell className={getStatusColor(tx.status)}>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          tx.status === "completed" ? "bg-green-400" :
                          tx.status === "pending" ? "bg-yellow-400" : "bg-red-400"
                        }`} />
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openExplorer(tx.explorerUrl)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
