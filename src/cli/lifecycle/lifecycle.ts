/** @format */

import { LifecycleChaincodeV2 } from "./lifecycle-chaincode"

export class Lifecycle {
	command() {
		return "lifecycle "
	}

	chaincode(): LifecycleChaincode {
		return new LifecycleChaincode()
	}

	lifecycleChaincode(): LifecycleChaincodeV2 {
		return new LifecycleChaincodeV2(this)
	}

	peerAddressesFlag(peerAddresses: string[]) {
		const peerAddressesFlag: string[] = []
		for (const peerAddress of peerAddresses) {
			peerAddressesFlag.push(`--peerAddresses ${peerAddress}`)
		}
		return peerAddressesFlag.join(" ")
	}
}

export class LifecycleChaincode extends Lifecycle {
	command(): string {
		return super.command() + "chaincode "
	}
}

export interface ChaincodeInfo {
	chaincodeName: string
	chaincodeVersion: number
	chaincodePackageDir: string
	chaincodeLang: string
	chaincodeLabel: string
	chaincodeSourcePath: string
}

export interface PackageFlag {
	chainCodeName: string
	chainCodeVersion: number
	chaincodePackageDir: string
	chaincodeLang: string
	chaincodeLabel: string
	chaincodeSourcePath: string
}

// export class Package extends LifecycleChaincode {
//     flag(ccInfo : ChaincodeInfo) {
//         const outputFile = `${ccInfo.chaincodePackageDir}/${ccInfo.chaincodeName}.tat.gz`
//         return `${outputFile} --path ${ccInfo.chaincodeSourcePath} --lang ${ccInfo.chaincodeLang} --label ${ccInfo.chaincodeLabel}`;
//     }
//
//     command2(ccInfo : ChaincodeInfo) : string {
//         const cmd = super.command() + "package " + this.flag(ccInfo);
//         const flagCmd = this.flag(ccInfo)
//         return `${super.command()} package ${flagCmd}`
//     }
// }

// export interface InstallFlag {
//     chainCodeName: string;
//     chainCodeVersion: number;
//     chaincodePackageDir: string;
//     targetPeerIds: string[];
// }
//
// export class Install extends LifecycleChaincode {
//     flag(ccInfo : ChaincodeInfo, networkInfo: NetworkInfo) {
//         const outputFile = `${ccInfo.chaincodePackageDir}/${ccInfo.chaincodeName}.tat.gz`
//         const peerAddressesFlag = super.peerAddressesFlag(networkInfo.peerAddresses)
//         return `${outputFile} ${peerAddressesFlag}`;
//     }
//
//     command2(ccInfo : ChaincodeInfo, networkInfo: NetworkInfo) : string {
//         return super.command() + "install " + this.flag(ccInfo, networkInfo)
//     }
// }
