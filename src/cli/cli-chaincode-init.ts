/** @format */

import { PeerCli } from "./peer-cli"
import { NetworkInfo } from "../bpn-network"
import { InvokeParam } from "./chaincode/invoke"
import { Chaincode } from "./chaincode"

export class CliChaincodeInit {
	readonly networkInfo: NetworkInfo
	readonly peerCli: PeerCli
	readonly chaincode: Chaincode

	constructor(peerCli: PeerCli, networkInfo: NetworkInfo) {
		this.peerCli = peerCli
		this.chaincode = new Chaincode()
		this.networkInfo = networkInfo
	}

	init(channelName: string, chaincodeName: string, invokeParam: InvokeParam): string {
		const invokeCmd = this.chaincode.invokeWithParam(this.networkInfo.peers, this.networkInfo.orderers[0], channelName, chaincodeName, invokeParam)
		return this.peerCli.executePeerCommand(invokeCmd.toString())
	}
}
