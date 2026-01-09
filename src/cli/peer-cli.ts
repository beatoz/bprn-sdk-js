/** @format */

import { execSync } from "child_process"
import { logger } from "../logger"
import { PeerEnvs } from "../bpn-network"

export class Cli {
	execute(command: string, envs?: NodeJS.ProcessEnv): string {
		try {
			const result = execSync(`${command} 2>&1`, {
				encoding: "utf-8",
				env: envs,
			})
			return result.toString()
		} catch (error: any) {
			logger.error(error.stdout)
			throw error
			// if (error.stdout || error.stderr) {
			//     return (error.stdout || '') + (error.stderr || '');
			// }
			// throw error;
		}
	}
}

export class PeerCli extends Cli {
	readonly peerDir: string
	readonly peerEnvs: PeerEnvs

	constructor(peerDir: string, peerEnvs: PeerEnvs) {
		super()
		this.peerDir = peerDir
		this.peerEnvs = peerEnvs
	}

	peer() {
		return `${this.peerDir}/peer `
	}

	executePeerCommands(commands: string[], envs?: NodeJS.ProcessEnv): string {
		const results: string[] = []
		for (const command of commands) {
			const result = this.executePeerCommand(command, envs)
			results.push(result)
		}
		return results.join("\n")
	}

	// TODO : 하나의 peer cli 객체로 다른 peerEnv를 사용할 수 있으므로, peerEnv는 생성자보다는 메서드가 옳다
	executePeerCommand(command: string, envs?: NodeJS.ProcessEnv): string {
		const peerCmd = this.peer() + command
		return this.executeCommand(peerCmd, envs)
	}

	executeCommand(command: string, envs?: NodeJS.ProcessEnv): string {
		const { PATH, ...peerEnvsWithoutPath } = this.peerEnvs
		const mergedEnv = {
			...process.env,
			...peerEnvsWithoutPath,
			PATH: PATH ? `${PATH}:${process.env.PATH}` : process.env.PATH,
			...envs,
		}
		return this.execute(command, mergedEnv)
	}
}
