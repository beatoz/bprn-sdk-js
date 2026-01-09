/** @format */

import { Account } from "../../types/account"
import { Erc20Chaincode } from "../user-chaincodes"
import { EvmTransactionParam } from "../types/evm-transaction-param"

export class EvmTxParamGenerator {
	readonly DEFAULT_GAS = 21000
	//readonly DEFAULT_GAS_PRICE = "100000000"
	readonly DEFAULT_GAS_PRICE = BigInt(100000000)

	constructor() {}

	async create(signer: Account, chaincode: Erc20Chaincode, chaincodeMethodParams: string[]): Promise<EvmTransactionParam> {
		return new EvmTransactionParam(
			1,
			await chaincode.getAddressNonce(signer.address),
			this.DEFAULT_GAS,
			this.DEFAULT_GAS_PRICE,
			chaincodeMethodParams
		)
	}

	createEvmTxParam(
		version: number,
		nonce: number,
		gas: number = this.DEFAULT_GAS,
		gasPrice: bigint = this.DEFAULT_GAS_PRICE,
		chaincodeMethodParams?: string[]
	): EvmTransactionParam {
		return new EvmTransactionParam(version, nonce, gas, gasPrice, chaincodeMethodParams)
	}

	bigIntParamToHex(value: string): string {
		try {
			return BigInt(value).toString(16)
		} catch (error) {
			throw new Error(`Invalid numeric value: ${value}`)
		}
	}
}
