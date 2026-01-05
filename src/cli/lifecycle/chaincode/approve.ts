/** @format */

import { ChaincodeInfo } from "./params"
import { OrdererInfo } from "../../../bpn-network/info/network-info/network-info"
import { BaseLifecycleChaincode } from "./base"
import { LifecycleChaincodeV2 } from "../lifecycle-chaincode"
import { FlagBuilder } from "../flag/flag-builder"

export class Approve extends BaseLifecycleChaincode {
	constructor(
		readonly ccInfo: ChaincodeInfo,
		readonly ordererInfo: OrdererInfo,
		parent: LifecycleChaincodeV2
	) {
		super(parent)
	}

	//flag(ccInfo : ChaincodeInfo, ordererInfo: OrdererInfo) {
	flag() {
		return new FlagBuilder()
			.ordererFlag(this.ordererInfo)
			.channelID(this.ccInfo.channelName)
			.chaincodeName(this.ccInfo.name)
			.version(this.ccInfo.version)
			.sequence(this.ccInfo.sequence)
			.packageId(this.ccInfo.packageId)
			.initRequired(this.ccInfo.initRequired)
			.build()
	}

	//toString(ccInfo : ChaincodeInfo, ordererInfo: OrdererInfo) : string {
	toString(): string {
		return this.parentLifecycleChaincode.command() + "approveformyorg " + this.flag()
	}
}
