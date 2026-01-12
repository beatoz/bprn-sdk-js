/** @format */

import { WalletFactory } from "./wallet-factory"
import { BpnNetwork } from "../bpn-network"
import { ConnectionProfile } from "../connection-profile/connection-profile"
import { GatewayFactory } from "./gateway-factory"
import { NetworkFactory } from "./network-factory"
import { ConnectionProfileReader } from "../connection-profile/reader"
import { BpnDirInfo } from "../info/bpn-dir-info"
import { NetworkInfoBuilder } from "../info/network-info/network-info-builder"
import { UserInfoFactory } from "../info/user-info/user-info-factory"
import { UserInfoRepository } from "../info/user-info/user-info-repository"
import { NetworkInfo } from "../info/network-info/network-info"
import { ChainIdStrategy } from "../chainid/chainid-strategy"
import { Network } from "fabric-network"
import { ChainIdFromChaincode, ChainIdFromChannelName, ChainIdFromConfig } from "../chainid/chainid-strategy-impl"

export class BpnFactory {
	private readonly configDirInfo: BpnDirInfo
	private readonly networkFactory: NetworkFactory
	private readonly gatewayFactory: GatewayFactory
	private readonly walletFactory: WalletFactory
	private readonly connectionProfile: ConnectionProfile

	static fromBpnConfigDir(bpnConfigDirPath: string) {
		return new BpnFactory(new BpnDirInfo(bpnConfigDirPath))
	}

	constructor(configDirInfo: BpnDirInfo) {
		this.configDirInfo = configDirInfo
		this.walletFactory = new WalletFactory(configDirInfo)
		this.networkFactory = new NetworkFactory()
		this.gatewayFactory = new GatewayFactory()
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
		return this.createBpnNetworkFromConnectionProfile(this.connectionProfile)
	}

	async createBpnNetworkFromFilePath(connProfileFilePath: string): Promise<BpnNetwork> {
		const connProfileReader = new ConnectionProfileReader(this.configDirInfo)
		const connectionProfile = connProfileReader.readFromFilePath(connProfileFilePath)

		return this.createBpnNetworkFromConnectionProfile(connectionProfile)
	}

	async createBpnNetworkFromConnectionProfile(connectionProfile: ConnectionProfile): Promise<BpnNetwork> {
		const wallet = await this.walletFactory.createWallet(connectionProfile.clients)
		const gateway = await this.gatewayFactory.create(connectionProfile, wallet, connectionProfile.clients[0].id)

		const channelName = connectionProfile.channels ? Object.keys(connectionProfile.channels)[0] : ""
		const network = await this.networkFactory.createNetwork(gateway, channelName)

		const chainIdStrategy = this.createChainIdStrategy(network, connectionProfile)
		const chainId = await chainIdStrategy.chainId()

		return new BpnNetwork(network, gateway, wallet, chainId)
	}

	createChainIdStrategy(network: Network, connectionProfile: ConnectionProfile): ChainIdStrategy {
		const chainIdStrategy = new ChainIdFromChannelName(network.getChannel().name)
		//const chainIdStrategy = new ChainIdFromChaincode(network)
		//const chainIdStrategy = new ChainIdFromConfig(connectionProfile, network.getChannel().name)
		return chainIdStrategy
	}
}
