/** @format */
import { BpnNetwork, Chaincode } from "../../../bpn-network"
import { BlockDecoder, DecodedBlock } from "../../../blockparser"
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
		return new Qscc(bpnNetwork, channelName, contract)
	}

	async getBlockByNumber(blockNumber: Long) {
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

	async getChainInfoByPeer(): Promise<Map<string, BlockchainInfo>> {
		const proposalResponse = await this.queryWithEndorsers("GetChainInfo", [this.channelName], this.bpnNetwork.getEndorsers())
		if (!proposalResponse.responses || proposalResponse.responses.length === 0) {
			throw new Error("QSCC GetChainInfo returned no responses")
		}

		const result = new Map<string, BlockchainInfo>()
		for (const response of proposalResponse.responses) {
			const peer = response.connection.name

			const payload = response.response?.payload
			if (!payload) {
				continue
			}
			const info = fabprotos.common.BlockchainInfo.decode(payload)
			result.set(
				peer,
				new BlockchainInfo(
					info.height as Long,
					Buffer.from(info.currentBlockHash).toString("hex"),
					Buffer.from(info.previousBlockHash).toString("hex")
				)
			)
		}
		return result
	}

	async getBlockByHash(blockHash: string) {
		return await this.query("GetBlockByHash", [this.channelName, blockHash])
	}

	async getBlockByTxID(txID: string): Promise<Map<string, DecodedBlock>> {
		const proposalResponse = await this.queryWithEndorsers("GetBlockByTxID", [this.channelName, txID], this.bpnNetwork.getEndorsers())
		if (!proposalResponse.responses || proposalResponse.responses.length === 0) {
			throw new Error("QSCC GetBlockByTxID returned no responses")
		}

		const result = new Map<string, DecodedBlock>()
		for (const response of proposalResponse.responses) {
			const peer = response.connection.name
			const payload = response.response?.payload
			if (!payload) {
				continue
			}
			result.set(peer, BlockDecoder.decodeBlock(payload))
		}
		return result
	}

	async getBlockByTxID2(txID: string): Promise<Map<string, fabprotos.common.Block>> {
		const proposalResponse = await this.queryWithEndorsers(
			"GetBlockByTxID", [this.channelName, txID], this.bpnNetwork.getEndorsers()
		)
		if (!proposalResponse.responses || proposalResponse.responses.length === 0) {
			throw new Error("QSCC GetBlockByTxID returned no responses")
		}

		//const result = new Map<string, fabprotos.common.IBlock>()
		const result = new Map<string, fabprotos.common.Block>()
		for (const response of proposalResponse.responses) {
			const peer = response.connection.name
			const payload = response.response?.payload
			if (!payload) {
				continue
			}
			result.set(peer, fabprotos.common.Block.decode(payload))
		}
		return result
	}

	async getTransactionByID(txID: string) {
		return await this.query("GetTransactionByID", [this.channelName, txID])
	}
}
