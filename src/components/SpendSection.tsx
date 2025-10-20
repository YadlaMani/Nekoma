/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  requestSpendPermission,
} from "@base-org/account/spend-permission/browser";
import { createBaseAccountSDK } from "@base-org/account";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./ui/table";
import {
  getUserSpendPermissions,
  SpendPermissionSummary,
} from "@/utils/spendUtils";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

interface ServerWalletResponse {
  address: string;
  smartAccountAddress?: string;
}

const CHAIN_ID = 8453; // Base mainnet

const USDC = {
  symbol: "USDC",
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  decimals: 6,
};

const SpendSection = () => {
  const [userAddress, setUserAddress] = useState<string>("");
  const [spenderAddress, setSpenderAddress] = useState<string>("");
  const [permissions, setPermissions] = useState<SpendPermissionSummary[]>([]);
  const [dailyLimit, setDailyLimit] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [fetchingPermissions, setFetchingPermissions] = useState(false);

  const fetchServerWallet = async () => {
    try {
      const res = await fetch("/api/serverwallet");
      const data: ServerWalletResponse = await res.json();
      setUserAddress(data.address);
      if (data.smartAccountAddress) {
        setSpenderAddress(data.smartAccountAddress);
      }
    } catch {
      toast.error("Failed to fetch server wallet");
    }
  };

  const fetchUserPermissions = useCallback(async () => {
    if (!userAddress || !spenderAddress) return;
    setFetchingPermissions(true);
    try {
      const fetchedPermissions = await getUserSpendPermissions(
        userAddress,
        spenderAddress
      );
      setPermissions(fetchedPermissions);
    } catch {
      toast.error("Failed to fetch permissions");
    } finally {
      setFetchingPermissions(false);
    }
  }, [userAddress, spenderAddress]);

  useEffect(() => {
    fetchServerWallet();
  }, []);

  useEffect(() => {
    if (userAddress && spenderAddress) {
      fetchUserPermissions();
    }
  }, [userAddress, spenderAddress, fetchUserPermissions]);

  const formatAllowance = (allowance: string): string => {
    try {
      const amount = Number(allowance) / Math.pow(10, USDC.decimals);
      return `${amount.toFixed(2)} ${USDC.symbol}`;
    } catch {
      return allowance;
    }
  };

  const handleAllocate = async () => {
    if (!userAddress || !spenderAddress) {
      toast.error("Wallet addresses not loaded yet");
      return;
    }

    setLoading(true);

    try {
      const allowanceAmount = BigInt(
        Math.floor(dailyLimit * Math.pow(10, USDC.decimals))
      );

      await requestSpendPermission({
        account: userAddress as `0x${string}`,
        spender: spenderAddress as `0x${string}`,
        token: USDC.address as `0x${string}`,
        chainId: CHAIN_ID,
        allowance: allowanceAmount,
        periodInDays: 1,
        provider: createBaseAccountSDK({
          appName: "Coinbase Agent",
        }).getProvider(),
      });

      toast.success("Spend permission allocated");

      await fetchUserPermissions();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to allocate permission"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <span>Spend Permissions (USDC Only)</span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUserPermissions}
            disabled={fetchingPermissions || !userAddress || !spenderAddress}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 ${fetchingPermissions ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
        <p className="text-sm text-gray-300">
          Grant or revoke spend permissions to allow the agent to purchase
          tokens on your behalf.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <Label className="text-white mb-2">Daily Limit (USDC)</Label>
            <Input
              type="number"
              min={0}
              step={0.1}
              value={dailyLimit}
              onChange={(e: any) => setDailyLimit(Number(e.target.value))}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button
              onClick={handleAllocate}
              disabled={loading || !userAddress || !spenderAddress}
              className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-400 hover:via-blue-500 hover:to-blue-600 text-white font-semibold shadow-2xl border border-blue-400/30 transition-all duration-300 hover:shadow-blue-500/25 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:via-transparent before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
            >
              {loading ? "Allocating..." : "Grant Permission"}
            </Button>
          </div>
        </div>

        {!userAddress || !spenderAddress ? (
          <div className="text-center py-4 text-gray-400">
            Loading wallet addresses...
          </div>
        ) : (
          <>
            <div className="mb-4 p-3 bg-white/10 rounded text-sm border border-white/10">
              <p className="text-gray-300">
                <strong className="text-white">User Address:</strong> {userAddress}
              </p>
              <p className="text-gray-300">
                <strong className="text-white">Spender Address:</strong> {spenderAddress}
              </p>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-gray-300">Token</TableHead>
                  <TableHead className="text-gray-300">Daily Allowance</TableHead>
                  <TableHead className="text-gray-300">Account</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fetchingPermissions ? (
                  <TableRow className="border-white/10">
                    <TableCell
                      colSpan={5}
                      className="text-center text-gray-400"
                    >
                      Loading permissions...
                    </TableCell>
                  </TableRow>
                ) : permissions.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell
                      colSpan={5}
                      className="text-center text-gray-400"
                    >
                      No spend permissions granted yet
                    </TableCell>
                  </TableRow>
                ) : (
                  [...permissions].reverse().map((p, index) => (
                    <TableRow key={`${p.token}-${index}`} className="border-white/10">
                      <TableCell className="font-medium text-white">USDC</TableCell>
                      <TableCell className="text-gray-300">{formatAllowance(p.allowance)}</TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {p.account.slice(0, 6)}...{p.account.slice(-4)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          {p.status === "Active"
                            ? "Active"
                            : p.status === "Expired"
                            ? "Expired"
                            : "Revoked"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="destructive" size="sm" className="bg-red-600/80 hover:bg-red-600">
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </>
        )}

        <div className="mt-4 text-xs text-gray-400">
          <p>
            Spend permissions are fetched directly from the blockchain and allow
            the agent to spend the specified amount per day. You can revoke them
            anytime. Gas fees are sponsored automatically.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpendSection;
