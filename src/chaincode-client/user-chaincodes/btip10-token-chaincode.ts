/** @format */
import { BpnNetwork } from "../../bpn-network"
import { CliChaincodeInvoker } from "../../cli"
import { Account } from "../../types/account"
import { SigMsg } from "../generator/sig-msg"
import * as web3Account from "@beatoz/web3-accounts"
import { ContractEvent } from "fabric-network/lib/events"
import logger from "../../logger"
import { Contract } from "fabric-network"
import { Erc20ChaincodeV2 } from "./erc20-chaincode-v2"

// 상속 버전
export class Btip10TokenChaincode extends Erc20ChaincodeV2 {

	static async create(bpnNetwork: BpnNetwork, dAppChaincodeName: string): Promise<Btip10TokenChaincode> {
		const contract = await bpnNetwork.getContract(dAppChaincodeName)
		const channelName = bpnNetwork.getChannelName()
		return new Btip10TokenChaincode(channelName, contract)
	}

	constructor(channelName: string, contract: Contract) {
		super(channelName, contract)
	}

	async addEventListeners() {
		await this.contract.addContractListener(this.chaincodeEventListener)
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

	init(cliInvoker: CliChaincodeInvoker, ownerAccount: Account, name: string, symbol: string, decimals: string, totalSupply: string) {
		const methodName = "InitLedger"
		const args = ["", name, symbol, decimals, totalSupply]
		const sigMsg = new SigMsg(this.chaincodeName(), methodName, args).serialize()
		args[0] = web3Account.sign(sigMsg, ownerAccount.privateKey).toHex()

		return cliInvoker.invoke(this.channelName, this.chaincodeName(), methodName, args, true)
	}

	async setLinkerEndpoint(fromAccount: Account, linkerEndpointChaincodeName: string) {
		const payload = await this.invokeWithSig(fromAccount, "SetLinkerEndpoint", ["", linkerEndpointChaincodeName])
		console.log("SetLinkerEndpoint response payload: ", payload)

		return {
			linkerChannelIdentity: payload.linkerChannelIdentity,
			linkerVerifierIdentity: payload.linkerVerifierIdentity
		}
	}

	async postAmount(fromAccount: Account, toChainId: string, toDAppAddr: string, toAccount: string, amount : string) {
		const midx = await this.invokeWithSig(fromAccount, "PostAmount", ["", toChainId, toDAppAddr, toAccount, amount])
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
		const payload = await this.invokeWithSig(fromAccount, "PostMessage", ["", toChainId, toDAppAddr, toAccount, message])
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
		return await this.queryWithSig(fromAccount, "GetOutboundMidx", ["", toChainId, toDAppAddr, to])
	}

	async getInboundMidx(signerAccount: Account, fromChainId: string, fromDAppAddr: string, from: string) {
		return await this.queryWithSig(signerAccount, "GetInboundMidx", ["", fromChainId, fromDAppAddr, from])
	}

	async forceFlushInboundMessages(fromAccount: Account, fromChainId: string, fromDAppAddr: string, from: string, newMidx: string) {
		return await this.invokeWithSig(fromAccount, "ForceFlushInboundMessages", ["", fromChainId, fromDAppAddr, from, newMidx, "false"])
	}

    async crossChainTest(dAppChaincodeName: string, dAppOwnerAddr: Account) {
      return await this.invoke("CrossChainTest", [dAppChaincodeName, dAppOwnerAddr.address])
    }

  async Test02(data: string,) {
    return await this.invoke("Test02", [data])
  }

	async getChainId(): Promise<string> {
		const chainId = await this.query("GetChainId", [])
		return chainId as string
	}

	// async balanceOf(address: string) {
	// 	return await this.query("BalanceOf", [address])
	// }
	//
	// async totalSupply() {
	// 	return await this.query("TotalSupply", [])
	// }
	//
	// async symbol(): Promise<string> {
	// 	return await this.query("Symbol", [])
	// }
	//
	// async name(): Promise<string> {
	// 	return await this.query("Name", [])
	// }
	//
	// async decimals(): Promise<string> {
	// 	return await this.query("Decimals", [])
	// }
}