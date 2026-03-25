/** @format */

import { createHash } from "crypto"
import { Contract, Transaction } from "fabric-network"

export interface PreparedSignatureInvocation {
	transaction: Transaction
	transactionId: string
	functionName: string
	args: string[]
	sigMsg: Uint8Array
	chaincodeName: string
	messageHash?: string
}

export interface ChaincodeExternalSignerContext {
	readonly contract: Contract
	chaincodeName(): string
	createSignatureMessage(
		txid: string,
		functionName: string,
		args?: string[],
	): Uint8Array
	submitTransaction(
		transaction: Transaction,
		functionName: string,
		args: string[],
	): Promise<{ transactionId: string; payload: any }>
	queryTransaction(
		transaction: Transaction,
		functionName: string,
		args?: string[],
	): Promise<any>
}

export class ChaincodeExternalSigner {
	constructor(private readonly context: ChaincodeExternalSignerContext) {}

	prepareInvocation(
		functionName: string,
		args: string[] = [],
	): PreparedSignatureInvocation {
		const transaction = this.context.contract.createTransaction(functionName)
		const transactionId = transaction.getTransactionId()
		const normalizedArgs = [...args]
		const sigMsg = this.context.createSignatureMessage(
			transactionId,
			functionName,
			normalizedArgs,
		)
		return {
			transaction,
			transactionId,
			functionName,
			args: normalizedArgs,
			sigMsg,
			chaincodeName: this.context.chaincodeName(),
			messageHash: hashPreparedSignatureInvocation({ sigMsg }),
		}
	}

	async invokePrepared(
		prepared: PreparedSignatureInvocation,
		signature: string,
	): Promise<any> {
		const args = [...prepared.args]
		args[0] = signature
		const response = await this.context.submitTransaction(
			prepared.transaction,
			prepared.functionName,
			args,
		)
		return response.payload
	}

	async queryPrepared(
		prepared: PreparedSignatureInvocation,
		signature: string,
	): Promise<any> {
		const args = [...prepared.args]
		args[0] = signature
		const response = await this.context.queryTransaction(
			prepared.transaction,
			prepared.functionName,
			args,
		)
		return response.toString()
	}
}

export function hashPreparedSignatureInvocation(
	prepared: Pick<PreparedSignatureInvocation, "sigMsg">,
): string {
	return createHash("sha256").update(prepared.sigMsg).digest("hex")
}

export function normalizePreparedInvocationSignature(signature: string): string {
	const hex = signature.startsWith("0x") ? signature.slice(2) : signature
	if (hex.length !== 130) {
		return hex
	}

	const recoveryIdHex = hex.slice(128, 130).toLowerCase()
	if (recoveryIdHex === "1b" || recoveryIdHex === "1c") {
		const normalizedRecoveryId = (parseInt(recoveryIdHex, 16) - 27)
			.toString(16)
			.padStart(2, "0")
		return `${hex.slice(0, 128)}${normalizedRecoveryId}`
	}

	return hex
}
