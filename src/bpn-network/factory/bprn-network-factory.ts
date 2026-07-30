import { NetworkFactory } from "./network-factory"
import { GatewayFactory } from "./gateway-factory"
import { WalletFactory } from "./wallet-factory"
import { ConnectionProfile } from "../connection-profile/connection-profile"
import { BpnNetwork, BPRN_CHAIN_TYPE } from "../bpn-network"
import { Network } from "fabric-network"
import { ChainIdStrategy } from "../chainid/chainid-strategy"
import { ChainIdFromChannelName } from "../chainid/chainid-strategy-impl"
import { ConnectionProfileReader } from "../connection-profile/reader"
import { BprnGateway } from "../bprn-gateway"

export class BprnNetworkFactory {
	private readonly networkFactory: NetworkFactory = new NetworkFactory()
	private readonly gatewayFactory: GatewayFactory = new GatewayFactory()
	private readonly walletFactory: WalletFactory = new WalletFactory()

	static async createBprnNetwork(connectionProfileFileAbsolutePath: string) {
		const bpnNetwork = await new BprnNetworkFactory().createBprnNetwork(connectionProfileFileAbsolutePath)
		return bpnNetwork
	}

	async createBprnNetwork(connectionProfileFileAbsolutePath: string) {
		const connProfile = ConnectionProfileReader.readFile(connectionProfileFileAbsolutePath)
		return await this.createBprnNetworkFrom(connProfile)
	}

	async createBprnNetworkFrom(connectionProfile: ConnectionProfile): Promise<BpnNetwork> {
		const wallet = await this.walletFactory.createWallet(connectionProfile.clients)

		const gateway = this.gatewayFactory.create()
		const gatewayOptions = this.gatewayFactory.createGatewayOptions(wallet, connectionProfile.clients[0].id)
		await gateway.connect(connectionProfile as any, gatewayOptions)

		// const gateway = await this.gatewayFactory.createAndConnect(connectionProfile, wallet, connectionProfile.clients[0].id)

		// use BprnGateway
		// const bprnGateway = new BprnGateway()
		// await bprnGateway.connect(connectionProfile, wallet, connectionProfile.clients[0].id)

		const channelName = connectionProfile.channels ? Object.keys(connectionProfile.channels)[0] : ""
		const network = await this.networkFactory.createNetwork(gateway, channelName)

		const chainIdStrategy = this.createChainIdStrategy(network, connectionProfile)
		const chainId = await chainIdStrategy.chainId()

		return new BpnNetwork(network, gateway, wallet, chainId, BPRN_CHAIN_TYPE)
	}

	private createChainIdStrategy(network: Network, connectionProfile: ConnectionProfile): ChainIdStrategy {
		const chainIdStrategy = new ChainIdFromChannelName(network.getChannel().name)
		//const chainIdStrategy = new ChainIdFromChaincode(network)
		//const chainIdStrategy = new ChainIdFromConfig(connectionProfile, network.getChannel().name)
		return chainIdStrategy
	}
}