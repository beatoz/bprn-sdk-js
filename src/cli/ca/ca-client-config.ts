export interface CaClientConfig {
	caName: string
	caUrl: string
	adminUser: string
	adminPassword: string
	binDir: string
	tlsEnabled?: boolean
	tlsCertPath?: string
}