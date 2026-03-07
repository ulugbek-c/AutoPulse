"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { PREDICTION_MARKET_ABI, CONTRACT_ADDRESS } from "@/constants";
import { parseUnits } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ERC20_ABI } from "@/constants";
import toast from "react-hot-toast";

export function usePredictionMarket() {
    const { writeContract, data: hash, isPending: isBetting, error: writeError } = useWriteContract();
    const queryClient = useQueryClient();

    const { isLoading: isWaiting, isSuccess: isBetSuccess, error: txError } = useWaitForTransactionReceipt({
        hash,
    });

    useEffect(() => {
        if (isBetSuccess) {
            toast.success("Transaction confirmed!");
            queryClient.invalidateQueries();
        }
    }, [isBetSuccess, queryClient]);

    useEffect(() => {
        if (writeError) {
            const errorMessage = writeError instanceof Error ? writeError.message : "Transaction failed";
            toast.error(errorMessage);
        }
    }, [writeError]);

    useEffect(() => {
        if (txError) {
            const errorMessage = txError instanceof Error ? txError.message : "Transaction failed";
            toast.error(errorMessage);
        }
    }, [txError]);

    const { data: marketCount } = useReadContract({
        abi: PREDICTION_MARKET_ABI,
        address: CONTRACT_ADDRESS,
        functionName: "marketCount",
    });

    const placeBet = (marketId: bigint, opinion: boolean, amount: string, tokenAddress: string = "0x0000000000000000000000000000000000000000", decimals: number = 18) => {
        if (!amount || Number(amount) <= 0) {
            toast.error("Invalid bet amount");
            return;
        }

        const isEth = tokenAddress === "0x0000000000000000000000000000000000000000";
        const parsedAmount = parseUnits(amount, decimals);

        writeContract({
            abi: PREDICTION_MARKET_ABI,
            address: CONTRACT_ADDRESS,
            functionName: "placeBet",
            args: [marketId, opinion, isEth ? 0n : parsedAmount],
            value: isEth ? parsedAmount : 0n,
        });
    };

    const createMarket = (
        priceFeed: string,
        targetPrice: bigint,
        duration: bigint,
        isAiPowered: boolean = false,
        isPrivate: boolean = false,
        betToken: string = "0x0000000000000000000000000000000000000000"
    ) => {
        if (targetPrice <= 0n || duration <= 0n) {
            toast.error("Invalid market parameters");
            return;
        }

        writeContract({
            abi: PREDICTION_MARKET_ABI,
            address: CONTRACT_ADDRESS,
            functionName: "createMarket",
            args: [
                priceFeed as `0x${string}`,
                targetPrice,
                duration,
                isAiPowered,
                isPrivate,
                betToken as `0x${string}`,
            ],
        });
    };

    const claimWinnings = (marketId: bigint) => {
        writeContract({
            abi: PREDICTION_MARKET_ABI,
            address: CONTRACT_ADDRESS,
            functionName: "claimWinnings",
            args: [marketId],
        });
    };

    return {
        marketCount,
        placeBet,
        createMarket,
        claimWinnings,
        isBetting: isBetting || isWaiting,
        isBetSuccess,
        txHash: hash,
    };
}

export function useTokenApproval(tokenAddress: string, spender: string, amount: string, decimals: number = 18) {
    const { writeContract, data: hash, isPending: isApproving, error: writeError } = useWriteContract();
    const queryClient = useQueryClient();

    const { isLoading: isWaiting, isSuccess: isApproveSuccess, error: txError } = useWaitForTransactionReceipt({
        hash,
    });

    useEffect(() => {
        if (isApproveSuccess) {
            toast.success("Token approval confirmed!");
            queryClient.invalidateQueries();
        }
    }, [isApproveSuccess, queryClient]);

    useEffect(() => {
        if (writeError) {
            const errorMessage = writeError instanceof Error ? writeError.message : "Approval failed";
            toast.error(errorMessage);
        }
    }, [writeError]);

    useEffect(() => {
        if (txError) {
            const errorMessage = txError instanceof Error ? txError.message : "Approval failed";
            toast.error(errorMessage);
        }
    }, [txError]);

    const approve = () => {
        if (!amount || Number(amount) <= 0) {
            toast.error("Invalid approval amount");
            return;
        }

        writeContract({
            abi: ERC20_ABI,
            address: tokenAddress as `0x${string}`,
            functionName: "approve",
            args: [spender as `0x${string}`, parseUnits(amount, decimals)],
        });
    };

    return {
        approve,
        isApproving: isApproving || isWaiting,
        isApproveSuccess,
        hash,
    };
}

export function useUserBets(marketId: bigint, userAddress?: `0x${string}`) {
    const { data: yesBets } = useReadContract({
        abi: PREDICTION_MARKET_ABI,
        address: CONTRACT_ADDRESS,
        functionName: "yesBets",
        args: [marketId, userAddress!],
        query: {
            enabled: !!userAddress,
        },
    });

    const { data: noBets } = useReadContract({
        abi: PREDICTION_MARKET_ABI,
        address: CONTRACT_ADDRESS,
        functionName: "noBets",
        args: [marketId, userAddress!],
        query: {
            enabled: !!userAddress,
        },
    });

    return {
        yesBets: yesBets || 0n,
        noBets: noBets || 0n,
        hasBet: (yesBets || 0n) > 0n || (noBets || 0n) > 0n,
    };
}

export function useMarketData(marketId: bigint) {
    return useReadContract({
        abi: PREDICTION_MARKET_ABI,
        address: CONTRACT_ADDRESS,
        functionName: "markets",
        args: [marketId],
    });
}
