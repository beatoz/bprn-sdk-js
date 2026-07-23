/** @format */

import { PeerCli } from "./peer-cli"
import { Lifecycle } from "./lifecycle/lifecycle"
import { LifecycleChaincodeV2 } from "./lifecycle/lifecycle-chaincode"
import {
	ChaincodeDefinition,
	ChaincodeDefinitionDeployDetails,
	ChaincodeDefinitionEnsureDetails,
	ChaincodeDeployDetails,
	ChaincodeInfo,
	ChaincodePackageInstallDetails,
	CommittedChaincodeDefinition,
	InstalledChaincodePackage,
	ApprovedChaincodeDefinition,
} from "./lifecycle/chaincode/params"
import { NetworkInfo, PeerEnvs } from "../bpn-network"
import logger from "../logger"
import { CliChaincodePackageCreator } from "./cli-chaincode-package-creator"
import { ChaincodePackageIdCalculator } from "./lifecycle/chaincode/package-id-calculator"

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

	deploy(chaincodeInfo: ChaincodeInfo, mspDir: string, packagingMode = PackagingMode.PeerCli): ChaincodeDeployDetails {
		this.package(chaincodeInfo, packagingMode)
		const installation = this.ensurePackageInstalled(chaincodeInfo.packageFilePath, mspDir)
		chaincodeInfo.packageId = installation.packageId
		const definition = this.deployDefinition(chaincodeInfo, mspDir)
		return {
			...definition,
			packageFile: installation.packageFile,
			label: installation.label,
			installed: installation.installed,
		}
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
		new CliChaincodePackageCreator().createPackageFromSource(chaincodeInfo)
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

	calculatePackageId(packageFile: string): string {
		return new ChaincodePackageIdCalculator().calculate(packageFile)
	}

	queryInstalledPackages(mspDir: string): InstalledChaincodePackage[] {
		const queryInstalled = this.lifecycleChaincode.queryInstalled()
		const result = this.peerCli.executePeerCommand(queryInstalled.jsonCommand(), { ...this.newPeerEnvs(mspDir) })
		return queryInstalled.parse(result)
	}

	ensurePackageInstalled(packageFile: string, mspDir: string): ChaincodePackageInstallDetails {
		const expectedPackageId = this.calculatePackageId(packageFile)
		const existing = this.queryInstalledPackages(mspDir).find((entry) => entry.packageId === expectedPackageId)
		if (existing) {
			return {
				packageFile,
				packageId: existing.packageId,
				label: existing.label,
				installed: false,
			}
		}

		const install = this.lifecycleChaincode.install()
		const peerEnv = this.newPeerEnvs(mspDir)
		let installResult: string
		try {
			installResult = this.peerCli.executePeerCommand(install.commandForPackage(packageFile), { ...peerEnv })
		} catch (error) {
			const concurrentlyInstalled = this.queryInstalledPackages(mspDir).find((entry) => entry.packageId === expectedPackageId)
			if (concurrentlyInstalled) {
				return {
					packageFile,
					packageId: concurrentlyInstalled.packageId,
					label: concurrentlyInstalled.label,
					installed: false,
				}
			}
			throw error
		}

		const installedPackageId = install.getPackageId(installResult)
		if (installedPackageId !== expectedPackageId) {
			throw new Error(`Installed package ID does not match package artifact: expected=${expectedPackageId}, actual=${installedPackageId}`)
		}
		return {
			packageFile,
			packageId: installedPackageId,
			label: this.packageLabel(installedPackageId),
			installed: true,
		}
	}

	deployDefinition(chaincodeDefinition: ChaincodeDefinition, mspDir: string): ChaincodeDefinitionDeployDetails {
		this.validateDefinition(chaincodeDefinition)
		const peerEnv = this.newPeerEnvs(mspDir)
		return {
			...chaincodeDefinition,
			approvalResult: this.approve(chaincodeDefinition, peerEnv),
			readinessResult: this.checkCommitReadiness(chaincodeDefinition, peerEnv),
			commitResult: this.commit(chaincodeDefinition, peerEnv),
		}
	}

	queryCommittedDefinition(channelName: string, chaincodeName: string, mspDir: string): CommittedChaincodeDefinition | null {
		const query = this.lifecycleChaincode.queryCommitted()
		try {
			const result = this.peerCli.executePeerCommand(query.jsonCommand(channelName, chaincodeName), {
				...this.newPeerEnvs(mspDir),
			})
			return query.parse(result)
		} catch (error) {
			if (this.isDefinitionMissing(error)) return null
			throw error
		}
	}

	queryApprovedDefinition(channelName: string, chaincodeName: string, sequence: number, mspDir: string): ApprovedChaincodeDefinition | null {
		const query = this.lifecycleChaincode.queryApproved()
		try {
			const result = this.peerCli.executePeerCommand(query.command(channelName, chaincodeName, sequence), {
				...this.newPeerEnvs(mspDir),
			})
			return query.parse(result)
		} catch (error) {
			if (this.isDefinitionMissing(error)) return null
			throw error
		}
	}

	ensureDefinition(chaincodeDefinition: ChaincodeDefinition, mspDir: string): ChaincodeDefinitionEnsureDetails {
		this.validateDefinition(chaincodeDefinition)
		const committed = this.queryCommittedDefinition(chaincodeDefinition.channelName, chaincodeDefinition.name, mspDir)
		this.assertCommittedDefinitionCanAdvance(chaincodeDefinition, committed)
		const approved = this.queryApprovedDefinition(chaincodeDefinition.channelName, chaincodeDefinition.name, chaincodeDefinition.sequence, mspDir)
		this.assertApprovedDefinitionMatches(chaincodeDefinition, approved)

		if (committed && committed.sequence === chaincodeDefinition.sequence) {
			if (!approved) {
				throw new Error(`Chaincode definition is committed but not approved by the local organization: ${chaincodeDefinition.name}`)
			}
			return {
				...chaincodeDefinition,
				reused: true,
				approvalSubmitted: false,
				commitSubmitted: false,
			}
		}

		const peerEnv = this.newPeerEnvs(mspDir)
		const approvalResult = approved ? undefined : this.approve(chaincodeDefinition, peerEnv)
		const readinessResult = this.checkCommitReadiness(chaincodeDefinition, peerEnv)
		const commitResult = this.commit(chaincodeDefinition, peerEnv)
		return {
			...chaincodeDefinition,
			reused: false,
			approvalSubmitted: !approved,
			commitSubmitted: true,
			...(approvalResult === undefined ? {} : { approvalResult }),
			readinessResult,
			commitResult,
		}
	}

	approve(chaincodeInfo: ChaincodeDefinition, peerEnv: PeerEnvs) {
		const approveCmd = this.lifecycleChaincode.approve(chaincodeInfo, this.networkInfo.orderers[0]).toString()
		const approveResult = this.peerCli.executePeerCommand(approveCmd, { ...peerEnv })
		logger.info("approve result: " + approveResult)

		return approveResult
	}

	checkCommitReadiness(chaincodeInfo: ChaincodeDefinition, peerEnv: PeerEnvs) {
		const checkCommitCmd = this.lifecycleChaincode.checkCommitReadiness().command(chaincodeInfo, this.networkInfo.orderers[0])
		const checkCommitResult = this.peerCli.executePeerCommand(checkCommitCmd, { ...peerEnv })
		logger.info("checkCommitResult complete: " + checkCommitResult)

		return checkCommitResult
	}

	commit(chaincodeInfo: ChaincodeDefinition, peerEnv: PeerEnvs) {
		const commitCmd = this.lifecycleChaincode.commit().command(chaincodeInfo, this.networkInfo.peers, this.networkInfo.orderers[0])
		const commitResult = this.peerCli.executePeerCommand(commitCmd, { ...peerEnv })
		logger.info("commit complete: " + commitResult)

		return commitResult
	}

	private packageLabel(packageId: string): string {
		const separator = packageId.lastIndexOf(":")
		return separator > 0 ? packageId.slice(0, separator) : packageId
	}

	private validateDefinition(definition: ChaincodeDefinition): void {
		if (!definition.packageId.trim()) throw new Error("A package ID is required to deploy a chaincode definition")
		if (!definition.channelName.trim()) throw new Error("A channel name is required to deploy a chaincode definition")
		if (!definition.name.trim()) throw new Error("A chaincode name is required to deploy a chaincode definition")
		if (!Number.isInteger(definition.sequence) || definition.sequence < 1) {
			throw new Error("Chaincode definition sequence must be a positive integer")
		}
	}

	private assertCommittedDefinitionCanAdvance(expected: ChaincodeDefinition, actual: CommittedChaincodeDefinition | null): void {
		if (!actual) return
		if (actual.sequence > expected.sequence) {
			throw new Error(
				`Committed chaincode definition is newer than requested: name=${expected.name}, committed=${actual.sequence}, requested=${expected.sequence}`
			)
		}
		if (actual.sequence === expected.sequence && (actual.version !== String(expected.version) || actual.initRequired !== expected.initRequired)) {
			throw new Error(`Committed chaincode definition does not match requested definition: name=${expected.name}, sequence=${expected.sequence}`)
		}
	}

	private assertApprovedDefinitionMatches(expected: ChaincodeDefinition, actual: ApprovedChaincodeDefinition | null): void {
		if (!actual) return
		if (
			actual.sequence !== expected.sequence ||
			actual.version !== String(expected.version) ||
			actual.initRequired !== expected.initRequired ||
			actual.packageId !== expected.packageId
		) {
			throw new Error(`Approved chaincode definition does not match requested definition: name=${expected.name}, sequence=${expected.sequence}`)
		}
	}

	private isDefinitionMissing(error: unknown): boolean {
		const candidate = error as { message?: unknown; stdout?: unknown; stderr?: unknown }
		const message = [candidate?.message, candidate?.stdout, candidate?.stderr]
			.map((value) => (Buffer.isBuffer(value) ? value.toString("utf8") : typeof value === "string" ? value : ""))
			.join(" ")
		return /(?:could not (?:find|fetch)|not found|has not been approved|not approved).*(?:chaincode|definition)|(?:chaincode|definition).*(?:could not (?:find|fetch)|not found|has not been approved|not approved)|namespace\s+.+\s+is not defined/i.test(
			message
		)
	}
}
