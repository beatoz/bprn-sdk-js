/** @format */

import path from "path"
import { CliChaincodeDeployer, PackagingMode } from "../cli"
import { UserInfo } from "../bpn-network"
import {
	ChaincodeDefinition,
	ChaincodeDefinitionDeployDetails,
	ChaincodeDefinitionEnsureDetails,
	ChaincodeInfo,
	ChaincodePackageDetails,
	ChaincodePackageInstallDetails,
	CommittedChaincodeDefinition,
	InstalledChaincodePackage,
	ApprovedChaincodeDefinition,
} from "../cli/lifecycle/chaincode/params"

export interface CreateChaincodePackageOptions {
	packageLabel: string
	packageFile?: string
	chaincodeSourceDir?: string
	packagingMode?: PackagingMode
}

export interface DeployChaincodeDefinitionOptions {
	channelName: string
	chaincodeName: string
	packageId: string
	version?: number
	sequence?: number
	initRequired?: boolean
}

export class CliChaincodeDeployService {
	private readonly ccDeployer: CliChaincodeDeployer
	private deployUserInfo: UserInfo
	private readonly chaincodeSourceDir: string
	private readonly chaincodePackageDir: string
	private readonly chaincodeLang = "golang"

	constructor(ccDeployer: CliChaincodeDeployer, deployerInfo: UserInfo, chaincodeSourceDir: string, chaincodePackageDir: string) {
		this.ccDeployer = ccDeployer
		this.deployUserInfo = deployerInfo
		this.chaincodeSourceDir = chaincodeSourceDir
		this.chaincodePackageDir = chaincodePackageDir
	}

	changeDeployer(deployUserInfo: UserInfo) {
		this.deployUserInfo = deployUserInfo
	}

	upgrade(
		channelName: string,
		chaincodeName: string,
		version: number,
		sequence: number,
		initRequired: boolean = false,
		packagingMode = PackagingMode.PeerCli
	) {
		const chaincodeInfo = this.getChaincodeInfo(this.chaincodeSourceDir, channelName, chaincodeName, initRequired, version, sequence)
		return this.ccDeployer.deploy(chaincodeInfo, this.deployUserInfo.mspDir, packagingMode)
	}

	upgrade2(
		chaincodeSourceDir: string,
		channelName: string,
		chaincodeName: string,
		version: number,
		sequence: number,
		initRequired: boolean = false,
		packagingMode = PackagingMode.PeerCli
	) {
		const chaincodeInfo = this.getChaincodeInfo(chaincodeSourceDir, channelName, chaincodeName, initRequired, version, sequence)
		return this.ccDeployer.deploy(chaincodeInfo, this.deployUserInfo.mspDir, packagingMode)
	}

	deploy(channelName: string, chaincodeName: string, initRequired: boolean = false, packagingMode = PackagingMode.PeerCli) {
		const chaincodeInfo = this.getChaincodeInfo(this.chaincodeSourceDir, channelName, chaincodeName, initRequired)
		return this.ccDeployer.deploy(chaincodeInfo, this.deployUserInfo.mspDir, packagingMode)
	}

	deploy2(
		chaincodeSourceDir: string,
		channelName: string,
		chaincodeName: string,
		initRequired: boolean = false,
		packagingMode = PackagingMode.PeerCli
	) {
		const chaincodeInfo = this.getChaincodeInfo(chaincodeSourceDir, channelName, chaincodeName, initRequired)
		return this.ccDeployer.deploy(chaincodeInfo, this.deployUserInfo.mspDir, packagingMode)
	}

	calculatePackageId(packageFile: string): string {
		return this.ccDeployer.calculatePackageId(packageFile)
	}

	createPackage(options: CreateChaincodePackageOptions): ChaincodePackageDetails {
		const packageLabel = options.packageLabel.trim()
		if (!packageLabel) throw new Error("A package label is required")

		const packageFile = options.packageFile || path.join(this.chaincodePackageDir, `${packageLabel}.tar.gz`)
		const chaincodeInfo = new ChaincodeInfo(
			"",
			packageLabel,
			1,
			1,
			options.chaincodeSourceDir || this.chaincodeSourceDir,
			this.chaincodePackageDir,
			"",
			this.chaincodeLang,
			false,
			packageLabel,
			packageFile
		)
		this.ccDeployer.package(chaincodeInfo, options.packagingMode ?? PackagingMode.PeerCli)
		return {
			packageFile,
			packageId: this.ccDeployer.calculatePackageId(packageFile),
			label: packageLabel,
		}
	}

	queryInstalledPackages(): InstalledChaincodePackage[] {
		return this.ccDeployer.queryInstalledPackages(this.deployUserInfo.mspDir)
	}

	ensurePackageInstalled(packageFile: string): ChaincodePackageInstallDetails {
		return this.ccDeployer.ensurePackageInstalled(packageFile, this.deployUserInfo.mspDir)
	}

	deployDefinition(options: DeployChaincodeDefinitionOptions): ChaincodeDefinitionDeployDetails {
		const definition = this.definitionFrom(options)
		return this.ccDeployer.deployDefinition(definition, this.deployUserInfo.mspDir)
	}

	ensureDefinition(options: DeployChaincodeDefinitionOptions): ChaincodeDefinitionEnsureDetails {
		return this.ccDeployer.ensureDefinition(this.definitionFrom(options), this.deployUserInfo.mspDir)
	}

	queryCommittedDefinition(channelName: string, chaincodeName: string): CommittedChaincodeDefinition | null {
		return this.ccDeployer.queryCommittedDefinition(channelName, chaincodeName, this.deployUserInfo.mspDir)
	}

	queryApprovedDefinition(channelName: string, chaincodeName: string, sequence: number): ApprovedChaincodeDefinition | null {
		return this.ccDeployer.queryApprovedDefinition(channelName, chaincodeName, sequence, this.deployUserInfo.mspDir)
	}

	getChaincodeInfo(
		chaincodeSourceDir: string,
		channelName: string,
		chaincodeName: string,
		initRequired: boolean,
		version: number = 1,
		sequence: number = 1
	) {
		return new ChaincodeInfo(
			channelName,
			chaincodeName,
			version,
			sequence,
			chaincodeSourceDir,
			this.chaincodePackageDir,
			"",
			this.chaincodeLang,
			initRequired
		)
	}

	private definitionFrom(options: DeployChaincodeDefinitionOptions): ChaincodeDefinition {
		return {
			channelName: options.channelName,
			name: options.chaincodeName,
			packageId: options.packageId,
			version: options.version ?? 1,
			sequence: options.sequence ?? 1,
			initRequired: options.initRequired ?? false,
		}
	}
}
