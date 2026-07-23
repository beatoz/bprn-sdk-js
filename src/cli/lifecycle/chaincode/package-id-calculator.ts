/** @format */

import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"

export class ChaincodePackageIdCalculator {
	calculate(packageFile: string): string {
		const packageBytes = readFileSync(packageFile)
		const label = this.readLabel(packageFile)
		const hash = createHash("sha256").update(packageBytes).digest("hex")
		return `${label}:${hash}`
	}

	private readLabel(packageFile: string): string {
		const metadata = JSON.parse(execFileSync("tar", ["-xOzf", packageFile, "metadata.json"], { encoding: "utf8" })) as Record<string, unknown>
		const label = metadata.label ?? metadata.Label
		if (typeof label !== "string" || !label.trim()) {
			throw new Error(`Chaincode package metadata does not contain a valid label: ${packageFile}`)
		}
		return label
	}
}
