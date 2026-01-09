/** @format */
import { Hex } from "../../types/hex"
import * as rlp from "rlp"

export class EvmTransactionParam {
	// version: number = 1 // Version (args[0])
	// nonce!: string // Nonce (args[1])
	// gas: string = "21000" // Gas (args[2])
	// gasPrice: string = "100000000" // Gas Price (args[3])
	// gasPrice2: bigint

	constructor(
		readonly version: number,
		readonly nonce: number,
		readonly gas: number,
		readonly gasPrice: bigint,
		readonly args?: string[]
	) {}

	toArray() {
		return [
			this.version,
			this.nonce,
			this.gas,
			Hex.normalizeHexBytes(this.gasPrice),
			//Hex.fromBigInt(this.gasPrice).normalizeHexBytes(),
			//Buffer.from(this.gasPrice.toString(16), "hex"),
			//...this.serializeArgs(),
		]
	}

	serialize(): Uint8Array {
		return rlp.encode(this.toArray())
	}
}
