/** @format */

import { BpnNetwork } from "../bpn-network"
import { ConnectionProfile } from "../connection-profile/connection-profile"
import { ConnectionProfileReader } from "../connection-profile/reader"
import { BpnDirInfo } from "../info/bpn-dir-info"
import { NetworkInfoBuilder } from "../info/network-info/network-info-builder"
import { UserInfoFactory } from "../info/user-info/user-info-factory"
import { UserInfoRepository } from "../info/user-info/user-info-repository"
import { NetworkInfo } from "../info/network-info/network-info"
import { BprnNetworkFactory } from "./bprn-network-factory"

export class BpnFactory {
	private readonly configDirInfo: BpnDirInfo
	private readonly bpnNetworkFactory: BprnNetworkFactory
	private readonly connectionProfile: ConnectionProfile

	static fromBpnConfigDir(bpnConfigDirPath: string) {
		return new BpnFactory(new BpnDirInfo(bpnConfigDirPath))
	}

	constructor(configDirInfo: BpnDirInfo) {
		this.configDirInfo = configDirInfo
		this.bpnNetworkFactory = new BprnNetworkFactory()
		this.connectionProfile = new ConnectionProfileReader(this.configDirInfo).read()
	}

	getBpnConfigDirPath() {
		return this.configDirInfo
	}

	createNetworkInfo(): NetworkInfo {
		return new NetworkInfoBuilder(this.connectionProfile, this.configDirInfo).build()
	}

	createUserInfoRepository(): UserInfoRepository {
		const allUsers = new UserInfoFactory(this.configDirInfo).createAllUserInfo()
		return new UserInfoRepository(allUsers)
	}

	async createBpnNetwork(): Promise<BpnNetwork> {
		return await this.bpnNetworkFactory.createBprnNetworkFrom(this.connectionProfile)
	}

	async createBpnNetworkFromFilePath(connProfileFilePath: string): Promise<BpnNetwork> {
		const connProfileReader = new ConnectionProfileReader(this.configDirInfo)
		const connectionProfile = connProfileReader.readFromFilePath(connProfileFilePath)
		return await this.bpnNetworkFactory.createBprnNetworkFrom(connectionProfile)
	}
}
