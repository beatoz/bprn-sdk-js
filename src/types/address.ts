/** @format */

import { createHash } from "crypto"

export class Address {
	readonly address: string

	constructor(address: string) {
		this.validate(address)
		this.address = address.toLowerCase()
	}

	private validate(address: string): string {
		if (!address) {
			throw new Error("Address cannot be empty")
		}

		if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
			return address.substring(2).toLowerCase()
		}

		// If it's already a 40-character hex string without 0x prefix
		if (/^[a-fA-F0-9]{40}$/.test(address)) {
			return address.toLowerCase()
		}

		throw new Error(`Invalid address format: ${address}`)
	}

	toString(): string {
		return this.toHexString()
	}

	toHexString(): string {
		return this.address
	}

	to0xHexString(): string {
		return `0x${this.address}`
	}
}

export class AddressService {
	static generateChaincodeAddress(channelName: string, chaincodeName: string): string {
		const hash = createHash("sha256")
			.update(channelName + "-" + chaincodeName)
			.digest()
		return hash.slice(-20).toString("hex")
	}
}

export function generateChaincodeAddress(channelName: string, chaincodeName: string): string {
	const hash = createHash("sha256")
		.update(channelName + "-" + chaincodeName)
		.digest()
	return hash.slice(-20).toString("hex")
}
