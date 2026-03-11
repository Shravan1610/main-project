import { ethers } from "ethers"

export function getBlockchainClient() {

  const rpc = process.env.NEXT_PUBLIC_RPC_URL

  const provider = new ethers.JsonRpcProvider(rpc)

  const wallet = new ethers.Wallet(
    process.env.NEXT_PUBLIC_PRIVATE_KEY!,
    provider
  )

  return {
    provider,
    wallet
  }
}