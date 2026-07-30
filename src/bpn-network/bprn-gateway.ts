import { Gateway, GatewayOptions, Wallet } from "fabric-network"
import { ConnectionProfile } from "./connection-profile/connection-profile"

export class BprnGateway {
	readonly gateway = new Gateway()

	async connect(connectionProfile: ConnectionProfile, wallet: Wallet, clientId: string) {
		const gatewayOptions = this.createGatewayOptions(wallet, clientId)
		return await this.gateway.connect(connectionProfile as any, gatewayOptions)
	}

	createGatewayOptions(wallet: Wallet, clientId: string): GatewayOptions {
		const gatewayOptions: GatewayOptions = {
			identity: clientId,
			wallet: wallet,
			discovery: { enabled: false, asLocalhost: false },
		}
		return gatewayOptions
	}
}