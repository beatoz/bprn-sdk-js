/** @format */

import { FlagBuilder } from "../lifecycle/flag/flag-builder"
import { OrdererInfo, PeerInfo } from "../../bpn-network"
import { Chaincode } from "../chaincode"

export class Invoke {
	readonly parentChaincode: Chaincode
	readonly peerInfos: PeerInfo[]
	readonly ordererInfo: OrdererInfo
	readonly channelName: string
	readonly chaincodeName: string
	readonly invokeParam: InvokeParam

	constructor(
		parentChaincode: Chaincode,
		peerInfos: PeerInfo[],
		ordererInfo: OrdererInfo,
		channelName: string,
		chaincodeName: string,
		invokeParam: InvokeParam
	) {
		this.parentChaincode = parentChaincode
		this.peerInfos = peerInfos
		this.ordererInfo = ordererInfo
		this.channelName = channelName
		this.chaincodeName = chaincodeName
		this.invokeParam = invokeParam
	}

	toString() {
		return this.parentChaincode.command() + "invoke " + this.flag()
	}

	flag() {
		return new FlagBuilder()
			.channelID(this.channelName)
			.chaincodeName(this.chaincodeName)
			.peerAddresses(this.peerInfos)
			.ordererFlag(this.ordererInfo)
			.waitForEvent(this.invokeParam.waitForEvent)
			.isInit(this.invokeParam.isInit)
			.c(this.invokeParam)
			.build()
	}

	chaincodeParamCommand(functionName: string, args: string[]) {
		const params = args.map((arg) => `"${arg}"`).join(",")
		return `{"function":"${functionName}","Args":[ ${params} ]}`
	}
}

export class InvokeParam {
	readonly functionName: string
	readonly args: string[]
	readonly isInit: boolean = false
	readonly waitForEvent: boolean = true

	constructor(functionName: string, args: string[], isInit: boolean = false, waitForEvent: boolean = true) {
		this.functionName = functionName
		this.args = args
		this.isInit = isInit
		this.waitForEvent = waitForEvent
	}

	toString() {
		return JSON.stringify({
			function: this.functionName,
			Args: this.args,
		})
	}

	chaincodeParamCommand() {
		const params = this.args.map((arg) => `"${arg}"`).join(",")
		return `{"function":"${this.functionName}","Args":[${params}]}`
	}
}
