/** @format */

import { BpnNetwork, Chaincode } from "../../bpn-network"
import { Account } from "../../types/account"
import { CliChaincodeInvoker } from "../../cli"
import { SigMsg } from "../generator/sig-msg"
import * as web3Account from "@beatoz/web3-accounts"
import { ContractEvent } from "fabric-network/lib/events"
import logger from "../../logger"
import { Contract } from "fabric-network"
import { ChainType } from "../../bpn-network/bpn-network"

export class LinkerEndpointChaincodeV2 extends Chaincode {
	static async create(bpnNetwork: BpnNetwork, linkerEndpointChaincodeName: string) {
		const contract = await bpnNetwork.getContract(linkerEndpointChaincodeName)
		const channelName = bpnNetwork.getChannelName()
		return new LinkerEndpointChaincodeV2(channelName, contract, bpnNetwork.chainType)
	}

	init(cliInvoker: CliChaincodeInvoker, ownerAccount: Account) {
		const methodName = "InitLedger"
		const args = [""]
		const sigMsg = new SigMsg(this.chaincodeName(), methodName, args).serialize()

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
		const payload = await this.invokeWithSig(signer, "OnMessage", [
			"",
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

	// async query(functionName: string, args: string[] = []): Promise<any> {
	// 	// const lowerArgs: string[] = []
	// 	// for (let i = 0; i < args.length; i++) {
	// 	// 	lowerArgs.push(String(args[i]).toLowerCase())
	// 	// }
	//
	// 	const result = await this.query(functionName, args)
	// 	return result.query
	// }
	//
	// async invoke(functionName: string, args: string[]): Promise<any> {
	// 	//const erc20Args = await this.erc20ArgsCreator.createArgs(signer, this.chaincode, functionName, args)
	// 	// const sigMsg = new SigMsg(
	// 	// 	new EvmTxParamGenerator().createEvmTxParam(1, 0),
	// 	// 	this.chaincode.chaincodeName(),
	// 	// 	functionName,
	// 	// 	args,
	// 	// ).serializeRlp()
	// 	// const signature = web3Account.sign(sigMsg, signer.privateKey).toHex()
	//
	// 	// 소문자로 변환
	// 	// const lowerArgs: string[] = []
	// 	// for (let i = 0; i < args.length; i++) {
	// 	// 	lowerArgs.push(String(args[i]).toLowerCase())
	// 	// }
	//
	// 	const response = await this.submit(functionName, args)
	// 	return response.payload
	// 	//return result.payload.tx.payload.details
	// }
}
