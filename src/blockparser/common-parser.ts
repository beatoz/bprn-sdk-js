/** @format */
import { createHash } from "crypto"
import * as fabproto6 from "fabric-protos"
import * as asn from "asn1.js"
import BN from "bn.js"
import { ExtendedTransaction } from "./types/transaction"

export class CommonParser {
	static getBlockSize(block: fabproto6.common.IBlock): number {
		return Buffer.byteLength(JSON.stringify(block))
	}

	static getHexHash(buffer: Uint8Array): string {
		return Buffer.from(buffer).toString("hex")
	}

	static getUtf8String(buffer: any): string {
		return Buffer.from(buffer).toString("utf8")
	}

	static isInvalidTransaction(extTx: ExtendedTransaction): boolean {
		return extTx.validationCode !== 0
	}

	static replaceUnicodeNull(str: string) {
		return str.replace(/\u0000/g, "")
	}

	static replaceAsciiNull(str: string) {
		return str.replace(/\x00/g, "")
	}

	static replaceUnicodeEscape(str: string) {
		return str.replace(/[\u0000-\u001F\\]/g, "")
	}

	static sum256(data: Uint8Array): string {
		const hash = createHash("sha256")
		hash.update(data)
		return hash.digest().toString("hex")
	}

	static calculateBlockHash(header: fabproto6.common.IBlockHeader) {
		return CommonParser.sum256(this.blockHeaderBytes(header))
	}

	static blockHeaderBytes(header: fabproto6.common.IBlockHeader) {
		const headerAsn = asn.define("headerAsn", function () {
			this.seq().obj(this.key("Number").int(), this.key("PreviousHash").octstr(), this.key("DataHash").octstr())
		})

		let blockNumber: BN
		if (typeof header.number === "number") {
			blockNumber = new BN(header.number)
		} else if (header.number && typeof header.number === "object") {
			blockNumber = new BN(header.number.toString())
		} else {
			blockNumber = new BN(0)
		}

		return headerAsn.encode(
			{
				Number: blockNumber,
				PreviousHash: header.previous_hash,
				DataHash: header.data_hash,
			},
			"der"
		)
	}
}
