/** @format */

import fs from "fs"
import path from "path"
import logger from "../../logger"

export class BpnDirInfo {
	public readonly absoluteConfigDir: string

	constructor(absoluteConfigDir: string) {
		this.absoluteConfigDir = absoluteConfigDir
		this.validate()
	}

	private validate() {
		if (!path.isAbsolute(this.absoluteConfigDir)) {
			throw new Error(`BPN Network Config directory must be an Absolute path: ${this.absoluteConfigDir}`)
		}

		if (!fs.existsSync(this.absoluteConfigDir)) {
			throw new Error(`Config directory does not exist: ${this.absoluteConfigDir}`)
		}

		this.ensureDirectoryExists(this.binDir())
		this.ensureDirectoryExists(this.configDir())
		this.ensureDirectoryExists(this.cryptoConfigDir())
		this.ensureDirectoryExists(this.chaincodePackageDir())

		if (!fs.existsSync(this.connectionProfileFilePath())) {
			throw new Error(`Connection profile file does not exist: ${this.connectionProfileFilePath()}`)
		}
	}

	private ensureDirectoryExists(dirPath: string): void {
		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath, { recursive: true })
			logger.info(`Created directory: ${dirPath}`)
		}
	}

	getAbsoluteFilePath(relativePath: string): string {
		return path.join(this.absoluteConfigDir, relativePath)
		//return `${this.absoluteConfigDir}/${relativePath}`
	}

	rootDir() {
		return this.absoluteConfigDir
	}

	binDir() {
		return `${this.absoluteConfigDir}/bin`
	}

	configDir() {
		return `${this.absoluteConfigDir}/config`
	}

	cryptoConfigDir() {
		return `${this.absoluteConfigDir}/crypto-config`
	}

	chaincodePackageDir() {
		return `${this.absoluteConfigDir}/chaincode-package`
	}

	connectionProfileFilePath() {
		const filePath = `${this.absoluteConfigDir}/connection-profile.json`
		if (!fs.existsSync(filePath)) {
			throw new Error(`Connection profile file does not exist: ${filePath}`)
		}
		return filePath
	}
}
