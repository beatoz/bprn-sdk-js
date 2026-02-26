/** @format */

import { BpnNetwork } from "../../bpn-network"
import { Account } from "../../types"
import { Btip10TokenChaincode } from "./btip10-token-chaincode"

export interface PermissionStatus {
	frozen: boolean
	blacklisted: boolean
	whitelisted: boolean
	canSend: boolean
	canReceive: boolean
	mintRole: boolean
	burnRole: boolean
	userLimit: string
	paused: boolean
}

export type PermissionPrefix =
	| "frozen"
	| "blacklist"
	| "whitelist"
	| "canSend"
	| "canReceive"
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

	/**
	 * @deprecated BTIP10 no longer exposes EnablePermissions.
	 * Kept for compatibility with existing callers.
	 */
	async enablePermissions(ownerAccount: Account): Promise<void> {
		await this.grantChaincodeAddressPermissions(ownerAccount)
	}

	async grantChaincodeAddressPermissions(ownerAccount: Account): Promise<void> {
		await this.invokeWithSig(ownerAccount, "GrantChaincodeAddressPermissions", [""])
	}

	async grantCanSend(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "GrantCanSend", ["", address])
	}

	async grantCanReceive(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "GrantCanReceive", ["", address])
	}

	async freeze(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "Freeze", ["", address])
	}

	async unfreeze(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "Unfreeze", ["", address])
	}

	async grantMint(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "GrantMint", ["", address])
	}

	async grantBurn(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "GrantBurn", ["", address])
	}

	async pause(ownerAccount: Account): Promise<void> {
		await this.invokeWithSig(ownerAccount, "Pause", [""])
	}

	async unpause(ownerAccount: Account): Promise<void> {
		await this.invokeWithSig(ownerAccount, "Unpause", [""])
	}

	async revokeCanSend(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "RevokeCanSend", ["", address])
	}

	async revokeCanReceive(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "RevokeCanReceive", ["", address])
	}

	async revokeMint(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "RevokeMint", ["", address])
	}

	async revokeBurn(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "RevokeBurn", ["", address])
	}

	async blacklist(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "Blacklist", ["", address])
	}

	async unblacklist(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "Unblacklist", ["", address])
	}

	async whitelist(ownerAccount: Account, address: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "Whitelist", ["", address])
	}

	async setWhitelistMode(ownerAccount: Account, enabled: boolean): Promise<void> {
		await this.invokeWithSig(ownerAccount, "SetWhitelistMode", ["", enabled ? "1" : "0"])
	}

	async setUserLimit(ownerAccount: Account, address: string, limit: string): Promise<void> {
		await this.invokeWithSig(ownerAccount, "SetUserLimit", ["", address, limit])
	}
}
