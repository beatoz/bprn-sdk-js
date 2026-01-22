/** @format */

import { Chaincode } from "../../bpn-network"
import { Address, Account } from "../../types"
import { CliChaincodeInvoker } from "../../cli"
import { BpnNetwork } from "../../bpn-network"

export interface Erc20ChaincodeInfo {
	chaincodeName: string
	name: string
	symbol: string
	decimal: string
}

export interface Erc20BasicInfo {
	name: string
	symbol: string
	decimals: string
}

export class Erc20ChaincodeV2 extends Chaincode {
	erc20ChaincodeInfo!: Erc20ChaincodeInfo

	static async create(bpnNetwork: BpnNetwork, dAppChaincodeName: string) {
		const contract = await bpnNetwork.getContract(dAppChaincodeName)
		const channelName = bpnNetwork.getChannelName()
		return new Erc20ChaincodeV2(channelName, contract, bpnNetwork.chainType, bpnNetwork.chainId)
	}

	init(
		cliInvoker: CliChaincodeInvoker,
		ownerAccount: Account,
		name: string,
		symbol: string,
		decimal: string,
		initAmount: string,
		ownerAddress: string,
		ownerChaincodeName: string = ""
	) {
		this.erc20ChaincodeInfo = { chaincodeName: this.chaincodeName(), name, symbol, decimal }
		const chaincodeFunctionName = "InitLedger"
		const chaincodeArgs = ["", name, symbol, decimal, initAmount]
		chaincodeArgs[0] = super.generateSignature(ownerAccount, chaincodeFunctionName, chaincodeArgs)

		cliInvoker.invoke(this.channelName, this.chaincodeName(), chaincodeFunctionName, chaincodeArgs, true)
	}

	async info() {
		if (!this.erc20ChaincodeInfo) {
			this.erc20ChaincodeInfo = {
				chaincodeName: this.chaincodeName(),
				name: await this.name(),
				symbol: await this.symbol(),
				decimal: "18",
			}
		}
		return this.erc20ChaincodeInfo
	}

	async mint(fromAccount: Account, toAddress: Address, mintAmount: string) {
		return await this.invokeWithSig(fromAccount, "Mint", ["", toAddress.toString(), mintAmount])
	}

	async transfer(fromAccount: Account, toAddress: Address, amount: string) {
		return await this.invokeWithSig(fromAccount, "Transfer", ["", toAddress.toString(), amount])
	}

	async approve(signer: Account, spender: string, amount: string) {
		return await this.invokeWithSig(signer, "transfer", [spender, amount])
	}

	async transferFrom(signer: Account, from: string, to: string, amount: string): Promise<string> {
		const transferFromPayload = await this.invokeWithSig(signer, "transfer", [from, to, amount])
		return transferFromPayload.amount
	}

	async totalSupply(): Promise<string> {
		return await this.query("totalSupply", [])
	}

	async getAddressNonce(address: string): Promise<number> {
		const addressNoncePayload = await this.query("getAddressNonce", [address])
		return addressNoncePayload.nonce
	}

	async checkOwner(address: string): Promise<string> {
		const ownerAddress = await this.query("CheckOwner", [address])
		return ownerAddress
		//return BigInt(balanceOf.balance).toString()
	}

	async owner(): Promise<string> {
		return await this.query("Owner", [])
	}

	async balanceOf(address: string): Promise<string> {
		//const balanceOfPayload = await this.query("balanceOf", [address.toHexString()])
		return await this.query("BalanceOf", [address])
		//return BigInt(balanceOf.balance).toString()
	}

	async allowance(owner: string, spender: string): Promise<string> {
		const allowancePayload = await this.query("allowance", [owner, spender])
		return allowancePayload.allowance
	}

	async symbol(): Promise<string> {
		return await this.query("symbol", [])
	}

	async name(): Promise<string> {
		return await this.query("name", [])
	}

	async decimals(): Promise<string> {
		return await this.query("decimals", [])
	}

	async basicInfo(): Promise<Erc20BasicInfo> {
		return await this.query("basicInfo", [])
	}

	// async query(functionName: string, args: string[] = []): Promise<any> {
	// 	const result = await this.chaincode.query(functionName, args)
	// 	return result.query
	// }
	//
	// async invoke(signer: Account, functionName: string, args: string[]): Promise<any> {
	// 	const erc20Args = await this.erc20ArgsCreator.createArgs(signer, this, functionName, args)
	// 	const result = await this.chaincode.submit(functionName, erc20Args.toStringArray())
	// 	return result.payload.tx.payload.details
	// }
}
