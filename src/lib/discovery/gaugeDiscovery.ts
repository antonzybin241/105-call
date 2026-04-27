import type { Address, PublicClient } from "viem";
import { clGaugeAbi } from "@/constants/contracts";

/** Minimal ERC721 `ownerOf` for Slipstream NFPM verification */
const ownerOfAbi = [
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Returns NFT token IDs the depositor has staked in the Aerodrome CL gauge
 * (on-chain `stakedValues` — no log scan required).
 */
export async function getGaugeDeposits(
  publicClient: PublicClient,
  gaugeAddress: Address,
  depositor: Address,
  _fromBlock: bigint
): Promise<string[]> {
  void _fromBlock;
  const ids = await publicClient.readContract({
    address: gaugeAddress,
    abi: clGaugeAbi,
    functionName: "stakedValues",
    args: [depositor],
  });
  return (ids as readonly bigint[]).map((id) => id.toString());
}

/** Keeps only token IDs whose NFPM owner is still the gauge (still staked). */
export async function verifyOwnership(
  publicClient: PublicClient,
  nfpmAddress: Address,
  tokenIds: string[],
  gaugeAddress: Address
): Promise<string[]> {
  if (tokenIds.length === 0) return [];

  const results = await publicClient.multicall({
    contracts: tokenIds.map((id) => ({
      address: nfpmAddress,
      abi: ownerOfAbi,
      functionName: "ownerOf" as const,
      args: [BigInt(id)],
    })),
    allowFailure: true,
  });

  const g = gaugeAddress.toLowerCase();
  return tokenIds.filter((id, i) => {
    const r = results[i];
    if (r.status !== "success" || !r.result) return false;
    return (r.result as Address).toLowerCase() === g;
  });
}
