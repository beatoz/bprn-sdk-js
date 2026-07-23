/** @format */

import { BaseLifecycleChaincode } from "./base"
import { ApprovedChaincodeDefinition } from "./params"

export class QueryApproved extends BaseLifecycleChaincode {
	command(channelName: string, chaincodeName: string, sequence: number): string {
		return (
			`${this.parentLifecycleChaincode.command()}queryapproved ` + `-C "${channelName}" -n "${chaincodeName}" --sequence ${sequence} --output json`
		)
	}

	parse(result: string): ApprovedChaincodeDefinition {
		const parsed = JSON.parse(result) as Record<string, unknown>
		return {
			sequence: this.requiredNumber(parsed.sequence, "sequence"),
			version: this.requiredString(parsed.version, "version"),
			initRequired: parsed.init_required === true,
			packageId: this.packageId(parsed.source),
		}
	}

	private packageId(source: unknown): string | null {
		if (!source || typeof source !== "object") return null
		const type = (source as Record<string, unknown>).Type
		if (!type || typeof type !== "object") return null
		const localPackage = (type as Record<string, unknown>).LocalPackage
		if (!localPackage || typeof localPackage !== "object") return null
		const packageId = (localPackage as Record<string, unknown>).package_id
		return typeof packageId === "string" ? packageId : null
	}

	private requiredNumber(value: unknown, field: string): number {
		if (typeof value !== "number") throw new Error(`Invalid queryapproved response: ${field} must be a number`)
		return value
	}

	private requiredString(value: unknown, field: string): string {
		if (typeof value !== "string") throw new Error(`Invalid queryapproved response: ${field} must be a string`)
		return value
	}
}
