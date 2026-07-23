/** @format */

export type ChaincodeLanguage = "golang" | "node" | "java"

export interface ChaincodeDefinition {
	channelName: string
	name: string
	version: number
	sequence: number
	packageId: string
	initRequired: boolean
}

export interface InstalledChaincodePackage {
	packageId: string
	label: string
	references?: Record<string, unknown>
}

export interface ChaincodePackageInstallDetails {
	packageFile: string
	packageId: string
	label: string
	installed: boolean
}

export interface ChaincodePackageDetails {
	packageFile: string
	packageId: string
	label: string
}

export interface ChaincodeDefinitionDeployDetails extends ChaincodeDefinition {
	approvalResult: string
	readinessResult: string
	commitResult: string
}

export interface CommittedChaincodeDefinition {
	sequence: number
	version: string
	initRequired: boolean
	approvals?: Record<string, boolean>
}

export interface ApprovedChaincodeDefinition extends CommittedChaincodeDefinition {
	packageId: string | null
}

export interface ChaincodeDefinitionEnsureDetails extends ChaincodeDefinition {
	reused: boolean
	approvalSubmitted: boolean
	commitSubmitted: boolean
	approvalResult?: string
	readinessResult?: string
	commitResult?: string
}

export interface ChaincodeDeployDetails extends ChaincodeDefinitionDeployDetails {
	packageFile: string
	label: string
	installed: boolean
}

export class ChaincodeInfo implements ChaincodeDefinition {
	constructor(
		public channelName: string,
		public name: string,
		public version: number,
		public sequence: number,
		public chaincodeSourceDir: string,
		public packageDir: string,
		public packageId: string,
		public language: ChaincodeLanguage = "golang",
		public initRequired: boolean = false,
		public packageLabel?: string,
		public packageFile?: string
	) {}

	get label(): string {
		return this.packageLabel || `${this.name}_${this.version}`
	}

	get packageFilePath(): string {
		return this.packageFile || `${this.packageDir}/${this.name}.tar.gz`
	}
}
