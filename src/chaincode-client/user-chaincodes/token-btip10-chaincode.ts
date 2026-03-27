/** @format */
import { BpnNetwork, Chaincode } from "../../bpn-network"
import { CliChaincodeInvoker } from "../../cli"
import type { ChaincodeActor, ChaincodeSigner } from "../../bpn-network"
import { resolveChaincodeSignerAddress, signChaincodeRequest } from "../../bpn-network"
import { ContractEvent } from "fabric-network/lib/events"
import logger from "../../logger"

export class TokenBtip10Chaincode {
	readonly chaincode: Chaincode

	static async create(bpnNetwork: BpnNetwork, dAppChaincodeName: string) {
		const chaincode = await bpnNetwork.getChaincode(dAppChaincodeName)
		return new TokenBtip10Chaincode(chaincode)
	}

	constructor(chaincode: Chaincode) {
		this.chaincode = chaincode
	}

	chaincodeName() {
		return this.chaincode.chaincodeName()
	}

	chaincodeAddress() {
		return this.chaincode.chaincodeAddress()
	}

	async addEventListeners() {
		await this.chaincode.contract.addContractListener(this.chaincodeEventListener)
	}

	public chaincodeEventListener = async (contractEvent: ContractEvent) => {
		try {
			const txEvent = contractEvent.getTransactionEvent()
			void txEvent.getContractEvents()
			console.log("token contract event: ", contractEvent)
			logger.info(`${this.chaincodeEventListener.name}: ${contractEvent.chaincodeId}`)
			console.log(contractEvent)
		} catch (err) {
			logger.error(`${this.chaincodeEventListener.name} error: ${err instanceof Error ? err.message : String(err)}`)
		}
	}

	async init(cliInvoker: CliChaincodeInvoker, ownerAccount: ChaincodeSigner, name: string, symbol: string, decimal: string) {
		const methodName = "InitLedger"
		const signature = await signChaincodeRequest(ownerAccount, this.chaincode.createSignatureRequest("", methodName, [name, symbol, decimal]))

		return cliInvoker.invoke(this.chaincode.channelName, this.chaincode.chaincodeName(), methodName, [signature, name, symbol, decimal], true)
	}

	async setLinkerEndpoint(fromAccount: ChaincodeSigner, linkerEndpointChaincodeName: string) {
		const payload = await this.chaincode.invokeWithSig(fromAccount, "SetLinkerEndpoint", [linkerEndpointChaincodeName])
		console.log("SetLinkerEndpoint response payload: ", payload)

		return {
			linkerChannelIdentity: payload.linkerChannelIdentifier,
			linkerVerifierIdentity: payload.linkerVerifierIdentifier,
		}
	}

	async postAmount(fromAccount: ChaincodeSigner, toChainId: string, toDAppAddr: string, toAccount: string, amount: string) {
		const midx = await this.chaincode.invokeWithSig(fromAccount, "PostAmount", [toChainId, toDAppAddr, toAccount, amount])
		return midx
	}

	async onMessage(fromChainId: string, fromDAppAddr: string, fromAccount: string, toAccount: string, midx: string, message: string) {
		return await this.chaincode.invoke("OnMessage", [fromChainId, fromDAppAddr, fromAccount, toAccount, midx, message])
	}

	async onResponse(fromAccount: ChaincodeActor, toChainId: string, toDAppAddr: string, toAccount: string, midx: string, result: string) {
		return await this.chaincode.invoke("OnResponse", [resolveChaincodeSignerAddress(fromAccount), toChainId, toDAppAddr, toAccount, midx, result])
	}

	async postMessage(fromAccount: ChaincodeSigner, toChainId: string, toDAppAddr: string, toAccount: string, message: string) {
		const payload = await this.chaincode.invokeWithSig(fromAccount, "PostMessage", [toChainId, toDAppAddr, toAccount, message])
		return {
			linkerChannelIdentity: payload.linkerChannelIdentifier,
			linkerVerifierIdentity: payload.linkerVerifierIdentifier,
		}
	}

	async linkerEndpoint() {
		const linkerEndpointChaincodeName = await this.chaincode.query("LinkerEndpoint")
		console.log("LinkerEndpoint response:", linkerEndpointChaincodeName)

		return linkerEndpointChaincodeName
	}

	async linkerChannel() {
		return await this.chaincode.query("LinkerChannel")
	}

	async getOutboundMidx(fromAccount: ChaincodeSigner, toChainId: string, toDAppAddr: string, to: string) {
		return await this.chaincode.queryWithSig(fromAccount, "GetOutboundMidx", [toChainId, toDAppAddr, to])
	}

	async getInboundMidx(signerAccount: ChaincodeSigner, fromChainId: string, fromDAppAddr: string, from: string) {
		return await this.chaincode.queryWithSig(signerAccount, "GetInboundMidx", [fromChainId, fromDAppAddr, from])
	}

	async forceFlushInboundMessages(fromAccount: ChaincodeSigner, fromChainId: string, fromDAppAddr: string, from: string, newMidx: string) {
		return await this.chaincode.invokeWithSig(fromAccount, "ForceFlushInboundMessages", [fromChainId, fromDAppAddr, from, newMidx, "false"])
	}

	async getChainId(): Promise<string> {
		const chainId = await this.query("GetChainId", [])
		return chainId as string
	}

	async balanceOf(address: string) {
		const balance = await this.query("BalanceOf", [address])
		return balance
	}
	async totalSupply() {
		const totalSupply = await this.query("TotalSupply", [])
		return totalSupply
	}

	async symbol(): Promise<string> {
		return await this.query("Symbol", [])
	}

	async name(): Promise<string> {
		return await this.query("Name", [])
	}

	async decimals(): Promise<string> {
		return await this.query("Decimals", [])
	}

	async query(functionName: string, args: string[] = []): Promise<any> {
		const response = await this.chaincode.query(functionName, args)
		return response
	}
}
