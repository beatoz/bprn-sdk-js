/** @format */

import { Gateway, GatewayOptions, Identity, Wallet } from "fabric-network"
import { ConnectionProfile } from "../connection-profile/connection-profile"

export class GatewayFactory {
	createGatewayOptions(wallet: Wallet, clientId: string): GatewayOptions {
		const gatewayOptions: GatewayOptions = {
			identity: clientId,
			wallet: wallet,
			discovery: { enabled: false, asLocalhost: false },
		}
		return gatewayOptions
	}

	createGatewayOptions2(wallet: Wallet, clientIdentity: Identity): GatewayOptions {
		const gatewayOptions: GatewayOptions = {
			identity: clientIdentity,
			wallet: wallet,
			discovery: { enabled: false, asLocalhost: false },
		}
		return gatewayOptions
	}

	async createAndConnectGateway(connectionProfile: ConnectionProfile, gatewayOptions: GatewayOptions): Promise<Gateway> {
		const gateway = new Gateway()
		//const rootChange = new RootDirChange(`${process.env.CONFIG_DIR}`);
		await gateway.connect(connectionProfile as any, gatewayOptions)
		//rootChange.resetRootDir();
		return gateway
	}

	async create(connectionProfile: ConnectionProfile, wallet: Wallet, clientId: string): Promise<Gateway> {
		const gatewayOptions = this.createGatewayOptions(wallet, clientId)
		return await this.createAndConnectGateway(connectionProfile, gatewayOptions)
	}

	async create2(connectionProfile: ConnectionProfile, wallet: Wallet, clientIdentity: Identity): Promise<Gateway> {
		const gatewayOptions = this.createGatewayOptions2(wallet, clientIdentity)
		return await this.createAndConnectGateway(connectionProfile, gatewayOptions)
	}
}
