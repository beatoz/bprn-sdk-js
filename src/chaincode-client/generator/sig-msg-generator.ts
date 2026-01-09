/** @format */

import * as rlp from "rlp"
import { EvmTransactionParam } from "../types/evm-transaction-param"

export class SigMsgGenerator {
	createSigMsg2(chaincodeName: string, chaincodeFunction: string, chaincodeParams: string[], evmTxParam: EvmTransactionParam) {
		const sigMsgArray = this.createSigMsgArray(chaincodeName, chaincodeFunction, evmTxParam)
		return rlp.encode(sigMsgArray)
	}

	createSigMsg(chaincodeName: string, chaincodeFunction: string, evmTxParam: EvmTransactionParam) {
		const sigMsgArray = this.createSigMsgArray(chaincodeName, chaincodeFunction, evmTxParam)
		return rlp.encode(sigMsgArray)
	}

	createSigMsgArray(chaincodeName: string, chaincodeFunction: string, evmTxParam: EvmTransactionParam): Array<number | string | Buffer> {
		const gasPriceHex = evmTxParam.gasPrice.toString(16)
		let gasPriceParam = gasPriceHex
		if (gasPriceHex.length % 2 !== 0) {
			gasPriceParam = "0" + gasPriceHex
		}

		const evmTxParams = evmTxParam.toArray()

		const sigMsgArray: Array<number | string | Buffer> = [
			//...evmTxParams,
			Number(evmTxParam.version),
			Number(evmTxParam.nonce),
			Number(evmTxParam.gas),
			Buffer.from(gasPriceParam, "hex"),
			Buffer.from(chaincodeName, "utf-8"),
			Buffer.from(chaincodeFunction, "utf-8"),
		]

		// Add arguments if present
		if (evmTxParam.args) {
			for (const item of evmTxParam.args) {
				let hexItem = item
				if (hexItem.length % 2 !== 0) {
					hexItem = "0" + hexItem
				}
				sigMsgArray.push(Buffer.from(hexItem, "hex"))
			}
		}

		return sigMsgArray
	}
}
