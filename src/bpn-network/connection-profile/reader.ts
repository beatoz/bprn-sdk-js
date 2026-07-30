/** @format */

import { ConnectionProfile } from "./connection-profile"
import { ConnectionProfileValidator } from "./validator"
import { BpnDirInfo } from "../info/bpn-dir-info"
import fs, { readFileSync } from "fs"
import { dirname, resolve } from "path"
import path from "node:path"

export class ConnectionProfileReader {
	private readonly configDirInfo: BpnDirInfo

	constructor(configDirInfo: BpnDirInfo) {
		this.configDirInfo = configDirInfo
	}

	private getAbsoluteFilePath(relativePath: string): string {
		return `${this.configDirInfo.rootDir()}/${relativePath}`
	}

	public read(): ConnectionProfile {
		return this.readFromFilePath(this.configDirInfo.connectionProfileFilePath())
	}

	public readFromFilePath(connectionProfilePath: string): ConnectionProfile {
		const connectionProfile = ConnectionProfileReader.readConnectionProfile(connectionProfilePath)

		for (const key in connectionProfile.peers) {
			const peer = connectionProfile.peers[key]
			peer.tlsCACerts!.path = this.configDirInfo.getAbsoluteFilePath(peer.tlsCACerts!.path!)
		}

		for (const key in connectionProfile.orderers) {
			const orderer = connectionProfile.orderers[key]
			orderer.tlsCACerts!.path = this.configDirInfo.getAbsoluteFilePath(orderer.tlsCACerts!.path!)
		}

		for (const key in connectionProfile.clients) {
			const client = connectionProfile.clients[key]
			client.signedCertPath = this.configDirInfo.getAbsoluteFilePath(client.signedCertPath)
			client.privateKeyPath = this.configDirInfo.getAbsoluteFilePath(client.privateKeyPath)
		}

		new ConnectionProfileValidator().validateConnectionProfile(connectionProfile)

		return connectionProfile
	}

	static readFile(connectionProfileFileAbsolutePath: string): ConnectionProfile {
		const connectionProfile = ConnectionProfileReader.readConnectionProfile(connectionProfileFileAbsolutePath)
		const connectionProfileDir = dirname(resolve(connectionProfileFileAbsolutePath));

		for (const key in connectionProfile.peers) {
			const peer = connectionProfile.peers[key]
			peer.tlsCACerts!.path = path.join(connectionProfileDir, peer.tlsCACerts!.path!)
		}

		for (const key in connectionProfile.orderers) {
			const orderer = connectionProfile.orderers[key]
			orderer.tlsCACerts!.path = path.join(connectionProfileDir, orderer.tlsCACerts!.path!)
		}

		for (const key in connectionProfile.clients) {
			const client = connectionProfile.clients[key]
			client.signedCertPath = path.join(connectionProfileDir, client.signedCertPath)
			client.privateKeyPath = path.join(connectionProfileDir, client.privateKeyPath)
		}

		new ConnectionProfileValidator().validateConnectionProfile(connectionProfile)
		return connectionProfile
	}

	private static readConnectionProfile(connectionProfileFileAbsolutePath: string): ConnectionProfile {
		const fileContents = fs.readFileSync(connectionProfileFileAbsolutePath, "utf8")
		const connectionProfile: ConnectionProfile = JSON.parse(fileContents)
		return connectionProfile
	}

	// getChannelNames() {
	//     const channels = Object.keys(this.connectionProfile.channels);
	//     return channels;
	// }
	//
	// getClients() {
	//     return this.connectionProfile.clients;
	// }
	//
	// getClientId() {
	//     return this.connectionProfile.client.id;
	// }
	//
	// getConnectionProfile() {
	//     return this.connectionProfile;
	// }
}
