/** @format */

import { BpnNetwork } from "../../bpn-network"
import { Account } from "../../types"
import { Btip10TokenChaincode } from "./btip10-token-chaincode"
import type { PreparedTransaction } from "../../bpn-network"

export interface PermissionStatus {
	frozen: boolean
	blacklisted: boolean
	whitelisted: boolean
	sendBlocked: boolean
	receiveBlocked: boolean
	mintRole: boolean
	burnRole: boolean
	userLimit: string
	paused: boolean
}

export type PermissionPrefix =
	| "frozen"
	| "blacklist"
	| "whitelist"
	| "blockSend"
	| "blockReceive"
	| "mintRole"
	| "burnRole"

export class Btip10StablecoinChaincode extends Btip10TokenChaincode {
	static async create(
		bpnNetwork: BpnNetwork,
		stablecoinChaincodeName: string,
	): Promise<Btip10StablecoinChaincode> {
		const contract = await bpnNetwork.getContract(stablecoinChaincodeName)
		const channelName = bpnNetwork.getChannelName()
		return new Btip10StablecoinChaincode(
			channelName,
			contract,
			bpnNetwork.chainType,
			bpnNetwork.chainId,
		)
	}

	async getPermissionStatus(address: string): Promise<PermissionStatus> {
		const raw = await this.query("GetPermissionStatus", [address])
		const str = typeof raw === "string" ? raw : String(raw)
		return JSON.parse(str) as PermissionStatus
	}

	async getAddressesWithPermission(permission: PermissionPrefix | string): Promise<string[]> {
		const raw = await this.query("GetAddressesWithPermission", [permission])
		const str = typeof raw === "string" ? raw : String(raw)
		return JSON.parse(str) as string[]
	}

	async isPaused(): Promise<boolean> {
		const raw = await this.query("IsPaused", [])
		const str = typeof raw === "string" ? raw : String(raw)
		return str === "true" || str === "1"
	}

	async grantChaincodeAddressPermissions(ownerAccount: Account): Promise<void> {
		await this.invokeWithSig(ownerAccount, "GrantChaincodeAddressPermissions", [""])
	}

	prepareGrantChaincodeAddressPermissions(): PreparedTransaction {
		return this.prepareTxWithSigMsg("GrantChaincodeAddressPermissions", [""])
	}

	async blockSend(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "BlockSend", ["", address])
	}

	prepareBlockSend(address: string): PreparedTransaction {
		return this.prepareTxWithSigMsg("BlockSend", ["", address])
	}

	async unblockSend(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "UnblockSend", ["", address])
	}

	prepareUnblockSend(address: string): PreparedTransaction {
		return this.prepareTxWithSigMsg("UnblockSend", ["", address])
	}

	async blockReceive(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "BlockReceive", ["", address])
	}

	prepareBlockReceive(address: string): PreparedTransaction {
		return this.prepareTxWithSigMsg("BlockReceive", ["", address])
	}

	async unblockReceive(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "UnblockReceive", ["", address])
	}

	prepareUnblockReceive(address: string): PreparedTransaction {
		return this.prepareTxWithSigMsg("UnblockReceive", ["", address])
	}

	async freeze(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "Freeze", ["", address])
	}

	prepareFreeze(address: string): PreparedTransaction {
		return this.prepareTxWithSigMsg("Freeze", ["", address])
	}

	async unfreeze(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "Unfreeze", ["", address])
	}

	prepareUnfreeze(address: string): PreparedTransaction {
		return this.prepareTxWithSigMsg("Unfreeze", ["", address])
	}

	async grantMint(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "GrantMint", ["", address])
	}

	prepareGrantMint(address: string): PreparedTransaction {
		return this.prepareTxWithSigMsg("GrantMint", ["", address])
	}

	async grantBurn(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "GrantBurn", ["", address])
	}

	prepareGrantBurn(address: string): PreparedTransaction {
		return this.prepareTxWithSigMsg("GrantBurn", ["", address])
	}

	async pause(ownerAccount: Account): Promise<void> {
		await this.invokeWithSig(ownerAccount, "Pause", [""])
	}

	preparePause(): PreparedTransaction {
		return this.prepareTxWithSigMsg("Pause", [""])
	}

	async unpause(ownerAccount: Account): Promise<void> {
		await this.invokeWithSig(ownerAccount, "Unpause", [""])
	}

	prepareUnpause(): PreparedTransaction {
		return this.prepareTxWithSigMsg("Unpause", [""])
	}

	async revokeMint(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "RevokeMint", ["", address])
	}

	prepareRevokeMint(address: string): PreparedTransaction {
		return this.prepareTxWithSigMsg("RevokeMint", ["", address])
	}

	async revokeBurn(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "RevokeBurn", ["", address])
	}

	prepareRevokeBurn(address: string): PreparedTransaction {
		return this.prepareTxWithSigMsg("RevokeBurn", ["", address])
	}

	async blacklist(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "Blacklist", ["", address])
	}

	prepareBlacklist(address: string): PreparedTransaction {
		return this.prepareTxWithSigMsg("Blacklist", ["", address])
	}

	async unblacklist(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "Unblacklist", ["", address])
	}

	prepareUnblacklist(address: string): PreparedTransaction {
		return this.prepareTxWithSigMsg("Unblacklist", ["", address])
	}

	async whitelist(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "Whitelist", ["", address])
	}

	prepareWhitelist(address: string): PreparedTransaction {
		return this.prepareTxWithSigMsg("Whitelist", ["", address])
	}

	async setWhitelistMode(ownerAccount: Account, enabled: boolean): Promise<void> {
		await this.invokeWithSig(ownerAccount, "SetWhitelistMode", ["", enabled ? "1" : "0"])
	}

	prepareSetWhitelistMode(enabled: boolean): PreparedTransaction {
		return this.prepareTxWithSigMsg("SetWhitelistMode", ["", enabled ? "1" : "0"])
	}

	async setUserLimit(ownerAccount: Account, address: string, limit: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "SetUserLimit", ["", address, limit])
	}

	prepareSetUserLimit(address: string, limit: string): PreparedTransaction {
		return this.prepareTxWithSigMsg("SetUserLimit", ["", address, limit])
	}

	async setRedemptionWallet(ownerAccount: Account, redemptionWalletAddress: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "SetRedemptionWallet", ["", redemptionWalletAddress])
	}

	prepareSetRedemptionWallet(redemptionWalletAddress: string): PreparedTransaction {
		return this.prepareTxWithSigMsg("SetRedemptionWallet", ["", redemptionWalletAddress])
	}

	async getRedemptionWallet(): Promise<string> {
		return await this.query("GetRedemptionWallet", [])
	}

	async setIssuanceEscrowChaincode(ownerAccount: Account, chaincodeName: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "SetIssuanceEscrowChaincode", ["", chaincodeName])
	}

	prepareSetIssuanceEscrowChaincode(chaincodeName: string): PreparedTransaction {
		return this.prepareTxWithSigMsg("SetIssuanceEscrowChaincode", ["", chaincodeName])
	}

	async getIssuanceEscrowChaincode(): Promise<string> {
		return await this.query("GetIssuanceEscrowChaincode", [])
	}

	async requestIssuanceToEscrow(
		ownerAccount: Account,
		payerAddress: string,
		recipientAddress: string,
		amount: string,
		clientRequestID: string = "",
	): Promise<string> {
		const requestId = await this.invokeWithSig(ownerAccount, "RequestIssuanceToEscrow", [
			"",
			payerAddress,
			recipientAddress,
			amount,
			clientRequestID,
		])
		return typeof requestId === "string" ? requestId : String(requestId)
	}

	prepareRequestIssuanceToEscrow(
		payerAddress: string,
		recipientAddress: string,
		amount: string,
		clientRequestID: string = "",
	): PreparedTransaction {
		return this.prepareTxWithSigMsg("RequestIssuanceToEscrow", [
			"",
			payerAddress,
			recipientAddress,
			amount,
			clientRequestID,
		])
	}

	async burnFrom(fromAccount: Account, fromAddress: string, burnAmount: string): Promise<void> {
		await this.invokeWithSig(fromAccount, "BurnFrom", ["", fromAddress, burnAmount])
	}

	prepareBurnFrom(fromAddress: string, burnAmount: string): PreparedTransaction {
		return this.prepareTxWithSigMsg("BurnFrom", ["", fromAddress, burnAmount])
	}

	async receive(fromAccount: Account, amount: string): Promise<void> {
		await this.invokeWithSig(fromAccount, "Receive", ["", amount])
	}

	prepareReceive(amount: string): PreparedTransaction {
		return this.prepareTxWithSigMsg("Receive", ["", amount])
	}

	async fallback(fromAccount: Account, amount: string): Promise<void> {
		await this.invokeWithSig(fromAccount, "Fallback", ["", amount])
	}

	prepareFallback(amount: string): PreparedTransaction {
		return this.prepareTxWithSigMsg("Fallback", ["", amount])
	}

	async withdraw(fromAccount: Account, amount: string): Promise<void> {
		await this.invokeWithSig(fromAccount, "Withdraw", ["", amount])
	}

	prepareWithdraw(amount: string): PreparedTransaction {
		return this.prepareTxWithSigMsg("Withdraw", ["", amount])
	}
}
