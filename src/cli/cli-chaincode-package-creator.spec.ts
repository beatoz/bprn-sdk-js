/** @format */

import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { CliChaincodePackageCreator } from "./cli-chaincode-package-creator"
import { ChaincodePackageIdCalculator } from "./lifecycle/chaincode/package-id-calculator"
import { ChaincodeInfo } from "./lifecycle/chaincode/params"

describe("CliChaincodePackageCreator", () => {
	it("creates a Fabric package from a Go source directory without the Go CLI", () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bprn-package-creator-test-"))
		const sourceDir = path.join(tempDir, "source")
		const packageFile = path.join(tempDir, "packages", "btip34-v3.tar.gz")
		fs.mkdirSync(sourceDir)
		fs.writeFileSync(path.join(sourceDir, "go.mod"), "module github.com/beatoz/linker-chaincodes/btip34\n\ngo 1.22\n")
		fs.writeFileSync(path.join(sourceDir, "main.go"), "package main\n")

		try {
			const chaincodeInfo = new ChaincodeInfo(
				"",
				"btip34-v3",
				1,
				1,
				sourceDir,
				path.dirname(packageFile),
				"",
				"golang",
				false,
				"btip34-v3",
				packageFile
			)

			expect(new CliChaincodePackageCreator().createPackageFromSource(chaincodeInfo)).toBe(packageFile)
			expect(fs.existsSync(packageFile)).toBe(true)
			expect(new ChaincodePackageIdCalculator().calculate(packageFile)).toMatch(/^btip34-v3:[a-f0-9]{64}$/)
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true })
		}
	})
})
