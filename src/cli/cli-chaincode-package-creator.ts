/** @format */

import { execFileSync } from "node:child_process"
import fs from "fs"
import os from "os"
import path from "path"
import logger from "../logger"
import { Cli } from "./peer-cli"
import { ChaincodeInfo } from "./lifecycle/chaincode/params"

export class CliChaincodePackageCreator extends Cli {
	createPackageFromSource(chaincodeInfo: ChaincodeInfo): string {
		if (chaincodeInfo.language !== "golang") {
			throw new Error(`Manual chaincode packaging is only supported for golang sources: ${chaincodeInfo.language}`)
		}

		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bprn-chaincode-package-"))
		const sourceDir = path.join(tempDir, "src")
		const metadataFile = path.join(tempDir, "metadata.json")
		const codeArchive = path.join(tempDir, "code.tar.gz")

		try {
			fs.mkdirSync(path.dirname(chaincodeInfo.packageFilePath), { recursive: true })
			fs.cpSync(chaincodeInfo.chaincodeSourceDir, sourceDir, { recursive: true })
			fs.writeFileSync(
				metadataFile,
				JSON.stringify(
					{
						path: this.readGoModulePath(chaincodeInfo.chaincodeSourceDir),
						type: chaincodeInfo.language,
						label: chaincodeInfo.label,
					},
					null,
					2
				),
				"utf8"
			)
			this.createTarGz(codeArchive, tempDir, ["src"])
			this.createTarGz(chaincodeInfo.packageFilePath, tempDir, ["metadata.json", "code.tar.gz"])
			return chaincodeInfo.packageFilePath
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true })
		}
	}

	createPackage(packageDirPath: string, chaincodeName: string) {
		const metadataJsonFileName = this.createMetadata(packageDirPath, chaincodeName)
		//const codeTarGzFileName = this.copyCodeTarGz(packageDirPath, chaincodeName)
		const srcCodeFileName = "code.tar.gz"

		const outputFileName = this.createPackageTarFile(packageDirPath, chaincodeName, metadataJsonFileName, srcCodeFileName)

		this.deleteTemporaryFiles(packageDirPath, metadataJsonFileName)

		return outputFileName
	}

	createMetadata(packageDirPath: string, chaincodeName: string) {
		const metadata = {
			path: "github.com/beatoz/linker-chaincodes/btip10",
			type: "golang",
			label: `${chaincodeName}_1`,
		}

		const fileName = "metadata.json"
		const metadataPath = path.join(packageDirPath, "metadata.json")
		fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf8")
		logger.info(`metadata.json created at: ${metadataPath}`)

		return fileName
	}

	copyCodeTarGz(packageDirPath: string, chaincodeName: string) {
		const srcFileName = "code.tar.gz"
		const srcFilePath = path.join(packageDirPath, srcFileName)
		const codeTarGzFilePath = path.join(packageDirPath, `${chaincodeName}.${srcFileName}`)

		if (!fs.existsSync(srcFilePath)) {
			throw new Error(`erc20.code.tar.gz not found at: ${srcFilePath}`)
		}
		fs.copyFileSync(srcFilePath, codeTarGzFilePath)
		logger.info(`Copied ${srcFilePath} to ${codeTarGzFilePath}`)

		return srcFileName
	}

	createPackageTarFile(packageDirPath: string, chaincodeName: string, metadataJsonFileName: string, codeTarGzFileName: string) {
		const outputTatGzFileName = `${chaincodeName}.tar.gz`
		const outputTarGzFilePath = path.join(packageDirPath, outputTatGzFileName)

		const tarCommand = `tar -czf "${outputTarGzFilePath}" -C "${packageDirPath}" ${metadataJsonFileName} ${codeTarGzFileName}`
		this.execute(tarCommand)

		return outputTatGzFileName
	}

	private deleteTemporaryFiles(packageDirPath: string, metadataJsonFileName: string) {
		const metadataPath = path.join(packageDirPath, metadataJsonFileName)
		//const codeTarGzPath = path.join(packageDirPath, codeTarGzFileName)

		if (fs.existsSync(metadataPath)) {
			fs.unlinkSync(metadataPath)
			logger.info(`Deleted temporary file: ${metadataPath}`)
		}

		// if (fs.existsSync(codeTarGzPath)) {
		// 	fs.unlinkSync(codeTarGzPath)
		// 	logger.info(`Deleted temporary file: ${codeTarGzPath}`)
		// }
	}

	private readGoModulePath(sourceDir: string): string {
		const goMod = fs.readFileSync(path.join(sourceDir, "go.mod"), "utf8")
		const match = goMod.match(/^module\s+(\S+)$/m)
		if (!match) {
			throw new Error(`Unable to determine Go module path: ${sourceDir}`)
		}
		return match[1]
	}

	private createTarGz(outputFile: string, cwd: string, entries: string[]): void {
		const args =
			process.platform === "darwin" ? ["--no-xattr", "-czf", outputFile, "-C", cwd, ...entries] : ["-czf", outputFile, "-C", cwd, ...entries]
		execFileSync("tar", args, {
			env: process.platform === "darwin" ? { ...process.env, COPYFILE_DISABLE: "1" } : process.env,
			stdio: "pipe",
		})
	}
}
