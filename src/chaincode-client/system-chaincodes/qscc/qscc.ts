/** @format */
import { BpnNetwork, Chaincode } from "../../../bpn-network"
import { BlockDecoder } from "../../../blockparser"
import * as fabprotos from "fabric-protos"
import Long from "long"

export class BlockchainInfo {
	constructor(
		public height: Long,
		public currentBlockHash: string,
		public previousBlockHash: string
	) {}
}

export class Qscc extends Chaincode {
	static async create(bpnNetwork: BpnNetwork): Promise<Qscc> {
		const channelName = bpnNetwork.getChannelName()
		const contract = await bpnNetwork.getContract('qscc')
		return new Qscc(channelName, contract, bpnNetwork.chainType, bpnNetwork.chainId)
	}

	async getBlockByNumber(blockNumber: number) {
		const blockRaw = await this.queryRaw("GetBlockByNumber", [this.channelName, blockNumber.toString()])
		return BlockDecoder.decodeBlock(blockRaw)
	}

	async getChainInfo(): Promise<BlockchainInfo> {
		const response = await this.queryRaw("GetChainInfo", [this.channelName])
		const blockchainInfo = fabprotos.common.BlockchainInfo.decode(response)

		return new BlockchainInfo(
			blockchainInfo.height as Long,
			Buffer.from(blockchainInfo.currentBlockHash).toString("hex"),
			Buffer.from(blockchainInfo.previousBlockHash).toString("hex")
		)
	}

	async getBlockByHash(blockHash: string) {
		return await this.query("GetBlockByHash", [this.channelName, blockHash])
	}

	async getBlockByTxID(txID: string) {
		return await this.query("GetBlockByTxID", [this.channelName, txID])
	}

	async getTransactionByID(txID: string) {
		return await this.query("GetTransactionByID", [this.channelName, txID])
	}
}
