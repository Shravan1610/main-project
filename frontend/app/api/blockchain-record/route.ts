import { ethers } from "ethers"
import { NextRequest, NextResponse } from "next/server"

const contractABI = [
  "function storeHash(string memory hash) public returns (bool)"
]

export async function POST(request: NextRequest) {
  try {
    const { hash } = await request.json()

    if (!hash || typeof hash !== "string") {
      return NextResponse.json(
        { error: "Invalid request: hash is required." },
        { status: 400 }
      )
    }

    const rpc = process.env.NEXT_PUBLIC_RPC_URL
    const privateKey = process.env.PRIVATE_KEY
    const contractAddress = process.env.CONTRACT_ADDRESS

    if (!rpc) {
      return NextResponse.json(
        { error: "RPC URL is not configured on this server." },
        { status: 503 }
      )
    }

    if (!privateKey) {
      return NextResponse.json(
        { error: "Blockchain signing is not configured on this server." },
        { status: 503 }
      )
    }

    if (!contractAddress) {
      return NextResponse.json(
        { error: "Contract address is not configured on this server." },
        { status: 503 }
      )
    }

    const provider = new ethers.JsonRpcProvider(rpc)
    const wallet = new ethers.Wallet(privateKey, provider)
    const contract = new ethers.Contract(contractAddress, contractABI, wallet)

    const tx = await contract.storeHash(hash)
    await tx.wait()

    return NextResponse.json({ txHash: tx.hash })
  } catch (error) {
    console.error("Blockchain record error:", error)
    return NextResponse.json(
      { error: "Failed to record hash on-chain." },
      { status: 500 }
    )
  }
}
