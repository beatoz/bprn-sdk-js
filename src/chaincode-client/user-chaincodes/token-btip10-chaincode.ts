/** @format */
import { BpnNetwork, Chaincode } from "../../bpn-network"
import { CliChaincodeInvoker } from "../../cli"
import { Account } from "../../types/account"
import { SigMsg } from "../generator/sig-msg"
import * as web3Account from "@beatoz/web3-accounts"
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
			const events = txEvent.getContractEvents()
			console.log("token contract event: ", contractEvent)
			logger.info(`${this.chaincodeEventListener.name}: ${contractEvent.chaincodeId}`);
			console.log(contractEvent)
		} catch (err) {
			logger.error(`${this.chaincodeEventListener.name} error: ${err instanceof Error ? err.message : String(err)}`);
		}
	};

	init(cliInvoker: CliChaincodeInvoker, ownerAccount: Account, name: string, symbol: string, decimal: string,) {
		const methodName = "InitLedger"
		const sigMsg =
			new SigMsg(
				this.chaincode.chaincodeName(), methodName, [name, symbol, decimal]).serialize()
		const signature = web3Account.sign(sigMsg, ownerAccount.privateKey).toHex()

		return cliInvoker.invoke(this.chaincode.channelName, this.chaincode.chaincodeName(), methodName, [signature, name, symbol, decimal], true)
	}

	async setLinkerEndpoint(fromAccount: Account, linkerEndpointChaincodeName: string) {
		const payload = await this.invokeWithSig(fromAccount, "SetLinkerEndpoint", [linkerEndpointChaincodeName])
		console.log("SetLinkerEndpoint response payload: ", payload)

		return {
			linkerChannelIdentity: payload.linkerChannelIdentity,
			linkerVerifierIdentity: payload.linkerVerifierIdentity
		}
	}

	async postAmount(fromAccount: Account, toChainId: string, toDAppAddr: string, toAccount: string, amount : string) {
		const midx = await this.invokeWithSig(fromAccount, "PostAmount", [toChainId, toDAppAddr, toAccount, amount])
		return midx
	}

	async onMessage(fromChainId: string, fromDAppAddr: string, fromAccount: string, toAccount: string, midx: string, message : string) {
		const response = await this.invoke("OnMessage", [fromChainId, fromDAppAddr, fromAccount, toAccount, midx, message])
		console.log("OnMessage response:", response)
		return response
	}

	async onResponse(fromAccount: Account, toChainId: string, toDAppAddr: string, toAccount: string, midx: string, result : string) {
		await this.invoke("OnResponse", [fromAccount.address, toChainId, toDAppAddr, toAccount, midx, result])
	}

	async postMessage(fromAccount: Account, toChainId: string, toDAppAddr: string, toAccount: string, message : string) {
		const payload = await this.invokeWithSig(fromAccount, "PostMessage", [toChainId, toDAppAddr, toAccount, message])
		console.log("PostMessage response payload: ", payload)

		return {
			linkerChannelIdentity: payload.linkerChannelIdentity,
			linkerVerifierIdentity: payload.linkerVerifierIdentity
		}
	}

	async linkerEndpoint() {
		const linkerEndpointChaincodeName = await this.query("LinkerEndpoint")
		console.log("LinkerEndpoint response:", linkerEndpointChaincodeName)

		return linkerEndpointChaincodeName
	}

	async linkerChannel() {
		const response = await this.query("LinkerChannel")
		console.log("LinkerChannel response:", response)

		return response
	}

	async getOutboundMidx(fromAccount: Account, toChainId: string, toDAppAddr: string, to: string) {
		const sigMsg = new SigMsg(
			this.chaincode.chaincodeName(),
			"GetOutboundMidx",
			[toChainId, toDAppAddr, to],
		).serialize()
		const signature = web3Account.sign(sigMsg, fromAccount.privateKey).toHex()

		const response = await this.query("GetOutboundMidx", [signature, toChainId, toDAppAddr, to])
		return response
	}

	async getInboundMidx(signerAccount: Account, fromChainId: string, fromDAppAddr: string, from: string) {
		const sigMsg = new SigMsg(
			this.chaincode.chaincodeName(),
			"GetInboundMidx",
			[fromChainId, fromDAppAddr, from],
		).serialize()
		const signature = web3Account.sign(sigMsg, signerAccount.privateKey).toHex()

		const response = await this.query("GetInboundMidx", [signature, fromChainId, fromDAppAddr, from])
		return response
	}

	async forceFlushInboundMessages(fromAccount: Account, fromChainId: string, fromDAppAddr: string, from: string, newMidx: string) {
		const response = await this.invokeWithSig(fromAccount, "ForceFlushInboundMessages", [fromChainId, fromDAppAddr, from, newMidx, "false"])
		console.log("ForceFlushInboundMessages response:", response)

		return response
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

	async invoke(functionName: string, args: string[]): Promise<any> {
		const response = await this.chaincode.submit(functionName, [...args])
		return response.payload
	}

	async invokeWithSig(signer: Account, functionName: string, args: string[]): Promise<any> {
		const sigMsg = new SigMsg(
			this.chaincode.chaincodeName(),
			functionName,
			args,
		).serialize()
		const signature = web3Account.sign(sigMsg, signer.privateKey).toHex()

		return this.invoke(functionName, [signature, ...args])
		// const response = await this.chaincode.submit(functionName, [signature, ...args])
		// return response.payload
	}
}