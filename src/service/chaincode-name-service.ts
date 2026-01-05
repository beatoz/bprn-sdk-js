/** @format */

export class ChaincodeNameService {
	static generateErc20ChaincodeName(tokenName: string, symbol: string) {
		const sanitizedName = tokenName.replace(/\s+/g, "_")
		const sanitizedSymbol = symbol.replace(/\s+/g, "_")
		return `${sanitizedName}-${sanitizedSymbol}`
	}

	static generateStablecoinChaincodeName(stablecoinName: string, symbol: string) {
		const sanitizedName = stablecoinName.replace(/\s+/g, "_")
		const sanitizedSymbol = symbol.replace(/\s+/g, "_")
		return `stablecoin-${sanitizedName}-${sanitizedSymbol}`
	}
}
