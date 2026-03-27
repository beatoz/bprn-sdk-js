/** @format */

import { Chaincode, ChaincodeExternalSigner, ChaincodeSigner } from "../../bpn-network"
import { Address, Account } from "../../types"
import { CliChaincodeInvoker } from "../../cli"
import { BpnNetwork } from "../../bpn-network"
import type { PreparedSignatureInvocation } from "../../bpn-network"

export interface Erc20ChaincodeInfo {
	chaincodeName: string
	name: string
	symbol: string
	decimal: string
}

export interface Erc20BasicInfo {
	name: string
	symbol: string
	decimals: string
}

export abstract class Erc20CoreChaincode extends Chaincode {
	erc20ChaincodeInfo!: Erc20ChaincodeInfo

	protected createExternalSigner(): ChaincodeExternalSigner {
		return new ChaincodeExternalSigner(this)
	}

	async info() {
		if (!this.erc20ChaincodeInfo) {
			this.erc20ChaincodeInfo = {
				chaincodeName: this.chaincodeName(),
				name: await this.name(),
				symbol: await this.symbol(),
				decimal: "18",
			}
		}
		return this.erc20ChaincodeInfo
	}

	async mint(fromAccount: ChaincodeSigner, toAddress: Address, mintAmount: string) {
		const emptySig = ""
		return await this.invokeWithSig(fromAccount, "Mint", [emptySig, toAddress.toString(), mintAmount])
	}

	prepareMint(toAddress: Address, mintAmount: string): PreparedSignatureInvocation {
		const emptySig = ""
		return this.createExternalSigner().prepareInvocation("Mint", [emptySig, toAddress.toString(), mintAmount])
	}

	async burn(fromAccount: ChaincodeSigner, burnAmount: string) {
		const emptySig = ""
		return await this.invokeWithSig(fromAccount, "Burn", [emptySig, burnAmount])
	}

	prepareBurn(burnAmount: string): PreparedSignatureInvocation {
		const emptySig = ""
		return this.createExternalSigner().prepareInvocation("Burn", [emptySig, burnAmount])
	}

	async transfer(fromAccount: ChaincodeSigner, toAddress: Address, amount: string) {
		const emptySig = ""
		return await this.invokeWithSig(fromAccount, "Transfer", [emptySig, toAddress.toString(), amount])
	}

	prepareTransfer(toAddress: Address, amount: string): PreparedSignatureInvocation {
		const emptySig = ""
		return this.createExternalSigner().prepareInvocation("Transfer", [emptySig, toAddress.toString(), amount])
	}

	async approve(signer: ChaincodeSigner, spender: string, amount: string) {
		const emptySig = ""
		return await this.invokeWithSig(signer, "Approve", [emptySig, spender, amount])
	}

	prepareApprove(spender: string, amount: string): PreparedSignatureInvocation {
		const emptySig = ""
		return this.createExternalSigner().prepareInvocation("Approve", [emptySig, spender, amount])
	}

	async transferFrom(signer: ChaincodeSigner, from: string, to: string, amount: string): Promise<string> {
		const emptySig = ""
		return await this.invokeWithSig(signer, "TransferFrom", [emptySig, from, to, amount])
	}

	prepareTransferFrom(from: string, to: string, amount: string): PreparedSignatureInvocation {
		const emptySig = ""
		return this.createExternalSigner().prepareInvocation("TransferFrom", [emptySig, from, to, amount])
	}

	async executePreparedInvocation(prepared: PreparedSignatureInvocation, sig: string): Promise<any> {
		return await this.createExternalSigner().invokePrepared(prepared, sig)
	}

	async totalSupply(): Promise<string> {
		return await this.query("TotalSupply", [])
	}

	async getAddressNonce(address: string): Promise<number> {
		const addressNoncePayload = await this.query("getAddressNonce", [address])
		return addressNoncePayload.nonce
	}

	async checkOwner(address: string): Promise<string> {
		const ownerAddress = await this.query("CheckOwner", [address])
		return ownerAddress
		//return BigInt(balanceOf.balance).toString()
	}

	async owner(): Promise<string> {
		return await this.query("Owner", [])
	}

	async balanceOf(address: string): Promise<string> {
		//const balanceOfPayload = await this.query("balanceOf", [address.toHexString()])
		return await this.query("BalanceOf", [address])
		//return BigInt(balanceOf.balance).toString()
	}

	async allowance(owner: string, spender: string): Promise<string> {
		const allowancePayload = await this.query("Allowance", [owner, spender])
		return allowancePayload.allowance
	}

	async symbol(): Promise<string> {
		return await this.query("Symbol", [])
	}

	async name(): Promise<string> {
		return await this.query("TokenName", [])
	}

	async decimals(): Promise<string> {
		return await this.query("Decimals", [])
	}

	async basicInfo(): Promise<Erc20BasicInfo> {
		return await this.query("BasicInfo", [])
	}
}
