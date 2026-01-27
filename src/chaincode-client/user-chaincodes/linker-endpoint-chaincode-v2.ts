/** @format */

import { BpnNetwork, Chaincode } from "../../bpn-network"
import { Account, SigMsg } from "../../types"
import { CliChaincodeInvoker } from "../../cli"
import * as web3Account from "@beatoz/web3-accounts"
import { ContractEvent } from "fabric-network/lib/events"
import logger from "../../logger"

export class LinkerEndpointChaincodeV2 extends Chaincode {
	static async create(bpnNetwork: BpnNetwork, linkerEndpointChaincodeName: string) {
		const contract = await bpnNetwork.getContract(linkerEndpointChaincodeName)
		const channelName = bpnNetwork.getChannelName()
		return new LinkerEndpointChaincodeV2(channelName, contract, bpnNetwork.chainType, bpnNetwork.chainId)
	}

	init(cliInvoker: CliChaincodeInvoker, ownerAccount: Account) {
		const methodName = "InitLedger"
		const args = [""]
		const emptyTxid = ""
		const sigMsg = new SigMsg(emptyTxid, this.chaincodeName(), methodName, args).serialize()

		args[0] = web3Account.sign(sigMsg, ownerAccount.privateKey).toHex()

		return cliInvoker.invoke(this.channelName, this.chaincodeName(), methodName, args, true)
	}

	async registerDApp(fromAccount: Account, dAppOwner: string) {
		const payload = await this.invoke("RegisterDApp", [dAppOwner])
		console.log("registerDApp response payload", payload)

		return {
			linkerChannelIdentity: payload.linkerChannelIdentifier,
			linkerVerifierIdentity: payload.linkerVerifierIdentifier,
		}
	}

	async onMessage(
		signer: Account,
		fromChainId: string,
		fromDAppAddr: string,
		from: string,
		toChainId: string,
		toDAppChaincodeName: string,
		to: string,
		midx: string,
		message: string
	) {
		const emptySig = ""
		const payload = await this.invokeWithSig(signer, "OnMessage", [
			emptySig,
			fromChainId,
			fromDAppAddr,
			from,
			toChainId,
			toDAppChaincodeName,
			to,
			midx,
			message,
		])
		console.log("OnMessage response payload", payload)
	}

	async onResponse(
		fromChainId: string,
		fromDAppAddr: string,
		from: string,
		toChainId: string,
		toDAppChaincodeName: string,
		to: string,
		midx: string,
		result: string
	) {
		const payload = await this.submit("OnResponse", [fromChainId, fromDAppAddr, from, toChainId, toDAppChaincodeName, to, midx, result])
		console.log("OnResponse response payload", payload)
	}

	async addDAppChannel(fromAccount: Account, dAppChaincodeName: string, toChainId: string, toDAppContractAddress: string) {
		const payload = await this.invokeWithSig(fromAccount, "AddDAppChannel", ["", dAppChaincodeName, toChainId, toDAppContractAddress])
	}

	async getChannelId(dAppChaincodeName: string, toChainId: string, toDAppContractAddress: string) {
		const dAppChannelId = await this.query("GetChannelId", [dAppChaincodeName, toChainId, toDAppContractAddress])
		return dAppChannelId
	}

	async dAppChannelCount(fromAccount: Account, dAppChaincodeName: string) {
		const dAppChannelCount = await this.query("DappChannelCount", [dAppChaincodeName])
		return dAppChannelCount
	}

	async inboundMidxs(
		dAppAddress: string,
		linkerChannelIdentity: string,
		fromChainId: string,
		fromDAppAddress: string,
		toAccount: string,
		fromAccount: string
	) {
		const inboundMidx = await this.query("InboundMidxs", [dAppAddress, linkerChannelIdentity, fromChainId, fromDAppAddress, toAccount, fromAccount])
		return inboundMidx
	}

	async outboundMidxs(
		dAppAddress: string,
		linkerChannelIdentity: string,
		toChainId: string,
		toDAppAddress: string,
		fromAccount: string,
		toAccount: string
	) {
		const outboundMidx = await this.query("OutboundMidxs", [dAppAddress, linkerChannelIdentity, toChainId, toDAppAddress, fromAccount, toAccount])
		return outboundMidx
	}

	async linkerChannels(dAppAddress: string) {
		return await this.query("LinkerChannels", [dAppAddress])
	}

	async linkerVerifiers(dAppAddress: string) {
		return await this.query("LinkerVerifiers", [dAppAddress])
	}

	async crossChainTest(dAppChaincodeName: string, dAppOwnerAddr: Account) {
		return await this.invoke("CrossChainTest", [dAppChaincodeName, dAppOwnerAddr.address])
	}

	async addEventListeners() {
		await this.contract.addContractListener(this.chaincodeEventListener)
	}

	public chaincodeEventListener = async (contractEvent: ContractEvent) => {
		try {
			console.log("endpoint event: ", contractEvent)
			logger.info(`${this.chaincodeEventListener.name}: ${contractEvent.chaincodeId}`)
			console.log(contractEvent)
		} catch (err) {
			logger.error(`${this.chaincodeEventListener.name} error: ${err instanceof Error ? err.message : String(err)}`)
		}
	}
}
