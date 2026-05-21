import path from "path"

import { CaServerConfigOptions } from "./ca-server-config-options"

export class CaServerConfig {
	readonly caNum: number
	readonly caPort: number
	readonly operationsPort: number
	readonly caServerHomeDir: string
	readonly caName: string
	readonly tlsEnabled: boolean
	readonly csrCn: string
	readonly csrHosts: string
	readonly operationsListenAddress: string
	readonly binDir: string
	readonly logDir: string
	readonly adminUser: string
	readonly adminPassword: string

	constructor(options: CaServerConfigOptions) {
		this.caNum = options.caNum
		this.caPort = (options.caNum + 7) * 1000 + 54
		this.operationsPort = (options.caNum + 7) * 1000 + 43
		this.caServerHomeDir = path.join(options.caServerDir, `organizations/fabric-ca-server-${options.caNum}`)
		this.caName = `ca${options.caNum}`
		this.tlsEnabled = options.tlsEnabled ?? true
		this.csrCn = `ca${options.caNum}`
		this.csrHosts = options.csrHosts?.join(",") ?? `ca${options.caNum},localhost`
		this.operationsListenAddress = `0.0.0.0:${this.operationsPort}`
		this.binDir = options.binDir
		this.logDir = options.logDir
		this.adminUser = options.adminUser ?? "admin"
		this.adminPassword = options.adminPassword ?? "adminpw"
	}

	toEnv(): Record<string, string> {
		return {
			FABRIC_CA_HOME: this.caServerHomeDir,
			FABRIC_CA_SERVER_CA_NAME: this.caName,
			FABRIC_CA_SERVER_TLS_ENABLED: String(this.tlsEnabled),
			FABRIC_CA_SERVER_PORT: String(this.caPort),
			FABRIC_CA_SERVER_CSR_CN: this.csrCn,
			FABRIC_CA_SERVER_CSR_HOSTS: this.csrHosts,
			FABRIC_CA_SERVER_OPERATIONS_LISTENADDRESS: this.operationsListenAddress,
		}
	}
}