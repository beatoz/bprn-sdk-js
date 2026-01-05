/** @format */

export class Account {
	readonly address: string
	readonly privateKey: string

	constructor(address: string, privateKey: string) {
		this.address = address
		this.privateKey = privateKey
	}
}
