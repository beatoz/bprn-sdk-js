/** @format */

import { Invoke, InvokeParam } from "./chaincode/invoke"
import { OrdererInfo, PeerInfo } from "../bpn-network"

export class Chaincode {
	command() {
		return "chaincode "
	}

	invokeWithParam(peerInfos: PeerInfo[], ordererInfo: OrdererInfo, channelName: string, chaincodeName: string, invokeParam: InvokeParam): Invoke {
		return new Invoke(this, peerInfos, ordererInfo, channelName, chaincodeName, invokeParam)
	}

	invoke(
		peerInfos: PeerInfo[],
		ordererInfo: OrdererInfo,
		channelName: string,
		chaincodeName: string,
		ccFunctionName: string,
		ccArgs: string[],
		isInit: boolean = false,
		waitForEvent: boolean = true
	): Invoke {
		return new Invoke(this, peerInfos, ordererInfo, channelName, chaincodeName, new InvokeParam(ccFunctionName, ccArgs, isInit, waitForEvent))
	}
}
