/** @format */

import { BpnNetwork, Chaincode } from "../../bpn-network"
import { Account, SigMsg } from "../../types"
import { CliChaincodeInvoker } from "../../cli"
import * as web3Account from "@beatoz/web3-accounts"

export class DappChaincode {
	readonly chaincode: Chaincode

	static async create(bpnNetwork: BpnNetwork, dAppChaincodeName: string) {
		const chaincode = await bpnNetwork.getChaincode(dAppChaincodeName)
		return new DappChaincode(chaincode)
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

	init(cliInvoker: CliChaincodeInvoker, ownerAccount: Account) {
		const methodName = "InitLedger"
		const sigMsg = new SigMsg("", this.chaincode.chaincodeName(), methodName, []).serialize()

		const signature = web3Account.sign(sigMsg, ownerAccount.privateKey).toHex()

		return cliInvoker.invoke(this.chaincode.channelName, this.chaincode.chaincodeName(), methodName, [signature, "", "", "", ""], true)
	}

	async setLinkerEndpoint(fromAccount: Account, linkerEndpointChaincodeName: string) {
		const payload = await this.invoke(fromAccount, "SetLinkerEndpoint", [linkerEndpointChaincodeName])
		console.log("SetLinkerEndpoint response payload: ", payload)

		return {
			linkerChannelIdentity: payload.linkerChannelIdentifier,
			linkerVerifierIdentity: payload.linkerVerifierIdentifier,
		}
	}

	async postMessage(fromAccount: Account, toChainId: string, toDAppAddr: string, toAccount: string, message: string) {
		const payload = await this.invoke(fromAccount, "PostMessage", [toChainId, toDAppAddr, toAccount, message])
		console.log("PostMessage response payload: ", payload)

		return {
			linkerChannelIdentity: payload.linkerChannelIdentifier,
			linkerVerifierIdentity: payload.linkerVerifierIdentifier,
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
		return await this.chaincode.queryWithSig(fromAccount, "GetOutboundMidx", [toChainId, toDAppAddr, to])
	}

	async getInboundMidx(signerAccount: Account, fromChainId: string, fromDAppAddr: string, from: string) {
		return await this.chaincode.queryWithSig(signerAccount, "GetInboundMidx", [fromChainId, fromDAppAddr, from])
	}

	async forceFlushInboundMessages(fromAccount: Account, fromChainId: string, fromDAppAddr: string, from: string, newMidx: string) {
		return this.chaincode.invokeWithSig(fromAccount, "ForceFlushInboundMessages", [fromChainId, fromDAppAddr, from, newMidx, "false"])
	}

	async query(functionName: string, args: string[] = []): Promise<any> {
		return await this.chaincode.query(functionName, args)
	}

	async invoke(signer: Account, functionName: string, args: string[]): Promise<any> {
		return await this.chaincode.invokeWithSig(signer, functionName, args)
	}
}
