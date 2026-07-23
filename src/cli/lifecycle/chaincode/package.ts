/** @format */

import { ChaincodeInfo } from "./params"
import { BaseLifecycleChaincode } from "./base"

export class Package extends BaseLifecycleChaincode {
	flag(ccInfo: ChaincodeInfo) {
		return `"${ccInfo.packageFilePath}" --path "${ccInfo.chaincodeSourceDir}" --lang ${ccInfo.language} --label "${ccInfo.label}"`
	}

	goVendorCommand(ccInfo: ChaincodeInfo) {
		return `cd "${ccInfo.chaincodeSourceDir}" && go mod vendor`
	}

	command(ccInfo: ChaincodeInfo) {
		return this.parentLifecycleChaincode.command() + "package " + this.flag(ccInfo)
	}

	// command(ccInfo : ChaincodeInfo) : string[] {
	//     const commands: string[] = []
	//     if (ccInfo.language === 'golang') {
	//         commands.push(this.goVendorCommand(ccInfo))
	//     }
	//     commands.push(this.packageCommand(ccInfo))
	//
	//     return commands
	// }
}
