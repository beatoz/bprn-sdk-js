/** @format */

import * as web3Account from "@beatoz/web3-accounts"
import { Contract, Transaction } from "fabric-network"
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

	async addEventListener(listener: ContractListener, options?: ListenerOptions) {
		await this.contract.addContractListener(listener, options)
	}

	public async queryTransaction(transaction: Transaction, functionName: string, args: string[] = []): Promise<any> {
		try {
			return await transaction.evaluate(...args)
		} catch (error) {
			throw new Error(`Failed to query transaction ${functionName} with args ${args}: ${error instanceof Error ? error.message : String(error)}`)
		}
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

	public async submit(functionName: string, args: string[]): Promise<{ transactionId: string; payload: any }> {
		const transaction = this.contract.createTransaction(functionName)
		return await this.submitTransaction(transaction, functionName, args)
	}

	public async submitTransaction(transaction: Transaction, functionName: string, args: string[]): Promise<{ transactionId: string; payload: any }> {
		try {
			const result = await transaction.submit(...args)
			const transactionId = transaction.getTransactionId()

			let payload: any
			try {
				const resultString = result.toString()
				payload = resultString ? JSON.parse(resultString) : null
			} catch (parseError) {
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

	async invoke(functionName: string, args: string[]): Promise<any> {
		const response = await this.submit(functionName, [...args])
		return response.payload
	}

	async invokeWithSig(signerAccount: Account, functionName: string, args: string[]): Promise<any> {
		const transaction = this.contract.createTransaction(functionName)
		const sig = this.generateSignature(signerAccount, transaction.getTransactionId(), functionName, args)
		args[0] = sig

		const response = await this.submitTransaction(transaction, functionName, args)
		return response.payload
	}

	public async queryWithSig(signerAccount: Account, functionName: string, args: string[] = []): Promise<any> {
		const transaction = this.contract.createTransaction(functionName)
		const sig = this.generateSignature(signerAccount, transaction.getTransactionId(), functionName, args)
		args[0] = sig

		const response = await this.queryTransaction(transaction, functionName, args)
		return response.toString()
	}

	protected generateSignature(signerAccount: Account, txid: string, functionName: string, args: string[] = []) {
		const sigMsg = new SigMsg(txid, this.chaincodeName(), functionName, args).serialize()
		return web3Account.sign(sigMsg, signerAccount.privateKey).toHex()
	}
}
