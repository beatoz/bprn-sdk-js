/** @format */

import * as rlp from "rlp"

export class SigMsg {
	constructor(
		readonly txid: string,
		readonly chaincodeName: string,
		readonly chaincodeMethodName: string,
		readonly chaincodeParams: string[]
	) {}

	toArray(): Array<number | Buffer> {
		const sigMsgArray: Array<number | Buffer> = []

		sigMsgArray.push(Buffer.from(this.txid, "utf-8"))
		sigMsgArray.push(Buffer.from(this.chaincodeName, "utf-8"))
		sigMsgArray.push(Buffer.from(this.chaincodeMethodName, "utf-8"))
		for (const chaincodeParam of this.chaincodeParams) {
			sigMsgArray.push(Buffer.from(chaincodeParam, "utf-8"))
		}

		return sigMsgArray
	}

	serialize() {
		return rlp.encode(this.toArray())
	}
}
