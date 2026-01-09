/** @format */

import { EvmTransactionParam } from "./evm-transaction-param"

export class Erc20Args {
	readonly rlpParam: EvmTransactionParam
	readonly args: string[]
	readonly signature: string

	constructor(rlpParam: EvmTransactionParam, args: string[], signature: string) {
		this.rlpParam = rlpParam
		this.args = args
		this.signature = signature
	}

	toArray() {
		return [this.rlpParam.version.toString(), this.rlpParam.nonce, this.rlpParam.gas, this.rlpParam.gasPrice, ...this.args, this.signature]
	}

	toStringArray() {
		return [
			this.rlpParam.version.toString(),
			this.rlpParam.nonce.toString(),
			this.rlpParam.gas.toString(),
			this.rlpParam.gasPrice.toString(),
			...this.args,
			this.signature,
		]
	}

	toJson() {
		return JSON.stringify(this.toArray())
	}
}
