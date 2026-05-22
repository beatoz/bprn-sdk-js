/** @format */

import { BlockListener, Contract, Gateway, ListenerOptions, Network, Wallet } from "fabric-network"
import { logger } from "../logger"
import { Chaincode } from "./chaincode"
import { ChainId } from "./chainid/chainid"
import { IdentityContext } from "fabric-common"

export type ChainType = string
export const BPRN_CHAIN_TYPE: ChainType = "bprn"

export class BpnNetwork {
	constructor(
		private readonly network: Network,
		private readonly gateway: Gateway,
		private readonly wallet: Wallet,
		readonly chainId: ChainId,
		readonly chainType: ChainType = BPRN_CHAIN_TYPE
	) {
		logger.info("Initializing FabricNetwork")
	}

	getEndorsers() {
		return this.getChannel().getEndorsers()
	}

	getChannelName() {
		return this.network.getChannel().name
	}

	getChannel() {
		return this.network.getChannel()
	}

	getIdentityContext(): IdentityContext {
		if (!this.gateway.identityContext) {
			throw new Error("Gateway has no identity context — not connected yet")
		}
		return this.gateway.identityContext
	}

	async getChaincode(chaincodeName: string): Promise<Chaincode> {
		const contract = await this.getContract(chaincodeName)
		return new Chaincode(this, this.network.getChannel().name, contract)
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
