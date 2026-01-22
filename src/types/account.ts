/** @format */
import { Address } from "./address"

export class Account {
	readonly address: string
	readonly privateKey: string

	constructor(address: string, privateKey: string) {
		this.address = address
		this.privateKey = privateKey
	}

	get getAddress(): Address {
		return new Address(this.address)
	}
}
