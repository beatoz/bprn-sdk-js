/** @format */

import { ChaincodeInfo } from "./params"
import { BaseLifecycleChaincode } from "./base"

export class Install extends BaseLifecycleChaincode {
	flag(ccInfo: ChaincodeInfo) {
		const outputFile = `${ccInfo.packageDir}/${ccInfo.name}.tar.gz`
		return `${outputFile}`
	}

	command(ccInfo: ChaincodeInfo): string {
		return this.parentLifecycleChaincode.command() + "install " + this.flag(ccInfo)
	}

	getPackageId(installResult: string) {
		const match = installResult.match(/Chaincode code package identifier:\s*(\S+)/)
		const packageId = match ? match[1] : ""
		return packageId
	}
}
