/** @format */

import path from "path"
import fs from "fs"
import logger from "../logger"
import { Cli } from "./peer-cli"

export class CliChaincodePackageCreater extends Cli {
	createPackage(packageDirPath: string, chaincodeName: string) {
		const metadataJsonFileName = this.createMetadata(packageDirPath, chaincodeName)
		//const codeTarGzFileName = this.copyCodeTarGz(packageDirPath, chaincodeName)
		const srcCodeFileName = "code.tar.gz"
		const srcCodeFilePath = path.join(packageDirPath, srcCodeFileName)

		const outputFileName = this.createPackageTarFile(packageDirPath, chaincodeName, metadataJsonFileName, srcCodeFileName)

		this.deleteTemporaryFiles(packageDirPath, metadataJsonFileName)

		return outputFileName
	}

	createMetadata(packageDirPath: string, chaincodeName: string) {
		const metadata = {
			path: "github.com/beatoz/adc-caliper/benchmarks/src/erc20",
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
}
