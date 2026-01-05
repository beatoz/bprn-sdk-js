/** @format */

import { Gateway, Network } from "fabric-network"

export class NetworkFactory {
	async createNetwork(gateway: Gateway, channelName: string): Promise<Network> {
		const network: Network = await gateway.getNetwork(channelName)
		const channel = network.getChannel()

		if (channel.getCommitters.length === null || channel.getCommitters.length === undefined || channel.getCommitters.length === 0) {
			throw new Error("could not find any committer from channel")
		}

		return network
	}
}
