import { ethers } from "ethers"
import { getBlockchainClient } from "./blockchain-client"

const contractABI = [
  "function storeHash(string memory hash) public returns (bool)"
]

export async function recordHashOnChain(hash: string) {

  const { wallet } = getBlockchainClient()

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!

  const contract = new ethers.Contract(
    contractAddress,
    contractABI,
    wallet
  )

  const tx = await contract.storeHash(hash)

  await tx.wait()

  return tx.hash
}