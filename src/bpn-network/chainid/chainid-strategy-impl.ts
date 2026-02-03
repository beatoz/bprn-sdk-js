/** @format */

import { stringToUint256 } from "../../utils"
import { Contract, Network } from "fabric-network"
import { ChainIdStrategy } from "./chainid-strategy"
import { ConnectionProfile } from "../connection-profile/connection-profile"
import { ChainId } from "./chainid"

export class ChainIdFromChannelName implements ChainIdStrategy {
	private readonly _chainId: ChainId

	constructor(private readonly channelName: string) {
		const id = stringToUint256(this.channelName)
		this._chainId = ChainId.fromDecimal(id)
	}

	async chainId(): Promise<ChainId> {
		return this._chainId
	}
}

export class ChainIdFromConfig implements ChainIdStrategy {
	private readonly _chainId: ChainId

	constructor(connectionProfile: ConnectionProfile, channelName: string) {
		if (connectionProfile.channels === undefined) {
			throw new Error("channels configuration is missing")
		}
		if (!(channelName in connectionProfile.channels)) {
			throw new Error(`channel '${channelName}' not found in connection profile`)
		}

		const channel = connectionProfile.channels[channelName]
		this._chainId = ChainId.from(channel.chainId)
	}

	async chainId(): Promise<ChainId> {
		return this._chainId
	}
}

export class ChainIdFromChaincode implements ChainIdStrategy {
	private readonly contract: Contract

	constructor(network: Network) {
		this.contract = network.getContract("")
	}

	async chainId(): Promise<ChainId> {
		const response = await this.contract.evaluateTransaction("GetChainId")
		const hexString = response.toString("utf8")
		return ChainId.fromHex(hexString)
	}
}
