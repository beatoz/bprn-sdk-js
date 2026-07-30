/** @format */

import {
	Btip34PermissionTokenChaincode,
	type Btip34PermissionPrefix,
	type Btip34PermissionStatus,
	type Btip34PermissionTokenInfo,
	type Btip34PendingPayment,
	type Btip34SettlementRoute,
	type Btip34FinalizedPayment,
	type Btip34LinkerStatus,
	type Btip34AssetOutcome,
	type Btip34SettlementMode,
} from "./btip34-permission-token-chaincode"
import type { BpnNetwork } from "../../bpn-network"

export class StablecoinV2Chaincode extends Btip34PermissionTokenChaincode {
	static async create(
		bpnNetwork: BpnNetwork,
		chaincodeName: string,
	): Promise<StablecoinV2Chaincode> {
		const contract = await bpnNetwork.getContract(chaincodeName)
		const channelName = bpnNetwork.getChannelName()
		return new StablecoinV2Chaincode(bpnNetwork, channelName, contract)
	}
}

export type StablecoinV2Info = Btip34PermissionTokenInfo
export type StablecoinV2PermissionStatus = Btip34PermissionStatus
export type StablecoinV2PermissionPrefix = Btip34PermissionPrefix
export type StablecoinV2PendingPayment = Btip34PendingPayment
export type StablecoinV2SettlementRoute = Btip34SettlementRoute
export type StablecoinV2FinalizedPayment = Btip34FinalizedPayment
export type StablecoinV2LinkerStatus = Btip34LinkerStatus
export type StablecoinV2AssetOutcome = Btip34AssetOutcome
export type StablecoinV2SettlementMode = Btip34SettlementMode
