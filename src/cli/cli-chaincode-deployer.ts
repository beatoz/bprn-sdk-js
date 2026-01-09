/** @format */

import { PeerCli } from "./peer-cli"
import { Lifecycle } from "./lifecycle/lifecycle"
import { LifecycleChaincodeV2 } from "./lifecycle/lifecycle-chaincode"
import { ChaincodeInfo } from "./lifecycle/chaincode/params"
import { NetworkInfo, PeerEnvs } from "../bpn-network"
import logger from "../logger"
import { CliChaincodePackageCreater } from "./cli-chaincode-package-creater"

export enum PackagingMode {
	PeerCli,
	Manual,
}

export class CliChaincodeDeployer {
	readonly peerCli: PeerCli
	readonly lifecycle: Lifecycle
	readonly lifecycleChaincode: LifecycleChaincodeV2
	readonly networkInfo: NetworkInfo

	constructor(peerCli: PeerCli, networkInfo: NetworkInfo) {
		this.peerCli = peerCli
		this.networkInfo = networkInfo
		this.lifecycle = new Lifecycle()
		this.lifecycleChaincode = this.lifecycle.lifecycleChaincode()
	}

	deploy(chaincodeInfo: ChaincodeInfo, mspDir: string, packagingMode = PackagingMode.PeerCli) {
		this.package(chaincodeInfo, packagingMode)

		const peerEnv = this.newPeerEnvs(mspDir)

		chaincodeInfo.packageId = this.install(chaincodeInfo, peerEnv)
		this.approve(chaincodeInfo, peerEnv)
		this.checkCommitReadiness(chaincodeInfo, peerEnv)
		this.commit(chaincodeInfo, peerEnv)
	}

	private newPeerEnvs(mspDir: string): PeerEnvs {
		const peerInfo = this.networkInfo.peers[0]
		return {
			CORE_PEER_MSPCONFIGPATH: mspDir,
			CORE_PEER_TLS_ENABLED: "true",
			//CORE_PEER_TLS_ROOTCERT_FILE: peerInfo.tlsRootCertFilePath(),
			CORE_PEER_TLS_ROOTCERT_FILE: peerInfo.tlsCaCertFilePath(),
			CORE_PEER_ID: peerInfo.id.toString(),
			CORE_PEER_LOCALMSPID: peerInfo.mspId,
			CORE_PEER_ADDRESS: peerInfo.address,
		}
	}

	package(chaincodeInfo: ChaincodeInfo, packagingMode: PackagingMode) {
		switch (packagingMode) {
			case PackagingMode.PeerCli:
				this.packageUsingPeerCli(chaincodeInfo)
				break
			case PackagingMode.Manual:
				this.packageManually(chaincodeInfo)
				break
		}
	}

	packageManually(chaincodeInfo: ChaincodeInfo) {
		new CliChaincodePackageCreater().createPackage(chaincodeInfo.packageDir, chaincodeInfo.name)
	}

	packageUsingPeerCli(chaincodeInfo: ChaincodeInfo) {
		const ccPackage = this.lifecycleChaincode.package()

		const goVendorCmd = ccPackage.goVendorCommand(chaincodeInfo)
		const goVendorResult = this.peerCli.executeCommand(goVendorCmd)
		logger.info("goVendorCmd result: " + goVendorResult)

		const packageCmd = ccPackage.command(chaincodeInfo)
		const packageResult = this.peerCli.executePeerCommand(packageCmd)
		logger.info("packageCmd result: " + packageResult)
	}

	install(chaincodeInfo: ChaincodeInfo, peerEnv: PeerEnvs) {
		const lifecycleInstall = this.lifecycleChaincode.install()

		const installCmd = lifecycleInstall.command(chaincodeInfo)
		const installResult = this.peerCli.executePeerCommand(installCmd, { ...peerEnv })
		logger.info("install result:" + installResult)

		const packageId = lifecycleInstall.getPackageId(installResult)
		logger.info("packageId: " + packageId)

		return packageId
	}

	approve(chaincodeInfo: ChaincodeInfo, peerEnv: PeerEnvs) {
		const approveCmd = this.lifecycleChaincode.approve(chaincodeInfo, this.networkInfo.orderers[0]).toString()
		const approveResult = this.peerCli.executePeerCommand(approveCmd, { ...peerEnv })
		logger.info("approve result: " + approveResult)

		return approveResult
	}

	checkCommitReadiness(chaincodeInfo: ChaincodeInfo, peerEnv: PeerEnvs) {
		const checkCommitCmd = this.lifecycleChaincode.checkCommitReadiness().command(chaincodeInfo, this.networkInfo.orderers[0])
		const checkCommitResult = this.peerCli.executePeerCommand(checkCommitCmd, { ...peerEnv })
		logger.info("checkCommitResult complete: " + checkCommitResult)

		return checkCommitResult
	}

	commit(chaincodeInfo: ChaincodeInfo, peerEnv: PeerEnvs) {
		const commitCmd = this.lifecycleChaincode.commit().command(chaincodeInfo, this.networkInfo.peers, this.networkInfo.orderers[0])
		const commitResult = this.peerCli.executePeerCommand(commitCmd, { ...peerEnv })
		logger.info("commit complete: " + commitResult)

		return commitResult
	}
}
