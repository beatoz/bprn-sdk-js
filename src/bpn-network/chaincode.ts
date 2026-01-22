/** @format */

import * as web3Account from "@beatoz/web3-accounts"
import { Contract } from "fabric-network"
import { Account, SigMsg, generateChaincodeAddress } from "../types"
import { ContractListener, ListenerOptions } from "fabric-network/lib/events"
import { BpnNetwork, BPRN_CHAIN_TYPE, ChainType } from "./bpn-network"
import { ChainId } from "./chainid/chainid"

export class Chaincode {
	constructor(
		public readonly channelName: string,
		public readonly contract: Contract,
		public readonly chainType: ChainType = BPRN_CHAIN_TYPE,
		public readonly chainId: ChainId,
	) {}

	static async create2<T extends Chaincode>(
		bpnNetwork: BpnNetwork,
		dAppChaincodeName: string,
		ChaincodeClass: new (channelName: string, contract: Contract, chainType: ChainType) => T
	): Promise<T> {
		const contract = await bpnNetwork.getContract(dAppChaincodeName)
		const channelName = bpnNetwork.getChannelName()
		return new ChaincodeClass(channelName, contract, bpnNetwork.chainType)
	}

	public chaincodeName(): string {
		return this.contract.chaincodeId
	}

	public chaincodeAddress(prefix0x: boolean = false): string {
		const chaincodeAddr = generateChaincodeAddress(this.channelName, this.chaincodeName())
		return prefix0x ? `0x${chaincodeAddr}` : chaincodeAddr
	}

	public async queryRaw(functionName: string, args: string[] = []): Promise<any> {
		try {
			return await this.contract.evaluateTransaction(functionName, ...args)
		} catch (error) {
			throw new Error(`Failed to query chaincode function ${functionName}: ${error instanceof Error ? error.message : String(error)}`)
		}
	}

	public async query(functionName: string, args: string[] = []): Promise<any> {
		const response = await this.queryRaw(functionName, args)
		return response.toString()
		//return JSON.parse(result.toString())
	}

	public async submitTransaction(functionName: string, args: string[]): Promise<string> {
		try {
			const result = await this.contract.submitTransaction(functionName, ...args)
			return result.toString()
		} catch (error) {
			throw new Error(`Failed to submit transaction ${functionName} with args ${args}: ${error instanceof Error ? error.message : String(error)}`)
		}
	}

	public async submit(functionName: string, args: string[]): Promise<{ transactionId: string; payload: any }> {
		try {
			const transaction = this.contract.createTransaction(functionName)
			const result = await transaction.submit(...args)

			// Get transaction ID
			const transactionId = transaction.getTransactionId()

			// Parse result if it's valid JSON, otherwise return as string
			let payload: any
			try {
				const resultString = result.toString()
				payload = resultString ? JSON.parse(resultString) : null
			} catch (parseError) {
				// If JSON parsing fails, return as string
				payload = result.toString()
			}

			return {
				transactionId,
				payload,
			}
		} catch (error) {
			throw new Error(`Failed to submit transaction ${functionName} with args ${args}: ${error instanceof Error ? error.message : String(error)}`)
		}
	}

	async addEventListener(listener: ContractListener, options?: ListenerOptions) {
		await this.contract.addContractListener(listener, options)
	}

	async invoke(functionName: string, args: string[]): Promise<any> {
		const response = await this.submit(functionName, [...args])
		return response.payload
	}

	async invokeWithSig(signerAccount: Account, functionName: string, args: string[]): Promise<any> {
		args[0] = this.generateSignature(signerAccount, functionName, args)
		return this.invoke(functionName, args)
	}

	public async queryWithSig(signerAccount: Account, functionName: string, args: string[] = []): Promise<any> {
		args[0] = this.generateSignature(signerAccount, functionName, args)
		const response = await this.queryRaw(functionName, args)
		return response.toString()
	}

	protected generateSignature(signerAccount: Account, functionName: string, args: string[] = []) {
		const sigMsg = new SigMsg(this.chaincodeName(), functionName, args).serialize()

		// for (let i = 0; i < args.length; i++) {
		// 	console.log("args[i]: ", args[i])
		// }
		//
		// const sigMsgHex = Buffer.from(sigMsg).toString('hex')
		// console.log("sigMsgHex: ", sigMsgHex)

		return web3Account.sign(sigMsg, signerAccount.privateKey).toHex()
	}
}
