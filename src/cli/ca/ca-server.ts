import { spawn } from "child_process"
import * as fs from "fs"
import * as path from "path"
import { CaServerConfig } from "./ca-server-config"

export class CaServer {
	private config: CaServerConfig;
	private pid?: number;

	constructor(config: CaServerConfig) {
		this.config = config;
	}

	async start(): Promise<boolean> {
		const logFile = path.join(this.config.logDir, `fabric-ca-server${this.config.caNum}.log`);
		const pidDir = path.join(this.config.caServerHomeDir, 'pid');

		fs.mkdirSync(pidDir, { recursive: true });
		fs.mkdirSync(this.config.logDir, { recursive: true });

		const logStream = fs.openSync(logFile, 'a');

		const child = spawn(
			path.join(this.config.binDir, 'fabric-ca-server'),
			['start', '-b', `${this.config.adminUser}:${this.config.adminPassword}`],
			{
				env: { ...process.env, ...this.config.toEnv() },
				detached: true,
				stdio: ['ignore', logStream, logStream],
			}
		);

		child.unref();
		this.pid = child.pid;

		if (this.pid) {
			fs.writeFileSync(path.join(pidDir, 'ca.pid'), String(this.pid));
		}

		return this.pid !== undefined;
	}

	showInfo() {
		console.log("caName: ", this.config.caName)
		console.log("csrCn: ", this.config.csrCn)
		console.log("caPort: ", this.config.caPort)
		console.log("csrHosts: ", this.config.csrHosts)
	}

	getPid(): number | undefined {
		return this.pid;
	}

	stop(): boolean {
		const pid = this.pid ?? this.loadPidFromFile();
		if (!pid) {
			return false;
		}

		try {
			process.kill(pid, 'SIGTERM');
			this.pid = undefined;
			this.removePidFile();
			return true;
		} catch {
			return false;
		}
	}

	isRunning(): boolean {
		const pid = this.pid ?? this.loadPidFromFile();
		if (!pid) {
			return false;
		}

		try {
			process.kill(pid, 0);
			return true;
		} catch {
			return false;
		}
	}

	private loadPidFromFile(): number | undefined {
		const pidFile = path.join(this.config.caServerHomeDir, 'pid', 'ca.pid');
		try {
			const pidStr = fs.readFileSync(pidFile, 'utf-8').trim();
			return parseInt(pidStr, 10);
		} catch {
			return undefined;
		}
	}

	private removePidFile(): void {
		const pidFile = path.join(this.config.caServerHomeDir, 'pid', 'ca.pid');
		try {
			fs.unlinkSync(pidFile);
		} catch {
			// ignore
		}
	}
}