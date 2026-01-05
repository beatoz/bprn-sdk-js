/** @format */

import { ConnectionProfile } from "./connection-profile"
import { ConnectionProfileValidator } from "./validator"
import { BpnDirInfo } from "../info/bpn-dir-info"
import fs from "fs"

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
		//const absolutePath = this.getAbsoluteFilePath(connectionProfilePath)
		const fileContents = fs.readFileSync(connectionProfilePath, "utf8")
		const connectionProfile: ConnectionProfile = JSON.parse(fileContents)

		for (const key in connectionProfile.peers) {
			const peer = connectionProfile.peers[key]
			peer.tlsCACerts!.path = this.configDirInfo.getAbsoluteFilePath(peer.tlsCACerts!.path!)
		}

		for (const key in connectionProfile.orderers) {
			const orderer = connectionProfile.orderers[key]
			orderer.tlsCACerts!.path = this.configDirInfo.getAbsoluteFilePath(orderer.tlsCACerts!.path!)
		}

		new ConnectionProfileValidator().validateConnectionProfile(connectionProfile)

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
