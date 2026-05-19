/** @format */

import { BpnNetwork, Chaincode, ChaincodeSigner, hashPreparedSignatureInvocation, signChaincodeRequest } from "../../bpn-network"
import type { PreparedSignatureInvocation } from "../../bpn-network"
import { CliChaincodeInvoker } from "../../cli"

export type RefundPaymentStatus = "ESCROWED" | "PARTIALLY_REFUNDED" | "RELEASED" | "REFUNDED"

export interface RefundEscrowConfig {
	feeRecipientAddress: string
	defaultMerchantFeeBps: number
	defaultCancelFeeBps: number
	defaultMinimumPeriodSeconds: number
	paused: boolean
	updatedAt: number
}

export interface RefundMerchant {
	merchantId: string
	merchantKey: string
	merchantAddress: string
	merchantName?: string
	active: boolean
	createdAt: number
	updatedAt: number
}

export interface RefundPayment {
	paymentId: string
	paymentTxId: string
	stablecoinChaincode: string
	payerAddress: string
	merchantId: string
	merchantKey: string
	merchantAddress: string
	cancelToAddress: string
	grossAmount: string
	canceledAmount: string
	releasedGrossAmount: string
	releasedNetAmount: string
	totalMerchantFeeAmount: string
	totalCancelFeeAmount: string
	merchantFeeBps: number
	cancelFeeBps: number
	minimumPeriodEnd: number
	status: RefundPaymentStatus | string
	clientPaymentId?: string
	createdAt: number
	updatedAt: number
}

export interface RefundPaymentPreview {
	paymentId: string
	remainingGross: string
	merchantFeePreview: string
	merchantNetPreview: string
	cancelable: boolean
	releasable: boolean
}

export interface RefundEscrowPreparedInvocation extends PreparedSignatureInvocation {
	submitArgs: string[]
	signingArgs: string[]
}

export class RefundEscrowChaincode extends Chaincode {
	static async create(bpnNetwork: BpnNetwork, refundEscrowChaincodeName: string): Promise<RefundEscrowChaincode> {
		const contract = await bpnNetwork.getContract(refundEscrowChaincodeName)
		const channelName = bpnNetwork.getChannelName()
		return new RefundEscrowChaincode(channelName, contract, bpnNetwork.chainType, bpnNetwork.chainId)
	}

	init(
		cliInvoker: CliChaincodeInvoker,
		escrowWalletAddress: string,
		feeRecipientAddress: string,
		merchantFeeBps: string,
		cancelFeeBps: string,
		minimumPeriodSeconds: string
	) {
		return cliInvoker.invoke(this.channelName, this.chaincodeName(), "InitLedger", [
			escrowWalletAddress,
			feeRecipientAddress,
			merchantFeeBps,
			cancelFeeBps,
			minimumPeriodSeconds,
		])
	}

	async owner(): Promise<string> {
		const result = await this.query("Owner", [])
		return this.toStringValue(result)
	}

	async getRefundConfig(): Promise<RefundEscrowConfig> {
		const raw = await this.query("GetRefundConfig", [])
		return this.parseConfig(raw)
	}

	async setRefundConfig(
		signer: ChaincodeSigner,
		feeRecipientAddress: string,
		merchantFeeBps: string,
		cancelFeeBps: string,
		minimumPeriodSeconds: string
	): Promise<void> {
		await this.invokeWithSig(signer, "SetRefundConfig", ["", feeRecipientAddress, merchantFeeBps, cancelFeeBps, minimumPeriodSeconds])
	}

	async pauseRefundEscrow(signer: ChaincodeSigner): Promise<void> {
		await this.invokeWithSig(signer, "PauseRefundEscrow", [""])
	}

	async unpauseRefundEscrow(signer: ChaincodeSigner): Promise<void> {
		await this.invokeWithSig(signer, "UnpauseRefundEscrow", [""])
	}

	async allowStablecoin(signer: ChaincodeSigner, stablecoinChaincodeName: string): Promise<void> {
		await this.invokeWithSig(signer, "AllowStablecoin", ["", stablecoinChaincodeName])
	}

	async revokeStablecoin(signer: ChaincodeSigner, stablecoinChaincodeName: string): Promise<void> {
		await this.invokeWithSig(signer, "RevokeStablecoin", ["", stablecoinChaincodeName])
	}

	async isStablecoinAllowed(stablecoinChaincodeName: string): Promise<boolean> {
		const result = await this.query("IsStablecoinAllowed", [stablecoinChaincodeName])
		return this.toBooleanValue(result)
	}

	async setGlobalWallet(signer: ChaincodeSigner, walletAddress: string): Promise<void> {
		await this.invokeWithSig(signer, "SetGlobalWallet", ["", walletAddress])
	}

	async getGlobalWallet(): Promise<string> {
		const result = await this.query("GetGlobalWallet", [])
		return this.toStringValue(result)
	}

	async setStablecoinWallet(signer: ChaincodeSigner, stablecoinChaincodeName: string, walletAddress: string): Promise<void> {
		await this.invokeWithSig(signer, "SetStablecoinWallet", ["", stablecoinChaincodeName, walletAddress])
	}

	async getStablecoinWallet(stablecoinChaincodeName: string): Promise<string> {
		const result = await this.query("GetStablecoinWallet", [stablecoinChaincodeName])
		return this.toStringValue(result)
	}

	async registerMerchant(signer: ChaincodeSigner, merchantId: string, merchantAddress: string, merchantName: string = ""): Promise<void> {
		await this.invokeWithSig(signer, "RegisterMerchant", ["", merchantId, merchantAddress, merchantName])
	}

	async getRefundMerchant(merchantId: string): Promise<RefundMerchant> {
		const raw = await this.query("GetRefundMerchant", [merchantId])
		return this.parseMerchant(raw)
	}

	async pay(
		signer: ChaincodeSigner,
		stablecoinChaincodeName: string,
		merchantId: string,
		grossAmount: string,
		cancelToAddress: string = "",
		clientPaymentId: string = ""
	): Promise<string> {
		const response = await this.invokeWithSig(signer, "Pay", ["", stablecoinChaincodeName, merchantId, grossAmount, cancelToAddress, clientPaymentId])
		return this.toStringValue(response.payload)
	}

	preparePay(
		stablecoinChaincodeName: string,
		merchantId: string,
		grossAmount: string,
		cancelToAddress: string = "",
		clientPaymentId: string = ""
	): RefundEscrowPreparedInvocation {
		const args = ["", stablecoinChaincodeName, merchantId, grossAmount, cancelToAddress, clientPaymentId]
		return this.prepareRefundInvocation("Pay", args, args)
	}

	async cancel(signer: ChaincodeSigner, paymentId: string, grossCancelAmount: string): Promise<void> {
		await this.invokeWithSig(signer, "Cancel", ["", paymentId, grossCancelAmount])
	}

	prepareCancel(paymentId: string, grossCancelAmount: string): RefundEscrowPreparedInvocation {
		const args = ["", paymentId, grossCancelAmount]
		return this.prepareRefundInvocation("Cancel", args, args)
	}

	async cancelWithAuthorization(
		signer: ChaincodeSigner,
		paymentId: string,
		grossCancelAmount: string,
		nonce: string,
		deadline: string
	): Promise<void> {
		await this.invokeWithSignatureArgs(
			signer,
			"CancelWithAuthorization",
			["", paymentId, grossCancelAmount, nonce, deadline],
			["", paymentId, grossCancelAmount, deadline]
		)
	}

	prepareCancelWithAuthorization(paymentId: string, grossCancelAmount: string, nonce: string, deadline: string): RefundEscrowPreparedInvocation {
		return this.prepareRefundInvocation(
			"CancelWithAuthorization",
			["", paymentId, grossCancelAmount, nonce, deadline],
			["", paymentId, grossCancelAmount, deadline]
		)
	}

	async withdrawAvailable(signer: ChaincodeSigner, stablecoinChaincodeName: string, merchantId: string): Promise<void> {
		await this.invokeWithSig(signer, "WithdrawAvailable", ["", stablecoinChaincodeName, merchantId])
	}

	prepareWithdrawAvailable(stablecoinChaincodeName: string, merchantId: string): RefundEscrowPreparedInvocation {
		const args = ["", stablecoinChaincodeName, merchantId]
		return this.prepareRefundInvocation("WithdrawAvailable", args, args)
	}

	async withdrawAvailableWithAuthorization(
		signer: ChaincodeSigner,
		stablecoinChaincodeName: string,
		merchantId: string,
		amount: string,
		nonce: string,
		deadline: string
	): Promise<void> {
		await this.invokeWithSignatureArgs(
			signer,
			"WithdrawAvailableWithAuthorization",
			["", stablecoinChaincodeName, merchantId, amount, nonce, deadline],
			["", stablecoinChaincodeName, merchantId, amount, deadline]
		)
	}

	prepareWithdrawAvailableWithAuthorization(
		stablecoinChaincodeName: string,
		merchantId: string,
		amount: string,
		nonce: string,
		deadline: string
	): RefundEscrowPreparedInvocation {
		return this.prepareRefundInvocation(
			"WithdrawAvailableWithAuthorization",
			["", stablecoinChaincodeName, merchantId, amount, nonce, deadline],
			["", stablecoinChaincodeName, merchantId, amount, deadline]
		)
	}

	async withdrawProtocolFees(signer: ChaincodeSigner, stablecoinChaincodeName: string, amount: string): Promise<void> {
		await this.invokeWithSig(signer, "WithdrawProtocolFees", ["", stablecoinChaincodeName, amount])
	}

	async syncMerchantWithdrawable(stablecoinChaincodeName: string, merchantId: string): Promise<void> {
		await this.invoke("SyncMerchantWithdrawable", [stablecoinChaincodeName, merchantId])
	}

	async getRefundPayment(paymentId: string): Promise<RefundPayment> {
		const raw = await this.query("GetRefundPayment", [paymentId])
		return this.parsePayment(raw)
	}

	async listRefundPaymentsByBuyer(buyerAddress: string): Promise<RefundPayment[]> {
		const raw = await this.query("ListRefundPaymentsByBuyer", [buyerAddress])
		return this.parsePaymentList(raw)
	}

	async listRefundPaymentsByMerchant(merchantId: string): Promise<RefundPayment[]> {
		const raw = await this.query("ListRefundPaymentsByMerchant", [merchantId])
		return this.parsePaymentList(raw)
	}

	async listActiveRefundPaymentIdsByBuyer(buyerAddress: string): Promise<string[]> {
		const raw = await this.query("ListActiveRefundPaymentIDsByBuyer", [buyerAddress])
		return this.parseStringList(raw)
	}

	async listActiveRefundPaymentIdsByMerchant(merchantId: string): Promise<string[]> {
		const raw = await this.query("ListActiveRefundPaymentIDsByMerchant", [merchantId])
		return this.parseStringList(raw)
	}

	async getRefundPaymentPreview(paymentId: string): Promise<RefundPaymentPreview> {
		const raw = await this.query("GetRefundPaymentPreview", [paymentId])
		return this.parsePaymentPreview(raw)
	}

	async getMerchantWithdrawableAmount(stablecoinChaincodeName: string, merchantId: string): Promise<string> {
		const raw = await this.query("GetMerchantWithdrawableAmount", [stablecoinChaincodeName, merchantId])
		return this.toStringValue(raw)
	}

	async getMerchantLockedAmount(stablecoinChaincodeName: string, merchantId: string): Promise<string> {
		const raw = await this.query("GetMerchantLockedAmount", [stablecoinChaincodeName, merchantId])
		return this.toStringValue(raw)
	}

	async getProtocolFeeBalance(stablecoinChaincodeName: string): Promise<string> {
		const raw = await this.query("GetProtocolFeeBalance", [stablecoinChaincodeName])
		return this.toStringValue(raw)
	}

	async cancelNonce(payerAddress: string): Promise<string> {
		const raw = await this.query("CancelNonce", [payerAddress])
		return this.toStringValue(raw)
	}

	async withdrawNonce(merchantAddress: string): Promise<string> {
		const raw = await this.query("WithdrawNonce", [merchantAddress])
		return this.toStringValue(raw)
	}

	async executePreparedInvocation(prepared: RefundEscrowPreparedInvocation, signature: string): Promise<any> {
		const args = [...prepared.submitArgs]
		args[0] = signature
		const response = await this.submitTransaction(prepared.transaction, prepared.functionName, args)
		return response.payload
	}

	private async invokeWithSignatureArgs(signer: ChaincodeSigner, functionName: string, signingArgs: string[], submitArgs: string[]): Promise<any> {
		const transaction = this.contract.createTransaction(functionName)
		const request = this.createSignatureRequest(transaction.getTransactionId(), functionName, signingArgs)
		const sig = await signChaincodeRequest(signer, request)
		const args = [...submitArgs]
		args[0] = sig
		return await this.submitTransaction(transaction, functionName, args)
	}

	private prepareRefundInvocation(functionName: string, signingArgs: string[], submitArgs: string[]): RefundEscrowPreparedInvocation {
		const transaction = this.contract.createTransaction(functionName)
		const transactionId = transaction.getTransactionId()
		const sigMsg = this.createSignatureMessage(transactionId, functionName, signingArgs)
		return {
			transaction,
			transactionId,
			functionName,
			args: [...signingArgs],
			signingArgs: [...signingArgs],
			submitArgs: [...submitArgs],
			sigMsg,
			chaincodeName: this.chaincodeName(),
			messageHash: hashPreparedSignatureInvocation({ sigMsg }),
		}
	}

	private parseConfig(raw: unknown): RefundEscrowConfig {
		const row = this.parseObject(raw, "refund config")
		return {
			feeRecipientAddress: this.toStringValue(row.feeRecipientAddress),
			defaultMerchantFeeBps: this.toNumberValue(row.defaultMerchantFeeBps),
			defaultCancelFeeBps: this.toNumberValue(row.defaultCancelFeeBps),
			defaultMinimumPeriodSeconds: this.toNumberValue(row.defaultMinimumPeriodSeconds),
			paused: this.toBooleanValue(row.paused),
			updatedAt: this.toNumberValue(row.updatedAt),
		}
	}

	private parseMerchant(raw: unknown): RefundMerchant {
		const row = this.parseObject(raw, "refund merchant")
		return {
			merchantId: this.toStringValue(row.merchantId),
			merchantKey: this.toStringValue(row.merchantKey),
			merchantAddress: this.toStringValue(row.merchantAddress),
			merchantName: this.toOptionalStringValue(row.merchantName),
			active: this.toBooleanValue(row.active),
			createdAt: this.toNumberValue(row.createdAt),
			updatedAt: this.toNumberValue(row.updatedAt),
		}
	}

	private parsePaymentList(raw: unknown): RefundPayment[] {
		const rows = this.parseArray(raw)
		return rows.map((row) => this.parsePayment(row))
	}

	private parsePayment(raw: unknown): RefundPayment {
		const row = this.parseObject(raw, "refund payment")
		return {
			paymentId: this.toStringValue(row.paymentId),
			paymentTxId: this.toStringValue(row.paymentTxId),
			stablecoinChaincode: this.toStringValue(row.stablecoinChaincode),
			payerAddress: this.toStringValue(row.payerAddress),
			merchantId: this.toStringValue(row.merchantId),
			merchantKey: this.toStringValue(row.merchantKey),
			merchantAddress: this.toStringValue(row.merchantAddress),
			cancelToAddress: this.toStringValue(row.cancelToAddress),
			grossAmount: this.toStringValue(row.grossAmount),
			canceledAmount: this.toStringValue(row.canceledAmount),
			releasedGrossAmount: this.toStringValue(row.releasedGrossAmount),
			releasedNetAmount: this.toStringValue(row.releasedNetAmount),
			totalMerchantFeeAmount: this.toStringValue(row.totalMerchantFeeAmount),
			totalCancelFeeAmount: this.toStringValue(row.totalCancelFeeAmount),
			merchantFeeBps: this.toNumberValue(row.merchantFeeBps),
			cancelFeeBps: this.toNumberValue(row.cancelFeeBps),
			minimumPeriodEnd: this.toNumberValue(row.minimumPeriodEnd),
			status: this.toStringValue(row.status).toUpperCase(),
			clientPaymentId: this.toOptionalStringValue(row.clientPaymentId),
			createdAt: this.toNumberValue(row.createdAt),
			updatedAt: this.toNumberValue(row.updatedAt),
		}
	}

	private parsePaymentPreview(raw: unknown): RefundPaymentPreview {
		const row = this.parseObject(raw, "refund payment preview")
		return {
			paymentId: this.toStringValue(row.paymentId),
			remainingGross: this.toStringValue(row.remainingGross),
			merchantFeePreview: this.toStringValue(row.merchantFeePreview),
			merchantNetPreview: this.toStringValue(row.merchantNetPreview),
			cancelable: this.toBooleanValue(row.cancelable),
			releasable: this.toBooleanValue(row.releasable),
		}
	}

	private parseStringList(raw: unknown): string[] {
		return this.parseArray(raw)
			.map((value) => this.toStringValue(value))
			.filter((value) => value !== "")
	}

	private parseArray(raw: unknown): unknown[] {
		let parsed: unknown = raw
		if (typeof raw === "string") {
			const trimmed = raw.trim()
			if (!trimmed) {
				return []
			}
			parsed = JSON.parse(trimmed)
		}
		return Array.isArray(parsed) ? parsed : []
	}

	private parseObject(raw: unknown, label: string): Record<string, unknown> {
		let parsed: unknown = raw
		if (typeof raw === "string") {
			const trimmed = raw.trim()
			if (!trimmed) {
				throw new Error(`Empty ${label} payload`)
			}
			parsed = JSON.parse(trimmed)
		}
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			throw new Error(`Failed to parse ${label} payload`)
		}
		return parsed as Record<string, unknown>
	}

	private toStringValue(value: unknown): string {
		if (value == null) {
			return ""
		}
		const normalized = String(value).trim()
		if (normalized.length >= 2 && normalized.startsWith('"') && normalized.endsWith('"')) {
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

	private toBooleanValue(value: unknown): boolean {
		if (typeof value === "boolean") {
			return value
		}
		const normalized = this.toStringValue(value).toLowerCase()
		return normalized === "true" || normalized === "1"
	}
}
