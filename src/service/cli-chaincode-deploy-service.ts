/** @format */

import { CliChaincodeDeployer, PackagingMode } from "../cli/cli-chaincode-deployer"
import { UserInfo } from "../bpn-network"
import { ChaincodeInfo } from "../cli/lifecycle/chaincode/params"

export class CliChaincodeDeployService {
	private readonly ccDeployer: CliChaincodeDeployer
	private deployerInfo: UserInfo
	private readonly chaincodeSourceDir: string
	private readonly chaincodePackageDir: string
	private readonly chaincodeLang = "golang"

	constructor(ccDeployer: CliChaincodeDeployer, deployerInfo: UserInfo, chaincodeSourceDir: string, chaincodePackageDir: string) {
		this.ccDeployer = ccDeployer
		this.deployerInfo = deployerInfo
		this.chaincodeSourceDir = chaincodeSourceDir
		this.chaincodePackageDir = chaincodePackageDir
	}

	changeDeployer(deployerInfo: UserInfo) {
		this.deployerInfo = deployerInfo
	}

	upgrade(channelName: string, chaincodeName: string, version: number, sequence: number, initRequired: boolean = false, packagingMode = PackagingMode.PeerCli) {
		const chaincodeInfo = this.getChaincodeInfo(this.chaincodeSourceDir, channelName, chaincodeName, initRequired, version, sequence)
		this.ccDeployer.deploy(chaincodeInfo, this.deployerInfo.mspDir, packagingMode)
	}

	deploy(channelName: string, chaincodeName: string, initRequired: boolean = false, packagingMode = PackagingMode.PeerCli) {
		const chaincodeInfo = this.getChaincodeInfo(this.chaincodeSourceDir, channelName, chaincodeName, initRequired)
		this.ccDeployer.deploy(chaincodeInfo, this.deployerInfo.mspDir, packagingMode)
	}

	deploy2(chaincodeSourceDir: string, channelName: string, chaincodeName: string, initRequired: boolean = false, packagingMode = PackagingMode.PeerCli) {
		const chaincodeInfo = this.getChaincodeInfo(chaincodeSourceDir, channelName, chaincodeName, initRequired)
		this.ccDeployer.deploy(chaincodeInfo, this.deployerInfo.mspDir, packagingMode)
	}

	getChaincodeInfo(chaincodeSourceDir: string, channelName: string, chaincodeName: string, initRequired: boolean, version: number = 1, sequence: number = 1) {
		return new ChaincodeInfo(channelName, chaincodeName, version, sequence, chaincodeSourceDir, this.chaincodePackageDir, "", this.chaincodeLang, initRequired)
	}
}
