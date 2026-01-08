/** @format */

import { BpnNetwork, Chaincode } from "../../bpn-network"
import { Account } from "../../types/account"
import { CliChaincodeInvoker } from "../../cli"
import { SigMsg } from "../generator/sig-msg"
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
		const sigMsg = new SigMsg(
			this.chaincode.chaincodeName(),
			methodName,
			[]
		).serialize()

		const signature = web3Account.sign(sigMsg, ownerAccount.privateKey).toHex()

		return cliInvoker.invoke(
			this.chaincode.channelName,
			this.chaincode.chaincodeName(),
			methodName,
			[signature, "", "", "", ""],
			true
		)
	}

	async setLinkerEndpoint(fromAccount: Account, linkerEndpointChaincodeName: string) {
		const payload = await this.invoke(fromAccount, "SetLinkerEndpoint", [linkerEndpointChaincodeName])
		console.log("SetLinkerEndpoint response payload: ", payload)

		return {
			linkerChannelIdentity: payload.linkerChannelIdentifier,
			linkerVerifierIdentity: payload.linkerVerifierIdentifier
		}
	}

	async postMessage(fromAccount: Account, toChainId: string, toDAppAddr: string, toAccount: string, message : string) {
		const payload = await this.invoke(fromAccount, "PostMessage", [toChainId, toDAppAddr, toAccount, message])
		console.log("PostMessage response payload: ", payload)

		return {
			linkerChannelIdentity: payload.linkerChannelIdentifier,
			linkerVerifierIdentity: payload.linkerVerifierIdentifier
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
		console.log("GetOutboundMidx response:", response)

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
		console.log("GetInboundMidx response:", response)

		return response
	}

	async forceFlushInboundMessages(fromAccount: Account, fromChainId: string, fromDAppAddr: string, from: string, newMidx: string) {
		const response = await this.invoke(fromAccount, "ForceFlushInboundMessages", [fromChainId, fromDAppAddr, from, newMidx, "false"])
		console.log("ForceFlushInboundMessages response:", response)

		return response
	}



	async query(functionName: string, args: string[] = []): Promise<any> {
		return await this.chaincode.query(functionName, args)
	}

	async invoke(signer: Account, functionName: string, args: string[]): Promise<any> {
		//const erc20Args = await this.erc20ArgsCreator.createArgs(signer, this.chaincode, functionName, args)
		const sigMsg = new SigMsg(
			this.chaincode.chaincodeName(),
			functionName,
			args,
		).serialize()
		const signature = web3Account.sign(sigMsg, signer.privateKey).toHex()

		const response = await this.chaincode.submit(functionName, [signature, ...args])
		return response.payload
		//return result.payload.tx.payload.details
	}


}
