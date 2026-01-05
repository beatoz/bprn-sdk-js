/** @format */

export class Erc20CoinInfo {
	readonly name: string
	readonly symbol: string
	readonly decimal: string

	constructor(name: string, symbol: string, decimal: string) {
		this.name = name
		this.symbol = symbol
		this.decimal = decimal
	}
}
