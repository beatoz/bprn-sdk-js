/** @format */
import { Address } from "./address"

export class Account {
	readonly address: string
	readonly privateKey: string

	constructor(address: string, privateKey?: string) {
		this.address = address
		this.privateKey = privateKey ?? ""
	}

	get getAddress(): Address {
		return new Address(this.address)
	}

	get hasPrivateKey(): boolean {
		return !!this.privateKey
	}

	requirePrivateKey(context: string = "Account"): string {
		if (!this.privateKey) {
			throw new Error(`${context}: privateKey is not available on this account`)
		}
		return this.privateKey
	}
}
