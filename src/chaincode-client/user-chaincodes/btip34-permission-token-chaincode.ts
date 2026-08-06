/** @format */

import type { Contract } from "fabric-network"
import { BpnNetwork, Chaincode } from "../../bpn-network"
import type { ChaincodeSigner, PreparedTransaction } from "../../bpn-network"
import { CliChaincodeInvoker } from "../../cli"
import { Account, Address } from "../../types"

export interface Btip34PermissionTokenInfo {
	chaincodeName: string
	name: string
	symbol: string
	decimals: string
	owner: string
	totalSupply: string
}

export interface Btip34PermissionStatus {
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

export interface Btip34ComplianceRoles {
	owner: string
	blacklister: string
	pauser: string
}

export type Btip34PermissionPrefix =
	| "frozen"
	| "blacklist"
	| "whitelist"
	| "blockSend"
	| "blockReceive"
	| "mintRole"
	| "burnRole"

export interface Btip34SignedInvokeResult<TPayload = unknown> {
	transactionId: string
	payload: TPayload
}

export interface Btip34TransferResult extends Btip34SignedInvokeResult<string> {
	txEventRoot: string
}

export class Btip34PermissionTokenChaincode extends Chaincode {
	static async create(
		bpnNetwork: BpnNetwork,
		chaincodeName: string,
	): Promise<Btip34PermissionTokenChaincode> {
		const contract = await bpnNetwork.getContract(chaincodeName)
		const channelName = bpnNetwork.getChannelName()
		return new Btip34PermissionTokenChaincode(
			bpnNetwork,
			channelName,
			contract,
		)
	}

	constructor(
		bpnNetwork: BpnNetwork,
		channelName: string,
		contract: Contract,
	) {
		super(bpnNetwork, channelName, contract)
	}

	init(
		cliInvoker: CliChaincodeInvoker,
		ownerAccount: Account | string,
		name: string,
		symbol: string,
		decimals: string,
		initialSupply: string = "0",
	) {
		const ownerAddress =
			typeof ownerAccount === "string" ? ownerAccount : ownerAccount.address
		return cliInvoker.invoke(
			this.channelName,
			this.chaincodeName(),
			"InitLedger",
			[ownerAddress, name, symbol, decimals, initialSupply],
			true,
		)
	}

	setChaincodeIDWithCli(
		cliInvoker: CliChaincodeInvoker,
		chaincodeID: string = this.chaincodeName(),
	) {
		return cliInvoker.invoke(
			this.channelName,
			this.chaincodeName(),
			"SetChaincodeID",
			[chaincodeID],
		)
	}

	async setRegistryID(chaincodeID: string): Promise<any> {
		return await this.invoke("SetRegistryID", [chaincodeID])
	}

	async setChaincodeID(chaincodeID: string = this.chaincodeName()): Promise<any> {
		return await this.invoke("SetChaincodeID", [chaincodeID])
	}

	async setSelfCcName(chaincodeID: string = this.chaincodeName()): Promise<any> {
		return await this.invoke("SetSelfCcName", [chaincodeID])
	}

	async setLinkerEndpointID(chaincodeID: string): Promise<any> {
		return await this.invoke("SetLinkerEndpointID", [chaincodeID])
	}

	async setLinkerNullifierID(chaincodeID: string): Promise<any> {
		return await this.invoke("SetLinkerNullifierID", [chaincodeID])
	}

	async setExpectedSource(
		srcChainID: string,
		contractAddress: string,
		topic0: string = "",
	): Promise<any> {
		return await this.invoke("SetExpectedSource", [
			srcChainID,
			contractAddress,
			topic0,
		])
	}

	async setExpectedResultHandler(chaincodeID: string): Promise<any> {
		return await this.invoke("SetExpectedResultHandler", [chaincodeID])
	}

	async mint(
		signer: ChaincodeSigner,
		to: string | Address,
		amount: string,
	): Promise<Btip34SignedInvokeResult> {
		return await this.invokeWithSignedResult(signer, "Mint", [
			"",
			this.addressArg(to),
			amount,
		])
	}

	async burn(
		signer: ChaincodeSigner,
		amount: string,
	): Promise<Btip34SignedInvokeResult> {
		return await this.invokeWithSignedResult(signer, "Burn", ["", amount])
	}

	async burnFrom(
		signer: ChaincodeSigner,
		from: string | Address,
		amount: string,
	): Promise<Btip34SignedInvokeResult> {
		return await this.invokeWithSignedResult(signer, "BurnFrom", [
			"",
			this.addressArg(from),
			amount,
		])
	}

	async transfer(
		signer: ChaincodeSigner,
		to: string | Address,
		amount: string,
	): Promise<Btip34SignedInvokeResult> {
		return await this.invokeWithSignedResult(signer, "Transfer", [
			"",
			this.addressArg(to),
			amount,
		])
	}

	async approve(
		signer: ChaincodeSigner,
		spender: string | Address,
		amount: string,
	): Promise<Btip34SignedInvokeResult> {
		return await this.invokeWithSignedResult(signer, "Approve", [
			"",
			this.addressArg(spender),
			amount,
		])
	}

	async transferFrom(
		signer: ChaincodeSigner,
		from: string | Address,
		to: string | Address,
		amount: string,
	): Promise<Btip34SignedInvokeResult> {
		return await this.invokeWithSignedResult(signer, "TransferFrom", [
			"",
			this.addressArg(from),
			this.addressArg(to),
			amount,
		])
	}

	async payToBPuN(
		signer: ChaincodeSigner,
		toDAppAddress: string | Address,
		amount: string,
		beneficiaryAddress: string | Address,
		memoHex: string = "",
	): Promise<Btip34TransferResult> {
		return this.asTransferResult(
			await this.invokeWithSignedResult<string>(signer, "PayToBPuN", [
				"",
				this.addressArg(toDAppAddress),
				amount,
				this.addressArg(beneficiaryAddress),
				memoHex,
			]),
		)
	}

	async postAmount(
		signer: ChaincodeSigner,
		dstChainId: string,
		targetDApp: string | Address,
		dstAccount: string | Address,
		amount: string,
	): Promise<Btip34TransferResult> {
		return this.asTransferResult(
			await this.invokeWithSignedResult<string>(signer, "PostAmount", [
				"",
				dstChainId,
				this.addressArg(targetDApp),
				this.addressArg(dstAccount),
				amount,
			]),
		)
	}

	async cancelLinkerEvent(
		signer: ChaincodeSigner,
		eventAttrsRoot: string,
	): Promise<Btip34SignedInvokeResult> {
		return await this.invokeWithSignedResult(signer, "CancelLinkerEvent", [
			"",
			eventAttrsRoot,
		])
	}

	async getPending(correlationIdHex: string): Promise<any> {
		const raw = await this.query("GetPending", [correlationIdHex])
		const str = typeof raw === "string" ? raw : String(raw)
		return str ? JSON.parse(str) : null
	}

	async getPermissionStatus(
		address: string | Address,
	): Promise<Btip34PermissionStatus> {
		const raw = await this.query("GetPermissionStatus", [
			this.addressArg(address),
		])
		const str = typeof raw === "string" ? raw : String(raw)
		return JSON.parse(str) as Btip34PermissionStatus
	}

	async getAddressesWithPermission(
		permission: Btip34PermissionPrefix | string,
	): Promise<string[]> {
		const raw = await this.query("GetAddressesWithPermission", [permission])
		const str = typeof raw === "string" ? raw : String(raw)
		return JSON.parse(str) as string[]
	}

	async isPaused(): Promise<boolean> {
		const raw = await this.query("IsPaused", [])
		const str = typeof raw === "string" ? raw : String(raw)
		return str === "true" || str === "1"
	}

	async blacklister(): Promise<string> {
		return await this.query("Blacklister", [])
	}

	async pauser(): Promise<string> {
		return await this.query("Pauser", [])
	}

	async getComplianceRoles(): Promise<Btip34ComplianceRoles> {
		const raw = await this.query("GetComplianceRoles", [])
		const str = typeof raw === "string" ? raw : String(raw)
		return JSON.parse(str) as Btip34ComplianceRoles
	}

	async setBlacklister(
		ownerAccount: ChaincodeSigner,
		address: string | Address,
	): Promise<Btip34SignedInvokeResult> {
		return await this.permissionCall(ownerAccount, "SetBlacklister", address)
	}

	async setPauser(
		ownerAccount: ChaincodeSigner,
		address: string | Address,
	): Promise<Btip34SignedInvokeResult> {
		return await this.permissionCall(ownerAccount, "SetPauser", address)
	}

	async grantChaincodeAddressPermissions(
		ownerAccount: ChaincodeSigner,
	): Promise<Btip34SignedInvokeResult> {
		return await this.invokeWithSignedResult(
			ownerAccount,
			"GrantChaincodeAddressPermissions",
			[""],
		)
	}

	async blockSend(
		ownerAccount: ChaincodeSigner,
		address: string | Address,
	): Promise<Btip34SignedInvokeResult> {
		return await this.permissionCall(ownerAccount, "BlockSend", address)
	}

	async unblockSend(
		ownerAccount: ChaincodeSigner,
		address: string | Address,
	): Promise<Btip34SignedInvokeResult> {
		return await this.permissionCall(ownerAccount, "UnblockSend", address)
	}

	async blockReceive(
		ownerAccount: ChaincodeSigner,
		address: string | Address,
	): Promise<Btip34SignedInvokeResult> {
		return await this.permissionCall(ownerAccount, "BlockReceive", address)
	}

	async unblockReceive(
		ownerAccount: ChaincodeSigner,
		address: string | Address,
	): Promise<Btip34SignedInvokeResult> {
		return await this.permissionCall(ownerAccount, "UnblockReceive", address)
	}

	async freeze(
		ownerAccount: ChaincodeSigner,
		address: string | Address,
	): Promise<Btip34SignedInvokeResult> {
		return await this.permissionCall(ownerAccount, "Freeze", address)
	}

	async unfreeze(
		ownerAccount: ChaincodeSigner,
		address: string | Address,
	): Promise<Btip34SignedInvokeResult> {
		return await this.permissionCall(ownerAccount, "Unfreeze", address)
	}

	async grantMint(
		ownerAccount: ChaincodeSigner,
		address: string | Address,
	): Promise<Btip34SignedInvokeResult> {
		return await this.permissionCall(ownerAccount, "GrantMint", address)
	}

	async revokeMint(
		ownerAccount: ChaincodeSigner,
		address: string | Address,
	): Promise<Btip34SignedInvokeResult> {
		return await this.permissionCall(ownerAccount, "RevokeMint", address)
	}

	async grantBurn(
		ownerAccount: ChaincodeSigner,
		address: string | Address,
	): Promise<Btip34SignedInvokeResult> {
		return await this.permissionCall(ownerAccount, "GrantBurn", address)
	}

	async revokeBurn(
		ownerAccount: ChaincodeSigner,
		address: string | Address,
	): Promise<Btip34SignedInvokeResult> {
		return await this.permissionCall(ownerAccount, "RevokeBurn", address)
	}

	async blacklist(
		ownerAccount: ChaincodeSigner,
		address: string | Address,
	): Promise<Btip34SignedInvokeResult> {
		return await this.permissionCall(ownerAccount, "Blacklist", address)
	}

	async unblacklist(
		ownerAccount: ChaincodeSigner,
		address: string | Address,
	): Promise<Btip34SignedInvokeResult> {
		return await this.permissionCall(ownerAccount, "Unblacklist", address)
	}

	async whitelist(
		ownerAccount: ChaincodeSigner,
		address: string | Address,
	): Promise<Btip34SignedInvokeResult> {
		return await this.permissionCall(ownerAccount, "Whitelist", address)
	}

	async unwhitelist(
		ownerAccount: ChaincodeSigner,
		address: string | Address,
	): Promise<Btip34SignedInvokeResult> {
		return await this.permissionCall(ownerAccount, "Unwhitelist", address)
	}

	async pause(ownerAccount: ChaincodeSigner): Promise<Btip34SignedInvokeResult> {
		return await this.invokeWithSignedResult(ownerAccount, "Pause", [""])
	}

	async unpause(ownerAccount: ChaincodeSigner): Promise<Btip34SignedInvokeResult> {
		return await this.invokeWithSignedResult(ownerAccount, "Unpause", [""])
	}

	async setWhitelistMode(
		ownerAccount: ChaincodeSigner,
		enabled: boolean,
	): Promise<Btip34SignedInvokeResult> {
		return await this.invokeWithSignedResult(ownerAccount, "SetWhitelistMode", [
			"",
			enabled ? "true" : "false",
		])
	}

	async setUserLimit(
		ownerAccount: ChaincodeSigner,
		address: string | Address,
		limit: string,
	): Promise<Btip34SignedInvokeResult> {
		return await this.invokeWithSignedResult(ownerAccount, "SetUserLimit", [
			"",
			this.addressArg(address),
			limit,
		])
	}

	async setMinter(account: string | Address, enabled: boolean): Promise<any> {
		return await this.invoke("SetMinter", [
			this.addressArg(account),
			this.boolArg(enabled),
		])
	}

	async setBurner(account: string | Address, enabled: boolean): Promise<any> {
		return await this.invoke("SetBurner", [
			this.addressArg(account),
			this.boolArg(enabled),
		])
	}

	async name(): Promise<string> {
		return await this.query("Name", [])
	}

	async tokenName(): Promise<string> {
		return await this.query("TokenName", [])
	}

	async symbol(): Promise<string> {
		return await this.query("Symbol", [])
	}

	async decimals(): Promise<string> {
		return await this.query("Decimals", [])
	}

	async totalSupply(): Promise<string> {
		return await this.query("TotalSupply", [])
	}

	async owner(): Promise<string> {
		return await this.query("Owner", [])
	}

	async balanceOf(address: string | Address): Promise<string> {
		return await this.query("BalanceOf", [this.addressArg(address)])
	}

	async allowance(
		owner: string | Address,
		spender: string | Address,
	): Promise<string> {
		return await this.query("Allowance", [
			this.addressArg(owner),
			this.addressArg(spender),
		])
	}

	async info(): Promise<Btip34PermissionTokenInfo> {
		return {
			chaincodeName: this.chaincodeName(),
			name: await this.name(),
			symbol: await this.symbol(),
			decimals: await this.decimals(),
			owner: await this.owner(),
			totalSupply: await this.totalSupply(),
		}
	}

	protected async invokeWithSignedResult<TPayload = unknown>(
		signer: ChaincodeSigner,
		functionName: string,
		args: string[],
	): Promise<Btip34SignedInvokeResult<TPayload>> {
		const prepared = this.prepareTxWithSigMsg(functionName, args)
		const sigHex = await this.resolveSignature(signer, prepared)
		return await this.submitPreparedWithSignature<TPayload>(prepared, sigHex)
	}

	private async submitPreparedWithSignature<TPayload>(
		prepared: PreparedTransaction,
		sigHex: string,
	): Promise<Btip34SignedInvokeResult<TPayload>> {
		const normalizedArgs = [...prepared.args]
		normalizedArgs[0] = sigHex
		const result = await this.submitTransaction(
			prepared.transaction,
			prepared.functionName,
			normalizedArgs,
		)
		return {
			transactionId: result.transactionId,
			payload: result.payload as TPayload,
		}
	}

	private async permissionCall(
		ownerAccount: ChaincodeSigner,
		functionName: string,
		address: string | Address,
	): Promise<Btip34SignedInvokeResult> {
		return await this.invokeWithSignedResult(ownerAccount, functionName, [
			"",
			this.addressArg(address),
		])
	}

	private asTransferResult(
		result: Btip34SignedInvokeResult<string>,
	): Btip34TransferResult {
		return {
			...result,
			txEventRoot: this.payloadToString(result.payload),
		}
	}

	private payloadToString(payload: unknown): string {
		if (typeof payload === "string") return payload
		if (payload === null || payload === undefined) return ""
		return String(payload)
	}

	private addressArg(value: string | Address): string {
		return typeof value === "string" ? value : value.toString()
	}

	private boolArg(value: boolean): string {
		return value ? "true" : "false"
	}
}
