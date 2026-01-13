/** @format */

import { BlockListener, Contract, Gateway, ListenerOptions, Network, Wallet } from "fabric-network"
import { logger } from "../logger"
import { Chaincode } from "./chaincode"
import { ChainId } from "./chainid/chainid"

export type ChainType = string
export const CHAIN_TYPE: ChainType = "bprn"

export class BpnNetwork {
	constructor(
		private readonly network: Network,
		private readonly gateway: Gateway,
		private readonly wallet: Wallet,
		readonly chainId: ChainId,
		readonly chainType: ChainType = CHAIN_TYPE
	) {
		logger.info("Initializing FabricNetwork")
	}

	getChannelName() {
		return this.network.getChannel().name
	}

	async getChaincode(chaincodeName: string): Promise<Chaincode> {
		const contract = await this.getContract(chaincodeName)
		return new Chaincode(this.network.getChannel().name, contract, this.chainType)
	}

	async getContract(chaincodeName: string): Promise<Contract> {
		try {
			if (!chaincodeName || chaincodeName.trim() === "") {
				throw new Error("Chaincode name is required")
			}
			return this.network.getContract(chaincodeName)
		} catch (error) {
			throw new Error(`Failed to get contract for chaincode ${chaincodeName}: ${error instanceof Error ? error.message : String(error)}`)
		}
	}

	async addBlockListener(blockEventListener: BlockListener, startBlockNum: number) {
		const options: ListenerOptions = {
			startBlock: startBlockNum,
		}

		return await this.network.addBlockListener(blockEventListener)
	}

	removeBlockListener(blockEventListener: BlockListener) {
		this.network.removeBlockListener(blockEventListener)
	}
}
