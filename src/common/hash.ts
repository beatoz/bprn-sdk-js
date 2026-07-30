import crypto from "node:crypto"

export class Hash {
	static sha256(data: Uint8Array): string {
		return crypto.createHash("sha256").update(data).digest("hex")
	}
}