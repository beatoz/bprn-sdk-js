/** @format */

import { ChaincodeInfo } from "./params"
import { BaseLifecycleChaincode } from "./base"

export class Install extends BaseLifecycleChaincode {
	flag(ccInfo: ChaincodeInfo) {
		return `"${ccInfo.packageFilePath}"`
	}

	command(ccInfo: ChaincodeInfo): string {
		return this.parentLifecycleChaincode.command() + "install " + this.flag(ccInfo)
	}

	commandForPackage(packageFile: string): string {
		return `${this.parentLifecycleChaincode.command()}install "${packageFile}"`
	}

	getPackageId(installResult: string) {
		const match = installResult.match(/Chaincode code package identifier:\s*(\S+)/)
		const packageId = match ? match[1] : ""
		if (!packageId) {
			throw new Error(`Unable to parse installed chaincode package ID from output: ${installResult.trim()}`)
		}
		return packageId
	}
}
