/** @format */

import * as web3Account from "@beatoz/web3-accounts"
import { Address } from "../../types/address"
import { EvmTxParamGenerator } from "./evm-tx-param-generator"
import { Account } from "../../types/account"
import { Erc20Chaincode } from "../erc20-chaincode"
import { SigMsgGenerator } from "./sig-msg-generator"
import { Erc20Args } from "../types/erc20-args"
import { EvmTransactionParam } from "../types/evm-transaction-param"

const SUPPORTED_FUNCTIONS = ["_mint", "_burn", "transfer", "approve", "increaseAllowance", "decreaseAllowance", "transferFrom"]

export class Erc20ArgsGenerator {
	readonly evmTxParamFactory: EvmTxParamGenerator
	readonly sigMsgGenerator: SigMsgGenerator

	constructor() {
		this.evmTxParamFactory = new EvmTxParamGenerator()
		this.sigMsgGenerator = new SigMsgGenerator()
	}

	async createArgs(signer: Account, chaincode: Erc20Chaincode, chaincodeFunctionName: string, chaincodeArgs: string[]): Promise<Erc20Args> {
		const processedArgs = this.convertArguments(chaincodeFunctionName, chaincodeArgs)
		const evmTxParam = await this.evmTxParamFactory.create(signer, chaincode, processedArgs)
		const signature = this.createSignature(chaincode.chaincodeName(), chaincodeFunctionName, evmTxParam, signer)

		return new Erc20Args(evmTxParam, processedArgs, signature)
	}

	createSignature(chaincodeName: string, chaincodeFunction: string, rlpParam: EvmTransactionParam, signer: Account): string {
		try {
			const sigMsg = this.sigMsgGenerator.createSigMsg(chaincodeName, chaincodeFunction, rlpParam)
			const signature = web3Account.sign(sigMsg, signer.privateKey)
			return signature.toHex()
		} catch (error: any) {
			throw new Error(`Failed to create signed transaction: ${error.message}`)
		}
	}

	convertArguments(ccfunc: string, param: string[]): string[] {
		if (!SUPPORTED_FUNCTIONS.includes(ccfunc)) {
			throw new Error(`Unsupported function: ${ccfunc}`)
		}

		const processedParam = [...param]

		if (["_mint", "_burn", "transfer", "approve", "increaseAllowance", "decreaseAllowance"].includes(ccfunc)) {
			if (processedParam.length !== 2) {
				throw new Error(`Invalid number of parameters for function ${ccfunc}. Expected 2, got ${processedParam.length}`)
			}
			processedParam[0] = this.processAddress(processedParam[0])
			//processedParam[0] = new Address(processedParam[0]).toHexString();
			processedParam[1] = this.bigIntParamToHex(processedParam[1])
		} else if (ccfunc === "transferFrom") {
			if (processedParam.length !== 3) {
				throw new Error(`Invalid number of parameters for function ${ccfunc}. Expected 3, got ${processedParam.length}`)
			}
			processedParam[0] = this.processAddress(processedParam[0])
			processedParam[1] = this.processAddress(processedParam[1])
			processedParam[2] = this.bigIntParamToHex(processedParam[2])
		}

		return processedParam
	}

	processAddress(address: string): string {
		if (!address) {
			throw new Error("Address cannot be empty")
		}

		if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
			return address.substring(2).toLowerCase()
		}

		// If it's already a 40-character hex string without 0x prefix
		if (/^[a-fA-F0-9]{40}$/.test(address)) {
			return address.toLowerCase()
		}

		throw new Error(`Invalid address format: ${address}`)
	}

	bigIntParamToHex(value: string): string {
		try {
			return BigInt(value).toString(16)
		} catch (error) {
			throw new Error(`Invalid numeric value: ${value}`)
		}
	}
}
