/** @format */

export class ChainId {
	constructor(readonly chainId: bigint) {}

	static from(hexOrDecimal: string) {
		if (hexOrDecimal.startsWith("0x") || hexOrDecimal.startsWith("0X")) {
			return ChainId.fromHex(hexOrDecimal)
		}

		return ChainId.fromDecimal(BigInt(hexOrDecimal))
	}

	static fromDecimal(decimal: bigint) {
		return new ChainId(decimal)
	}

	static fromHex(hex: string) {
		const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex
		return new ChainId(BigInt(`0x${cleanHex}`))
	}

	toHex() {
		return this.chainId.toString(16)
	}

	toDecimal() {
		return this.chainId
	}

	toString() {
		return this.chainId.toString(10)
	}
}
