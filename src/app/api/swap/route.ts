/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getServerWalletForUser, getCdpClient } from "@/utils/cdp";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

// USDC contract address on Base
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
// Permit2 contract
const PERMIT2_ADDRESS = "0x000000000022d473030f116ddee9f6b43ac78ba3";

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export async function POST(req: NextRequest) {
  try {
    const session = req.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { tokenAddress, sender, amount, spendCalls } = await req.json();

    if (!amount || !sender || !spendCalls || !Array.isArray(spendCalls)) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: tokenAddress, sender, amount, or spendCalls (array)",
        },
        { status: 400 }
      );
    }

    const amt = BigInt(amount.toString());
    const serverWallet = getServerWalletForUser(sender);
    if (!serverWallet?.smartAccount) {
      return NextResponse.json(
        { error: "Server wallet not found" },
        { status: 400 }
      );
    }

    const cdpClient = getCdpClient();

    console.log(`Executing ${spendCalls.length} spend calls to pull funds...`);

    // Pull funds via spend calls
    const pullCalls = spendCalls.map((spendCall: any, index: number) => {
      const spendValue = spendCall[0];
      if (!spendValue.to) {
        throw new Error(`Spend call at index ${index} is missing 'to' field`);
      }
      const call: any = {
        to: spendValue.to as `0x${string}`,
        data: spendValue.data as `0x${string}`,
      };
      if (spendValue.value && BigInt(spendValue.value.toString()) > BigInt(0)) {
        call.value = BigInt(spendValue.value.toString());
      }
      return call;
    });

    const pullResult = await cdpClient.evm.sendUserOperation({
      smartAccount: serverWallet.smartAccount,
      network: "base",
      calls: pullCalls,
      paymasterUrl: process.env.PAYMASTER_URL,
    });

    console.log("Funds pulled into smart wallet:", pullResult.userOpHash);

    //Approve Permit2 for USDC
    console.log("Approving Permit2 contract for USDC...");
    const approveSelector = "0x095ea7b3";
    const spenderAddress = PERMIT2_ADDRESS.slice(2).padStart(64, "0");
    const maxApprovalAmount = "f".repeat(64);
    const approveData = `${approveSelector}${spenderAddress}${maxApprovalAmount}`;

    await cdpClient.evm.sendUserOperation({
      smartAccount: serverWallet.smartAccount,
      network: "base",
      calls: [
        {
          to: USDC_ADDRESS as `0x${string}`,
          data: approveData as `0x${string}`,
        },
      ],
      paymasterUrl: process.env.PAYMASTER_URL,
    });

    await new Promise((res) => setTimeout(res, 3000));

    //Swap USDC → token
    console.log(`Swapping ${amt} USDC for token ${tokenAddress}`);
    const swapResult = await serverWallet.smartAccount.swap({
      network: "base",
      fromToken: USDC_ADDRESS,
      toToken: tokenAddress,
      fromAmount: amt,
      slippageBps: 500,
      paymasterUrl: process.env.PAYMASTER_URL,
    });

    const receipt = await serverWallet.smartAccount.waitForUserOperation({
      userOpHash: swapResult.userOpHash,
    });

    if (receipt.status !== "complete") {
      throw new Error(`Swap failed with status: ${receipt.status}`);
    }

    const tradeTxHash = receipt.transactionHash;

    //Transfer swapped tokens to sender
    console.log("Transferring swapped tokens to sender...");
    const tokenBalance = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: [
        {
          name: "balanceOf",
          type: "function",
          stateMutability: "view",
          inputs: [{ type: "address" }],
          outputs: [{ type: "uint256" }],
        },
      ],
      functionName: "balanceOf",
      args: [serverWallet.smartAccount.address],
    });

    if (BigInt(tokenBalance) > BigInt(0)) {
      const transferSelector = "0xa9059cbb";
      const recipientAddress = sender.slice(2).padStart(64, "0");
      const transferAmount = BigInt(tokenBalance)
        .toString(16)
        .padStart(64, "0");
      const transferData = `${transferSelector}${recipientAddress}${transferAmount}`;

      await cdpClient.evm.sendUserOperation({
        smartAccount: serverWallet.smartAccount,
        network: "base",
        calls: [
          {
            to: tokenAddress as `0x${string}`,
            data: transferData as `0x${string}`,
          },
        ],
        paymasterUrl: process.env.PAYMASTER_URL,
      });
    }

    return NextResponse.json({
      success: true,
      message: `✅ Successfully swapped ${amount} USDC for tokens and sent them to ${sender}`,
      pullUserOpHash: pullResult.userOpHash,
      tradeTransactionHash: tradeTxHash,
      amount: amt.toString(),
      tokenAddress,
      explorerUrl: `https://account.base.app/activity`,
    });
  } catch (err) {
    console.error("Swap + transfer error:", err);
    return NextResponse.json(
      {
        error: "Swap + transfer failed",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
