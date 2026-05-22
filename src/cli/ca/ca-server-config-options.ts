export interface CaServerConfigOptions {
	caNum: number;
	caServerDir: string;
	binDir: string;
	logDir: string;
	tlsEnabled?: boolean;
	csrHosts?: string[];
	adminUser?: string;
	adminPassword?: string;
}