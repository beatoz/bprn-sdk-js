/** @format */

import * as web3Account from "@beatoz/web3-accounts"
import { Contract, Transaction } from "fabric-network"
import { Account, SigMsg, generateChaincodeAddress } from "../types"
import { ContractListener, ListenerOptions } from "fabric-network/lib/events"
import { BpnNetwork, BPRN_CHAIN_TYPE, ChainType } from "./bpn-network"
import { ChainId } from "./chainid/chainid"

export interface PreparedSignatureInvocation {
	transaction: Transaction
	transactionId: string
	functionName: string
	args: string[]
	sigMsg: Uint8Array
	chaincodeName: string
}

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

	createSignatureMessage(txid: string, functionName: string, args: string[] = []) {
		return new SigMsg(txid, this.chaincodeName(), functionName, args).serialize()
	}

	prepareSignature(functionName: string, args: string[] = []): PreparedSignatureInvocation {
		const transaction = this.contract.createTransaction(functionName)
		const transactionId = transaction.getTransactionId()
		const normalizedArgs = [...args]
		return {
			transaction,
			transactionId,
			functionName,
			args: normalizedArgs,
			sigMsg: this.createSignatureMessage(transactionId, functionName, normalizedArgs),
			chaincodeName: this.chaincodeName(),
		}
	}

	signPreparedInvocation(signerAccount: Account, prepared: PreparedSignatureInvocation): string {
		return web3Account.sign(prepared.sigMsg, signerAccount.requirePrivateKey("Chaincode.signPreparedInvocation")).toHex()
	}

	async invokePreparedWithSig(prepared: PreparedSignatureInvocation, sig: string): Promise<any> {
		const args = [...prepared.args]
		args[0] = sig
		const response = await this.submitTransaction(prepared.transaction, prepared.functionName, args)
		return response.payload
	}

	async queryPreparedWithSig(prepared: PreparedSignatureInvocation, sig: string): Promise<any> {
		const args = [...prepared.args]
		args[0] = sig
		const response = await this.queryTransaction(prepared.transaction, prepared.functionName, args)
		return response.toString()
	}

	async invokeWithSig(signerAccount: Account, functionName: string, args: string[]): Promise<any> {
		const prepared = this.prepareSignature(functionName, args)
		const sig = this.signPreparedInvocation(signerAccount, prepared)
		return await this.invokePreparedWithSig(prepared, sig)
	}

	public async queryWithSig(signerAccount: Account, functionName: string, args: string[] = []): Promise<any> {
		const prepared = this.prepareSignature(functionName, args)
		const sig = this.signPreparedInvocation(signerAccount, prepared)
		return await this.queryPreparedWithSig(prepared, sig)
	}

	protected generateSignature(signerAccount: Account, txid: string, functionName: string, args: string[] = []) {
		const sigMsg = this.createSignatureMessage(txid, functionName, args)
		return web3Account.sign(sigMsg, signerAccount.requirePrivateKey("Chaincode.generateSignature")).toHex()
	}
}
