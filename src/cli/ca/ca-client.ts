import { execFile } from "child_process"
import * as path from "path"
import { promisify } from "util"
import { CaClientConfig } from "./ca-client-config"

const execFileAsync = promisify(execFile)

export type IdentityType = "client" | "peer" | "orderer" | "admin" | "user"

export interface RegisterOptions {
	name: string
	secret: string
	type: IdentityType
	attrs?: Record<string, string | boolean>
	affiliation?: string
}

export interface RegisterResult {
	success: boolean
	password?: string
	error?: string
}

export class CaClient {
	private config: CaClientConfig

	constructor(config: CaClientConfig) {
		this.config = config
	}

	async register(options: RegisterOptions): Promise<RegisterResult> {
		const args = this.buildRegisterArgs(options)

		try {
			await execFileAsync(path.join(this.config.binDir, "fabric-ca-client"), args)

			return {
				success: true,
				password: options.secret,
			}
		} catch (err) {
			return {
				success: false,
				error: err instanceof Error ? err.message : String(err),
			}
		}
	}

	private buildRegisterArgs(options: RegisterOptions): string[] {
		const protocol = this.config.tlsEnabled !== false ? "https" : "http"
		const caUrl = `${protocol}://${this.config.adminUser}:${this.config.adminPassword}@${this.config.caUrl}`

		const args = ["register", "--caname", this.config.caName, "-u", caUrl, "--id.name", options.name, "--id.secret", options.secret, "--id.type", options.type]

		if (options.affiliation) {
			args.push("--id.affiliation", options.affiliation)
		}

		if (options.attrs) {
			const attrsStr = Object.entries(options.attrs)
				.map(([key, value]) => `${key}=${value}`)
				.join(",")
			args.push("--id.attrs", attrsStr)
		}

		if (this.config.tlsEnabled !== false && this.config.tlsCertPath) {
			args.push("--tls.certfiles", this.config.tlsCertPath)
		}

		return args
	}

	async registerIntermediateCA(name: string, secret: string): Promise<RegisterResult> {
		return this.register({
			name,
			secret,
			type: "client",
			attrs: { "hf.IntermediateCA": true },
		})
	}
}
