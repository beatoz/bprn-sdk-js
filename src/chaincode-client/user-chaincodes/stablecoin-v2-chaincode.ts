/** @format */

import { BpnNetwork, Chaincode } from "../../bpn-network"
import { CliChaincodeInvoker } from "../../cli"
import { Account } from "../../types"

export interface StablecoinV2Info {
	chaincodeName: string
	name: string
	symbol: string
	decimals: string
	owner: string
	totalSupply: string
}

export class StablecoinV2Chaincode extends Chaincode {
	static async create(bpnNetwork: BpnNetwork, stablecoinChaincodeName: string): Promise<StablecoinV2Chaincode> {
		const contract = await bpnNetwork.getContract(stablecoinChaincodeName)
		const channelName = bpnNetwork.getChannelName()
		return new StablecoinV2Chaincode(channelName, contract, bpnNetwork.chainType, bpnNetwork.chainId)
	}

	init(cliInvoker: CliChaincodeInvoker, ownerAccount: Account | string, name: string, symbol: string, decimals: string, initialSupply: string = "0") {
		const ownerAddress = typeof ownerAccount === "string" ? ownerAccount : ownerAccount.address
		return cliInvoker.invoke(this.channelName, this.chaincodeName(), "InitLedger", [ownerAddress, name, symbol, decimals, initialSupply], true)
	}

	setChaincodeIDWithCli(cliInvoker: CliChaincodeInvoker, chaincodeID: string = this.chaincodeName()) {
		return cliInvoker.invoke(this.channelName, this.chaincodeName(), "SetChaincodeID", [chaincodeID])
	}

	async setChaincodeID(chaincodeID: string = this.chaincodeName()): Promise<any> {
		return await this.invoke("SetChaincodeID", [chaincodeID])
	}

	async setMinter(account: string, enabled: boolean): Promise<any> {
		return await this.invoke("SetMinter", [account, this.boolArg(enabled)])
	}

	async setBurner(account: string, enabled: boolean): Promise<any> {
		return await this.invoke("SetBurner", [account, this.boolArg(enabled)])
	}

	async mint(to: string, amount: string): Promise<any> {
		return await this.invoke("Mint", [to, amount])
	}

	async burn(from: string, amount: string): Promise<any> {
		return await this.invoke("Burn", [from, amount])
	}

	async transfer(from: string, to: string, amount: string): Promise<any> {
		return await this.invoke("Transfer", [from, to, amount])
	}

	async name(): Promise<string> {
		return await this.query("Name", [])
	}

	async symbol(): Promise<string> {
		return await this.query("Symbol", [])
	}

	async decimals(): Promise<string> {
		return await this.query("Decimals", [])
	}

	async totalSupply(): Promise<string> {
		return await this.query("TotalSupply", [])
	}

	async owner(): Promise<string> {
		return await this.query("Owner", [])
	}

	async balanceOf(address: string): Promise<string> {
		return await this.query("BalanceOf", [address])
	}

	async info(): Promise<StablecoinV2Info> {
		return {
			chaincodeName: this.chaincodeName(),
			name: await this.name(),
			symbol: await this.symbol(),
			decimals: await this.decimals(),
			owner: await this.owner(),
			totalSupply: await this.totalSupply(),
		}
	}

	private boolArg(value: boolean): string {
		return value ? "true" : "false"
	}
}
