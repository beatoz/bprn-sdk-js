/** @format */

import { PeerInfo } from "../../../bpn-network"
import { BaseLifecycleChaincode } from "./base"
import { CommonFlagFactory } from "../flag/common-flag-factory"

export class QueryInstalled extends BaseLifecycleChaincode {
	flag(peerInfos: PeerInfo[]) {
		const peerAddressed = peerInfos.map((peerInfo) => peerInfo.address)
		const peerAddressesFlag = CommonFlagFactory.peerAddresses(peerAddressed)
		const tlsRootCertFiles = CommonFlagFactory.tlsRootCertFiles(peerAddressed)

		return `${peerAddressesFlag} ${tlsRootCertFiles}`
	}

	command(peerInfos: PeerInfo[]): string {
		return this.parentLifecycleChaincode.command() + "queryinstalled " + this.flag(peerInfos)
	}
}
