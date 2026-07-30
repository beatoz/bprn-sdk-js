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

		sigMsgArray.push(Buffer.from(this.txid, "hex"))
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

	static deserialize(serialized: Uint8Array): SigMsg {
		const decoded = rlp.decode(serialized) as Uint8Array[]

		const txid = Buffer.from(decoded[0]).toString("hex")
		const chaincodeName = Buffer.from(decoded[1]).toString("utf-8")
		const chaincodeMethodName = Buffer.from(decoded[2]).toString("utf-8")
		const chaincodeParams = decoded.slice(3).map((param) => Buffer.from(param).toString("utf-8"))

		return new SigMsg(txid, chaincodeName, chaincodeMethodName, chaincodeParams)
	}
}
