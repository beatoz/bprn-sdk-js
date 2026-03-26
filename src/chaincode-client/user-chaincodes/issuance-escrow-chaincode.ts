/** @format */

import { BpnNetwork, Chaincode } from "../../bpn-network"
import { Account } from "../../types"
import { CliChaincodeInvoker } from "../../cli"
import type { ChaincodeSigner } from "../../bpn-network"

export type IssuanceStatus = "PENDING" | "APPROVED" | "REJECTED"

export interface IssuanceEscrowRequest {
	requestId: string
	stablecoinChaincode: string
	payerAddress: string
	vaultAddress: string
	recipientAddress: string
	amount: string
	clientRequestId?: string
	status: IssuanceStatus | string
	requestedAt: number
	updatedAt: number
	approvedAt?: number
	approvedBy?: string
	approvalTxId?: string
	approvalRef?: string
	rejectedAt?: number
	rejectedBy?: string
	rejectTxId?: string
	rejectReason?: string
}

export interface IssuanceExecutionReadiness {
	stablecoinChaincode: string
	allowed: boolean
	vaultWalletAddress: string
	escrowAddress: string
	fundedAmount: string
	reservedAmount: string
	availableAmount: string
}

export class IssuanceEscrowChaincode extends Chaincode {
	static async create(bpnNetwork: BpnNetwork, issuanceEscrowChaincodeName: string): Promise<IssuanceEscrowChaincode> {
		const contract = await bpnNetwork.getContract(issuanceEscrowChaincodeName)
		const channelName = bpnNetwork.getChannelName()
		return new IssuanceEscrowChaincode(channelName, contract, bpnNetwork.chainType, bpnNetwork.chainId)
	}

	init(cliInvoker: CliChaincodeInvoker, vaultWalletAddress: string) {
		return cliInvoker.invoke(this.channelName, this.chaincodeName(), "InitLedger", [vaultWalletAddress])
	}

	async owner(): Promise<string> {
		const result = await this.query("Owner", [])
		return this.toStringValue(result)
	}

	async getIssuanceExecutionReadiness(stablecoinChaincodeName: string): Promise<IssuanceExecutionReadiness> {
		const raw = await this.query("GetIssuanceExecutionReadiness", [stablecoinChaincodeName])
		return this.parseReadiness(raw)
	}

	async grantApprover(signer: ChaincodeSigner, address: string): Promise<void> {
		await this.invokeWithSig(signer, "GrantApprover", ["", address])
	}

	async revokeApprover(signer: ChaincodeSigner, address: string): Promise<void> {
		await this.invokeWithSig(signer, "RevokeApprover", ["", address])
	}

	async allowStablecoin(
		signer: ChaincodeSigner,
		stablecoinChaincodeName: string,
	): Promise<void> {
		await this.invokeWithSig(signer, "AllowStablecoin", ["", stablecoinChaincodeName])
	}

	async revokeStablecoin(
		signer: ChaincodeSigner,
		stablecoinChaincodeName: string,
	): Promise<void> {
		await this.invokeWithSig(signer, "RevokeStablecoin", ["", stablecoinChaincodeName])
	}

	async setGlobalWallet(
		signer: ChaincodeSigner,
		walletAddress: string,
	): Promise<void> {
		await this.invokeWithSig(signer, "SetGlobalWallet", ["", walletAddress])
	}

	async getGlobalWallet(): Promise<string> {
		const result = await this.query("GetGlobalWallet", [])
		return this.toStringValue(result)
	}

	async isStablecoinAllowed(stablecoinChaincodeName: string): Promise<boolean> {
		const result = await this.query("IsStablecoinAllowed", [stablecoinChaincodeName])
		const normalized = this.toStringValue(result).toLowerCase()
		return normalized === "true" || normalized === "1"
	}

	async setStablecoinWallet(
		signer: ChaincodeSigner,
		stablecoinChaincodeName: string,
		walletAddress: string,
	): Promise<void> {
		await this.invokeWithSig(signer, "SetStablecoinWallet", ["", stablecoinChaincodeName, walletAddress])
	}

	async getStablecoinWallet(stablecoinChaincodeName: string): Promise<string> {
		const result = await this.query("GetStablecoinWallet", [stablecoinChaincodeName])
		return this.toStringValue(result)
	}

	async fundIssuanceVault(
		signer: ChaincodeSigner,
		stablecoinChaincodeName: string,
		amount: string,
	): Promise<void> {
		await this.invokeWithSig(signer, "FundIssuanceVault", ["", stablecoinChaincodeName, amount])
	}

	async getIssuanceRequest(requestId: string): Promise<IssuanceEscrowRequest> {
		const raw = await this.query("GetIssuanceRequest", [requestId])
		return this.parseRequest(raw)
	}

	async getIssuanceRequestByClientID(userAddress: string, clientRequestID: string): Promise<IssuanceEscrowRequest> {
		const raw = await this.query("GetIssuanceRequestByClientID", [userAddress, clientRequestID])
		return this.parseRequest(raw)
	}

	async listIssuanceRequestsByUser(userAddress: string): Promise<IssuanceEscrowRequest[]> {
		const raw = await this.query("ListIssuanceRequestsByUser", [userAddress])
		return this.parseRequestList(raw)
	}

	async listIssuanceRequestsByStatus(status: string): Promise<IssuanceEscrowRequest[]> {
		const raw = await this.query("ListIssuanceRequestsByStatus", [status])
		return this.parseRequestList(raw)
	}

	// This is normally called by the stablecoin chaincode via cross-chaincode invoke.
	async requestIssuance(
		stablecoinChaincodeName: string,
		payerAddress: string,
		recipientAddress: string,
		amount: string,
		clientRequestID: string = ""
	): Promise<string> {
		const requestID = await this.invoke("RequestIssuance", [
			stablecoinChaincodeName,
			payerAddress,
			recipientAddress,
			amount,
			clientRequestID,
		])
		return this.toStringValue(requestID)
	}

	async approveIssuance(
		signer: ChaincodeSigner,
		requestId: string,
		approvalRef: string = "",
	): Promise<void> {
		await this.invokeWithSig(signer, "ApproveIssuance", ["", requestId, approvalRef])
	}

	async rejectIssuance(
		signer: ChaincodeSigner,
		requestId: string,
		reason: string = "",
	): Promise<void> {
		await this.invokeWithSig(signer, "RejectIssuance", ["", requestId, reason])
	}

	private parseReadiness(raw: unknown): IssuanceExecutionReadiness {
		let parsed: unknown = raw
		if (typeof raw === "string") {
			const trimmed = raw.trim()
			if (!trimmed) {
				throw new Error("Empty issuance readiness payload")
			}
			parsed = JSON.parse(trimmed)
		}

		if (!parsed || typeof parsed !== "object") {
			throw new Error("Failed to parse issuance readiness payload")
		}

		const row = parsed as Record<string, unknown>
		return {
			stablecoinChaincode: this.toStringValue(row.stablecoinChaincode),
			allowed: this.toBooleanValue(row.allowed),
			vaultWalletAddress: this.toStringValue(row.vaultWalletAddress),
			escrowAddress: this.toStringValue(row.escrowAddress),
			fundedAmount: this.toStringValue(row.fundedAmount),
			reservedAmount: this.toStringValue(row.reservedAmount),
			availableAmount: this.toStringValue(row.availableAmount),
		}
	}

	private parseRequestList(raw: unknown): IssuanceEscrowRequest[] {
		let parsed: unknown = raw
		if (typeof raw === "string") {
			const trimmed = raw.trim()
			if (!trimmed) {
				return []
			}
			parsed = JSON.parse(trimmed)
		}

		if (!Array.isArray(parsed)) {
			return []
		}

		return parsed.map((item) => this.coerceRequest(item)).filter((item): item is IssuanceEscrowRequest => item !== null)
	}

	private parseRequest(raw: unknown): IssuanceEscrowRequest {
		let parsed: unknown = raw
		if (typeof raw === "string") {
			const trimmed = raw.trim()
			if (!trimmed) {
				throw new Error("Empty issuance request payload")
			}
			parsed = JSON.parse(trimmed)
		}

		const request = this.coerceRequest(parsed)
		if (!request) {
			throw new Error("Failed to parse issuance request payload")
		}
		return request
	}

	private coerceRequest(raw: unknown): IssuanceEscrowRequest | null {
		if (!raw || typeof raw !== "object") {
			return null
		}

		const row = raw as Record<string, unknown>
		const requestId = this.toStringValue(row.requestId)
		if (!requestId) {
			return null
		}

		return {
			requestId,
			stablecoinChaincode: this.toStringValue(row.stablecoinChaincode),
			payerAddress: this.toStringValue(row.payerAddress),
			vaultAddress: this.toStringValue(row.vaultAddress),
			recipientAddress: this.toStringValue(row.recipientAddress),
			amount: this.toStringValue(row.amount),
			clientRequestId: this.toOptionalStringValue(row.clientRequestId),
			status: this.toStringValue(row.status).toUpperCase(),
			requestedAt: this.toNumberValue(row.requestedAt),
			updatedAt: this.toNumberValue(row.updatedAt),
			approvedAt: this.toOptionalNumberValue(row.approvedAt),
			approvedBy: this.toOptionalStringValue(row.approvedBy),
			approvalTxId: this.toOptionalStringValue(row.approvalTxId),
			approvalRef: this.toOptionalStringValue(row.approvalRef),
			rejectedAt: this.toOptionalNumberValue(row.rejectedAt),
			rejectedBy: this.toOptionalStringValue(row.rejectedBy),
			rejectTxId: this.toOptionalStringValue(row.rejectTxId),
			rejectReason: this.toOptionalStringValue(row.rejectReason),
		}
	}

	private toStringValue(value: unknown): string {
		if (value == null) {
			return ""
		}
		const normalized = String(value).trim()
		if (normalized.length >= 2 && normalized.startsWith("\"") && normalized.endsWith("\"")) {
			return normalized.slice(1, -1).trim()
		}
		return normalized
	}

	private toOptionalStringValue(value: unknown): string | undefined {
		const normalized = this.toStringValue(value)
		return normalized ? normalized : undefined
	}

	private toBooleanValue(value: unknown): boolean {
		if (typeof value === "boolean") {
			return value
		}
		const normalized = this.toStringValue(value).toLowerCase()
		return normalized === "true" || normalized === "1"
	}

	private toNumberValue(value: unknown): number {
		if (typeof value === "number" && Number.isFinite(value)) {
			return value
		}
		const normalized = Number(this.toStringValue(value))
		return Number.isFinite(normalized) ? normalized : 0
	}

	private toOptionalNumberValue(value: unknown): number | undefined {
		const normalized = this.toNumberValue(value)
		return normalized > 0 ? normalized : undefined
	}
}
