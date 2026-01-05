/** @format */

import { ChaincodeInfo } from "./params"
import { OrdererInfo } from "../../../bpn-network/info/network-info/network-info"
import { FlagBuilder } from "../flag/flag-builder"
import { BaseLifecycleChaincode } from "./base"

export class CheckCommitReadiness extends BaseLifecycleChaincode {
	flag(ccInfo: ChaincodeInfo, ordererInfo: OrdererInfo) {
		//const ordererFlags = CommonFlagFactory.ordererFlags(ordererInfo)
		//const cmd = `--channelID ${ccInfo.channelName} --name ${ccInfo.name} --version ${ccInfo.version} --sequence ${ccInfo.sequence}`
		return new FlagBuilder()
			.ordererFlag(ordererInfo)
			.channelID(ccInfo.channelName)
			.chaincodeName(ccInfo.name)
			.version(ccInfo.version)
			.sequence(ccInfo.sequence)
			.initRequired(ccInfo.initRequired)
			.build()
		//--signature-policy ${} --init-required
		//return `${ordererFlags} ${cmd}`;
	}

	command(ccInfo: ChaincodeInfo, ordererInfo: OrdererInfo): string {
		return this.parentLifecycleChaincode.command() + "checkcommitreadiness " + this.flag(ccInfo, ordererInfo)
	}
}
