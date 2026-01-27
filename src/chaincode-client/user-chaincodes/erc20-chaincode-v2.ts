/** @format */

import { Account } from "../../types"
import { CliChaincodeInvoker } from "../../cli"
import { BpnNetwork } from "../../bpn-network"
import { Erc20CoreChaincode } from "./erc20-core-chaincode"

export class Erc20ChaincodeV2 extends Erc20CoreChaincode {

	static async create(bpnNetwork: BpnNetwork, dAppChaincodeName: string) {
		const contract = await bpnNetwork.getContract(dAppChaincodeName)
		const channelName = bpnNetwork.getChannelName()
		return new Erc20ChaincodeV2(channelName, contract, bpnNetwork.chainType, bpnNetwork.chainId)
	}

	init(
		cliInvoker: CliChaincodeInvoker,
		name: string,
		symbol: string,
		decimal: string,
		initAmount: string,
		ownerAddress: string,
	) {
		this.erc20ChaincodeInfo = { chaincodeName: this.chaincodeName(), name, symbol, decimal }
		const chaincodeFunctionName = "InitLedger"
		const chaincodeArgs = [ownerAddress, name, symbol, decimal, initAmount]
		cliInvoker.invoke(this.channelName, this.chaincodeName(), chaincodeFunctionName, chaincodeArgs, true)
	}
}
