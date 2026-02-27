/** @format */

import { BpnNetwork, Chaincode } from "../../bpn-network"
import { CliChaincodeInvoker } from "../../cli"

export class ChainIdRegistryChaincode extends Chaincode {
	static async create(bpnNetwork: BpnNetwork, chainIdRegistryChaincodeName: string): Promise<ChainIdRegistryChaincode> {
		const contract = await bpnNetwork.getContract(chainIdRegistryChaincodeName)
		const channelName = bpnNetwork.getChannelName()
		return new ChainIdRegistryChaincode(channelName, contract, bpnNetwork.chainType, bpnNetwork.chainId)
	}

	init(cliInvoker: CliChaincodeInvoker) {
		return cliInvoker.invoke(this.channelName, this.chaincodeName(), "InitLedger", [], true)
	}

	async getChainId(): Promise<string> {
		return await this.query("GetChainId", [])
	}

	async getChannelByChainId(chainIdHex: string): Promise<string> {
		return await this.query("GetChannelByChainId", [chainIdHex])
	}

	async getChannelByChainID(chainIdHex: string): Promise<string> {
		return await this.query("GetChannelByChainID", [chainIdHex])
	}

	async getOrCreateChainIDByChannel(channelName: string): Promise<string> {
		const chainID = await this.invoke("GetOrCreateChainIDByChannel", [channelName])
		return String(chainID)
	}

	async putState(key: string, value: string): Promise<void> {
		await this.invoke("PutState", [key, value])
	}

	async getState(key: string): Promise<string> {
		return await this.query("GetState", [key])
	}

	async existsState(id: string): Promise<boolean> {
		const raw = await this.query("ExistsState", [id])
		const normalized = String(raw).toLowerCase()
		return normalized === "true" || normalized === "1"
	}

	async deleteState(key: string): Promise<void> {
		await this.invoke("DeleteState", [key])
	}
}
