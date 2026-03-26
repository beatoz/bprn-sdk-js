/** @format */

import * as web3Account from "@beatoz/web3-accounts"
import { Contract, Transaction } from "fabric-network"
import { Account, SigMsg, generateChaincodeAddress } from "../types"
import { ContractListener, ListenerOptions } from "fabric-network/lib/events"
import { BpnNetwork, BPRN_CHAIN_TYPE, ChainType } from "./bpn-network"
import { ChainId } from "./chainid/chainid"

export interface ChaincodeSignatureRequest {
	sigMsg: Uint8Array
	transactionId: string
	chaincodeName: string
	functionName: string
	args: string[]
}

export interface ChaincodeSignatureProvider {
	sign(request: ChaincodeSignatureRequest): Promise<string>
}

export type ChaincodeSigner = Account | ChaincodeSignatureProvider

export interface PreparedTransaction extends ChaincodeSignatureRequest {
	transaction: Transaction
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

	async invokeWithSig(
		signer: ChaincodeSigner,
		functionName: string,
		args: string[],
	): Promise<any> {
		const prepared = this.prepareTxWithSigMsg(functionName, args)
		const sigHex = await this.resolveSignature(signer, prepared)
		return await this.invokeWithSigHex(
			prepared.transaction,
			prepared.functionName,
			prepared.args,
			sigHex,
		)
	}

	public async queryWithSig(
		signer: ChaincodeSigner,
		functionName: string,
		args: string[] = [],
	): Promise<any> {
		const prepared = this.prepareTxWithSigMsg(functionName, args)
		const sigHex = await this.resolveSignature(signer, prepared)
		const normalizedArgs = [...prepared.args]
		normalizedArgs[0] = sigHex

		const response = await this.queryTransaction(
			prepared.transaction,
			prepared.functionName,
			normalizedArgs,
		)
		return response.toString()
	}

	protected generateSignature(
		signerAccount: Account,
		txid: string,
		functionName: string,
		args: string[] = [],
	) {
		const request = this.createSignatureRequest(txid, functionName, args)
		return web3Account
			.sign(
				request.sigMsg,
				signerAccount.requirePrivateKey("Chaincode.generateSignature"),
			)
			.toHex()
	}

	protected createSignatureRequest(
		txid: string,
		functionName: string,
		args: string[] = [],
	): ChaincodeSignatureRequest {
		const normalizedArgs = [...args]
		return {
			transactionId: txid,
			chaincodeName: this.chaincodeName(),
			functionName,
			args: normalizedArgs,
			sigMsg: new SigMsg(
				txid,
				this.chaincodeName(),
				functionName,
				normalizedArgs,
			).serialize(),
		}
	}

	protected isChaincodeSignatureProvider(
		signer: ChaincodeSigner,
	): signer is ChaincodeSignatureProvider {
		return typeof (signer as ChaincodeSignatureProvider).sign === "function"
	}

	protected async resolveSignature(
		signer: ChaincodeSigner,
		request: ChaincodeSignatureRequest,
	): Promise<string> {
		if (this.isChaincodeSignatureProvider(signer)) {
			return await signer.sign(request)
		}
		return web3Account
			.sign(
				request.sigMsg,
				signer.requirePrivateKey("Chaincode.resolveSignature"),
			)
			.toHex()
	}

	// advanced path for external signer
	public prepareTxWithSigMsg(
		functionName: string,
		args: string[] = [],
	): PreparedTransaction {
		const transaction = this.contract.createTransaction(functionName)
		const request = this.createSignatureRequest(
			transaction.getTransactionId(),
			functionName,
			args,
		)
		return {
			transaction,
			...request,
		}
	}
    
	// for external signer
	async invokeWithSigHex(transaction: Transaction, functionName: string, args: string[] = [], sigHex: string): Promise<any> {
		const normalizedArgs = [...args]
		normalizedArgs[0] = sigHex
		const response = await this.submitTransaction(transaction, functionName, normalizedArgs)
		return response.payload
	}
}  
