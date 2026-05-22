/** @format */

import { BpnNetwork, Chaincode } from "../../bpn-network"
import { Account } from "../../types"
import { CliChaincodeInvoker } from "../../cli"
import type { ChaincodeSigner } from "../../bpn-network"

export type RedemptionStatus = "PENDING" | "APPROVED" | "REJECTED"

export interface RedemptionEscrowRequest {
	requestId: string
	requestTxId: string
	stablecoinChaincode: string
	fromAddress: string
	vaultAddress: string
	payoutAddress: string
	amount: string
	clientRequestId?: string
	status: RedemptionStatus | string
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

export class RedemptionEscrowChaincode extends Chaincode {
	static async create(bpnNetwork: BpnNetwork, redemptionEscrowChaincodeName: string): Promise<RedemptionEscrowChaincode> {
		const contract = await bpnNetwork.getContract(redemptionEscrowChaincodeName)
		const channelName = bpnNetwork.getChannelName()
		return new RedemptionEscrowChaincode(bpnNetwork, channelName, contract)
	}

	init(cliInvoker: CliChaincodeInvoker, redemptionWalletAddress: string) {
		return cliInvoker.invoke(this.channelName, this.chaincodeName(), "InitLedger", [redemptionWalletAddress])
	}

	async owner(): Promise<string> {
		const result = await this.query("Owner", [])
		return this.toStringValue(result)
	}

	async grantApprover(signer: ChaincodeSigner, address: string): Promise<void> {
		await this.invokeWithSig(signer, "GrantApprover", ["", address])
	}

	async revokeApprover(signer: ChaincodeSigner, address: string): Promise<void> {
		await this.invokeWithSig(signer, "RevokeApprover", ["", address])
	}

	async approveRedemption(
		signer: ChaincodeSigner,
		requestId: string,
		approvalRef: string = "",
	): Promise<void> {
		await this.invokeWithSig(signer, "ApproveRedemption", ["", requestId, approvalRef])
	}

	async rejectRedemption(
		signer: ChaincodeSigner,
		requestId: string,
		reason: string = "",
	): Promise<void> {
		await this.invokeWithSig(signer, "RejectRedemption", ["", requestId, reason])
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

	async setRedemptionWallet(
		signer: ChaincodeSigner,
		releaseWalletAddress: string,
	): Promise<void> {
		await this.setGlobalWallet(signer, releaseWalletAddress)
	}

	async getRedemptionWallet(): Promise<string> {
		return this.getGlobalWallet()
	}

	async isStablecoinAllowed(stablecoinChaincodeName: string): Promise<boolean> {
		const result = await this.query("IsStablecoinAllowed", [stablecoinChaincodeName])
		const normalized = this.toStringValue(result).toLowerCase()
		return normalized === "true" || normalized === "1"
	}

	async setStablecoinReleaseWallet(
		signer: ChaincodeSigner,
		stablecoinChaincodeName: string,
		releaseWalletAddress: string,
	): Promise<void> {
		await this.setStablecoinWallet(signer, stablecoinChaincodeName, releaseWalletAddress)
	}

	async getStablecoinReleaseWallet(stablecoinChaincodeName: string): Promise<string> {
		return this.getStablecoinWallet(stablecoinChaincodeName)
	}

	async getRedemptionRequest(requestId: string): Promise<RedemptionEscrowRequest> {
		const raw = await this.query("GetRedemptionRequest", [requestId])
		return this.parseRequest(raw)
	}

	async getRedemptionRequestByClientID(userAddress: string, clientRequestID: string): Promise<RedemptionEscrowRequest> {
		const raw = await this.query("GetRedemptionRequestByClientID", [userAddress, clientRequestID])
		return this.parseRequest(raw)
	}

	async listRedemptionRequestsByUser(userAddress: string): Promise<RedemptionEscrowRequest[]> {
		const raw = await this.query("ListRedemptionRequestsByUser", [userAddress])
		return this.parseRequestList(raw)
	}

	async listRedemptionRequestsByStatus(status: string): Promise<RedemptionEscrowRequest[]> {
		const raw = await this.query("ListRedemptionRequestsByStatus", [status])
		return this.parseRequestList(raw)
	}

	// This is normally called by the stablecoin chaincode via cross-chaincode invoke.
	async requestRedemption(
		stablecoinChaincodeName: string,
		fromAddress: string,
		toAddress: string,
		amount: string,
		clientRequestID: string = ""
	): Promise<string> {
		const requestID = await this.invoke("RequestRedemption", [
			stablecoinChaincodeName,
			fromAddress,
			toAddress,
			amount,
			clientRequestID,
		])
		return this.toStringValue(requestID)
	}

	private parseRequestList(raw: unknown): RedemptionEscrowRequest[] {
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

		return parsed.map((item) => this.coerceRequest(item)).filter((item): item is RedemptionEscrowRequest => item !== null)
	}

	private parseRequest(raw: unknown): RedemptionEscrowRequest {
		let parsed: unknown = raw
		if (typeof raw === "string") {
			const trimmed = raw.trim()
			if (!trimmed) {
				throw new Error("Empty redemption request payload")
			}
			parsed = JSON.parse(trimmed)
		}

		const request = this.coerceRequest(parsed)
		if (!request) {
			throw new Error("Failed to parse redemption request payload")
		}
		return request
	}

	private coerceRequest(raw: unknown): RedemptionEscrowRequest | null {
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
			requestTxId: this.toStringValue(row.requestTxId),
			stablecoinChaincode: this.toStringValue(row.stablecoinChaincode),
			fromAddress: this.toStringValue(row.fromAddress),
			vaultAddress: this.toStringValue(row.vaultAddress),
			payoutAddress: this.toStringValue(row.payoutAddress),
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
