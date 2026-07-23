/** @format */

import { PeerInfo } from "../../../bpn-network"
import { BaseLifecycleChaincode } from "./base"
import { CommonFlagFactory } from "../flag/common-flag-factory"
import { InstalledChaincodePackage } from "./params"

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

	jsonCommand(): string {
		return this.parentLifecycleChaincode.command() + "queryinstalled --output json"
	}

	parse(result: string): InstalledChaincodePackage[] {
		const parsed = JSON.parse(result) as {
			installed_chaincodes?: Array<{
				package_id?: unknown
				label?: unknown
				references?: unknown
			}>
		}
		if (!Array.isArray(parsed.installed_chaincodes)) {
			return []
		}
		return parsed.installed_chaincodes.map((entry) => {
			if (typeof entry.package_id !== "string" || typeof entry.label !== "string") {
				throw new Error("Invalid queryinstalled response: package_id and label must be strings")
			}
			return {
				packageId: entry.package_id,
				label: entry.label,
				...(entry.references && typeof entry.references === "object" ? { references: entry.references as Record<string, unknown> } : {}),
			}
		})
	}
}
