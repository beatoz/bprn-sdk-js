/** @format */

import { UserInfo } from "../bpn-network"
import { PeerCli } from "../cli"
import { Chaincode } from "../cli/chaincode"
import { NetworkInfo } from "../bpn-network"
import { PeerEnvs } from "../bpn-network"

export class CliChaincodeInvokeService {
	private readonly peerCli: PeerCli
	readonly chaincodeCmd: Chaincode
	readonly networkInfo: NetworkInfo
	readonly userInfo: UserInfo
	readonly peerEnv: PeerEnvs

	constructor(peerCli: PeerCli, networkInfo: NetworkInfo, userInfo: UserInfo) {
		this.peerCli = peerCli
		this.networkInfo = networkInfo
		this.userInfo = userInfo
		this.chaincodeCmd = new Chaincode()
		this.peerEnv = this.newPeerEnvs()
	}

	newPeerEnvs() {
		const peerInfo = this.networkInfo.peers[0]
		const peerEnv: PeerEnvs = {
			CORE_PEER_MSPCONFIGPATH: this.userInfo.mspDir,
			CORE_PEER_TLS_ENABLED: "true",
			CORE_PEER_TLS_ROOTCERT_FILE: peerInfo.tlsRootCertFilePath(),
			CORE_PEER_LOCALMSPID: peerInfo.mspId,
			CORE_PEER_ADDRESS: peerInfo.address,
		}
		return peerEnv
	}

	invoke(channelName: string, chaincodeName: string, functionName: string, args: string[], isInit: boolean = false) {
		const invokeCmd = this.chaincodeCmd
			.invoke(this.networkInfo.peers, this.networkInfo.orderers[0], channelName, chaincodeName, functionName, args, isInit)
			.toString()
		return this.peerCli.executePeerCommand(invokeCmd, { ...this.peerEnv })
	}
}
