/** @format */

import { ChaincodeInfo } from "./params"
import { OrdererInfo, PeerInfo } from "../../../bpn-network/info/network-info/network-info"
import { BaseLifecycleChaincode } from "./base"
import { FlagBuilder } from "../flag/flag-builder"

export class Commit extends BaseLifecycleChaincode {
	flag(ccInfo: ChaincodeInfo, peerInfos: PeerInfo[], ordererInfo: OrdererInfo) {
		return new FlagBuilder()
			.ordererFlag(ordererInfo)
			.peerAddresses(peerInfos)
			.channelID(ccInfo.channelName)
			.chaincodeName(ccInfo.name)
			.version(ccInfo.version)
			.sequence(ccInfo.sequence)
			.initRequired(ccInfo.initRequired)
			.build()
	}

	command(ccInfo: ChaincodeInfo, peerInfos: PeerInfo[], ordererInfo: OrdererInfo): string {
		return this.parentLifecycleChaincode.command() + "commit " + this.flag(ccInfo, peerInfos, ordererInfo)
	}
}
