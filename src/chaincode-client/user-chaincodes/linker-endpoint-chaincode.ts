/** @format */

import { BpnNetwork, Chaincode } from "../../bpn-network"
import type { ChaincodeActor, ChaincodeSigner } from "../../bpn-network"
import { CliChaincodeInvoker } from "../../cli"
import { ContractEvent } from "fabric-network/lib/events"
import logger from "../../logger"
import { resolveChaincodeSignerAddress, signChaincodeRequest } from "../../bpn-network"

export class LinkerEndpointChaincode {
	readonly chaincode: Chaincode

	static async create(bpnNetwork: BpnNetwork, linkerEndpointChaincodeName: string) {
		const chaincode = await bpnNetwork.getChaincode(linkerEndpointChaincodeName)
		return new LinkerEndpointChaincode(chaincode)
	}

	constructor(chaincode: Chaincode) {
		this.chaincode = chaincode
	}

	async init(cliInvoker: CliChaincodeInvoker, ownerAccount: ChaincodeSigner) {
		const methodName = "InitLedger"
		const args = [""]
		args[0] = await signChaincodeRequest(ownerAccount, this.chaincode.createSignatureRequest("", methodName, args))

		return cliInvoker.invoke(this.chaincode.channelName, this.chaincode.chaincodeName(), methodName, args, true)
	}

	chaincodeName() {
		return this.chaincode.chaincodeName()
	}

	chaincodeAddress() {
		return this.chaincode.chaincodeAddress()
	}

	async registerDApp(dAppOwner: string) {
		const payload = await this.invoke("RegisterDApp", [dAppOwner])
		console.log("registerDApp response payload", payload)

		return {
			linkerChannelIdentity: payload.linkerChannelIdentifier,
			linkerVerifierIdentity: payload.linkerVerifierIdentifier,
		}
	}

	async onMessage(
		fromChainId: string,
		fromDAppAddr: string,
		from: string,
		toChainId: string,
		toDAppChaincodeName: string,
		to: string,
		midx: string,
		message: string
	) {
		const payload = await this.chaincode.submit("OnMessage", [fromChainId, fromDAppAddr, from, toChainId, toDAppChaincodeName, to, midx, message])
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
		const payload = await this.chaincode.submit("OnResponse", [fromChainId, fromDAppAddr, from, toChainId, toDAppChaincodeName, to, midx, result])
		console.log("OnResponse response payload", payload)
	}

	async addDAppChannel(dAppChaincodeName: string, toChainId: string, toDAppContractAddress: string) {
		await this.invoke("AddDAppChannel", [dAppChaincodeName, toChainId, toDAppContractAddress])
	}

	async getChannelId(dAppChaincodeName: string, toChainId: string, toDAppContractAddress: string) {
		const dAppChannelId = await this.invoke("GetChannelId", [dAppChaincodeName, toChainId, toDAppContractAddress])
		return dAppChannelId
	}

	async dAppChannelCount(dAppChaincodeName: string) {
		const dAppChannelCount = await this.invoke("DappChannelCount", [dAppChaincodeName])
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
		const inboundMidx = await this.invoke("InboundMidxs", [dAppAddress, linkerChannelIdentity, fromChainId, fromDAppAddress, toAccount, fromAccount])
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
		const outboundMidx = await this.invoke("OutboundMidxs", [dAppAddress, linkerChannelIdentity, toChainId, toDAppAddress, fromAccount, toAccount])
		return outboundMidx
	}

	async crossChainTest(dAppChaincodeName: string, dAppOwnerAddr: ChaincodeActor) {
		return await this.invoke("CrossChainTest", [dAppChaincodeName, resolveChaincodeSignerAddress(dAppOwnerAddr)])
	}

	async addEventListeners() {
		await this.chaincode.contract.addContractListener(this.chaincodeEventListener)
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

	async query(functionName: string, args: string[] = []): Promise<any> {
		const result = await this.chaincode.query(functionName, args)
		return result.query
	}

	async invoke(functionName: string, args: string[]): Promise<any> {
		const response = await this.chaincode.submit(functionName, args)
		return response.payload
	}
}
