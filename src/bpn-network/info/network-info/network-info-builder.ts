/** @format */

import { ConnectionProfile } from "../../connection-profile/connection-profile"
import { NetworkInfo } from "./network-info"
import { OrdererInfoBuilder } from "./orderer-info-builder"
import { PeerInfoBuilder } from "./peer-info-builder"

import { BpnDirInfo } from "../bpn-dir-info"

export class NetworkInfoBuilder {
	private readonly ordererInfoBuilder: OrdererInfoBuilder
	private readonly peerInfoBuilder: PeerInfoBuilder

	constructor(connectionProfile: ConnectionProfile, networkDirInfo: BpnDirInfo) {
		this.ordererInfoBuilder = new OrdererInfoBuilder(connectionProfile, networkDirInfo)
		this.peerInfoBuilder = new PeerInfoBuilder(connectionProfile, networkDirInfo)
	}

	public build(cryptoConfigPath: string = "crypto-config"): NetworkInfo {
		const orderers = this.ordererInfoBuilder.buildList(cryptoConfigPath)
		const peers = this.peerInfoBuilder.buildList(cryptoConfigPath)
		return new NetworkInfo(orderers, peers)
	}
}
