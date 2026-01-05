/** @format */

import { BaseLifecycleChaincode } from "./base"

export class QueryCommitted extends BaseLifecycleChaincode {
	flag(channel: string, chaincodeName: string) {
		return `-C ${channel} -n ${chaincodeName}`
	}

	command(channel: string, chaincodeName: string): string {
		return this.parentLifecycleChaincode.command() + "querycommitted " + this.flag(channel, chaincodeName)
	}
}
