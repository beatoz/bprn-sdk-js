/** @format */

export class Hex {
	static normalizeHexString(hex: string) {
		const hexStr = hex.toLowerCase().replace(/^0x/, "")
		if (hexStr.length % 2 !== 0) {
			return "0" + hexStr
		}
		return hexStr
	}

	static normalizeHexBytes(value: bigint) {
		const normalizedHexStr = this.normalizeHexString(value.toString(16))
		return Buffer.from(normalizedHexStr, "hex")
	}
}
