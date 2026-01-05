/** @format */

import { Account } from "../../types/account"
import { Erc20Chaincode } from "../erc20-chaincode"
import { EvmTransactionParam } from "../types/evm-transaction-param"

export class EvmTxParamGenerator {
	readonly DEFAULT_GAS = 21000
	//readonly DEFAULT_GAS_PRICE = "100000000"
	readonly DEFAULT_GAS_PRICE = BigInt(100000000)

	constructor() {}

	async create(signer: Account, chaincode: Erc20Chaincode, chaincodeMethodParams: string[]): Promise<EvmTransactionParam> {
		return new EvmTransactionParam(1, await chaincode.getAddressNonce(signer.address), this.DEFAULT_GAS, this.DEFAULT_GAS_PRICE, chaincodeMethodParams)
	}

	createEvmTxParam(version: number, nonce: number, gas: number = this.DEFAULT_GAS, gasPrice: bigint = this.DEFAULT_GAS_PRICE, chaincodeMethodParams?: string[]): EvmTransactionParam {
		return new EvmTransactionParam(version, nonce, gas, gasPrice, chaincodeMethodParams)
	}

	bigIntParamToHex(value: string): string {
		try {
			return BigInt(value).toString(16)
		} catch (error) {
			throw new Error(`Invalid numeric value: ${value}`)
		}
	}

	// encode(chaincodeName: string, chaincodeFunction: string, evmTxParam: EvmTransactionParam): Array<number | string | Buffer> {
	// 	// Convert gasPrice to hex string and ensure even length
	// 	evmTxParam.gasPrice = this.bigIntParamToHex(evmTxParam.gasPrice)
	// 	const gasPriceHex = evmTxParam.gasPrice
	// 	let gasPriceParam = gasPriceHex
	// 	if (gasPriceHex.length % 2 !== 0) {
	// 		gasPriceParam = "0" + gasPriceHex
	// 	}
	//
	// 	const txArray: Array<number | string | Buffer> = [
	// 		Number(evmTxParam.version),
	// 		Number(evmTxParam.nonce),
	// 		Number(evmTxParam.gas),
	// 		Buffer.from(gasPriceParam, "hex"),
	// 		Buffer.from(chaincodeName, "utf-8"),
	// 		Buffer.from(chaincodeFunction, "utf-8"),
	// 	]
	//
	// 	// Add arguments if present
	// 	if (evmTxParam.args) {
	// 		for (const item of evmTxParam.args) {
	// 			let hexItem = item
	// 			if (hexItem.length % 2 !== 0) {
	// 				hexItem = "0" + hexItem
	// 			}
	// 			txArray.push(Buffer.from(hexItem, "hex"))
	// 		}
	// 	}
	//
	// 	return txArray
	// }
}
