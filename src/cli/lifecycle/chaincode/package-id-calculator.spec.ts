/** @format */

import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { ChaincodePackageIdCalculator } from "./package-id-calculator"

describe("ChaincodePackageIdCalculator", () => {
	it("matches the Fabric 2.2 package ID algorithm", () => {
		const directory = mkdtempSync(path.join(tmpdir(), "bprn-package-id-"))
		const packageFile = path.join(directory, "btip34-v3.tar.gz")
		try {
			writeFileSync(path.join(directory, "metadata.json"), JSON.stringify({ path: "btip34", type: "golang", label: "btip34-v3" }))
			writeFileSync(path.join(directory, "code.tar.gz"), "fixture")
			execFileSync("tar", ["-czf", packageFile, "-C", directory, "metadata.json", "code.tar.gz"])

			const expectedHash = createHash("sha256").update(readFileSync(packageFile)).digest("hex")
			expect(new ChaincodePackageIdCalculator().calculate(packageFile)).toBe(`btip34-v3:${expectedHash}`)
		} finally {
			rmSync(directory, { recursive: true, force: true })
		}
	})
})
