/** @format */

import { BaseLifecycleChaincode } from "./base"
import { CommittedChaincodeDefinition } from "./params"

export class QueryCommitted extends BaseLifecycleChaincode {
	flag(channel: string, chaincodeName: string) {
		return `-C ${channel} -n ${chaincodeName}`
	}

	command(channel: string, chaincodeName: string): string {
		return this.parentLifecycleChaincode.command() + "querycommitted " + this.flag(channel, chaincodeName)
	}

	jsonCommand(channel: string, chaincodeName: string): string {
		return `${this.command(channel, chaincodeName)} --output json`
	}

	parse(result: string): CommittedChaincodeDefinition {
		const parsed = JSON.parse(result) as Record<string, unknown>
		if (typeof parsed.sequence !== "number") {
			throw new Error("Invalid querycommitted response: sequence must be a number")
		}
		if (typeof parsed.version !== "string") {
			throw new Error("Invalid querycommitted response: version must be a string")
		}
		const approvals =
			parsed.approvals && typeof parsed.approvals === "object"
				? Object.fromEntries(
						Object.entries(parsed.approvals as Record<string, unknown>).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean")
					)
				: undefined
		return {
			sequence: parsed.sequence,
			version: parsed.version,
			initRequired: parsed.init_required === true,
			...(approvals ? { approvals } : {}),
		}
	}
}
