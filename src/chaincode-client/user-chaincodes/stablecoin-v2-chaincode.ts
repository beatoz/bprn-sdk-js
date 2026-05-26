/** @format */

import { BpnNetwork, Chaincode, ChaincodeExternalSigner, ChaincodeSigner } from "../../bpn-network"
import type { PreparedSignatureInvocation } from "../../bpn-network"
import { CliChaincodeInvoker } from "../../cli"
import { Account, Address } from "../../types"

export interface StablecoinV2Info {
	chaincodeName: string
	name: string
	symbol: string
	decimals: string
	owner: string
	totalSupply: string
}

export class StablecoinV2Chaincode extends Chaincode {
	static async create(bpnNetwork: BpnNetwork, stablecoinChaincodeName: string): Promise<StablecoinV2Chaincode> {
		const contract = await bpnNetwork.getContract(stablecoinChaincodeName)
		const channelName = bpnNetwork.getChannelName()
		return new StablecoinV2Chaincode(channelName, contract, bpnNetwork.chainType, bpnNetwork.chainId)
	}

	init(cliInvoker: CliChaincodeInvoker, ownerAccount: Account | string, name: string, symbol: string, decimals: string, initialSupply: string = "0") {
		const ownerAddress = typeof ownerAccount === "string" ? ownerAccount : ownerAccount.address
		return cliInvoker.invoke(this.channelName, this.chaincodeName(), "InitLedger", [ownerAddress, name, symbol, decimals, initialSupply], true)
	}

	setChaincodeIDWithCli(cliInvoker: CliChaincodeInvoker, chaincodeID: string = this.chaincodeName()) {
		return cliInvoker.invoke(this.channelName, this.chaincodeName(), "SetChaincodeID", [chaincodeID])
	}

	async setChaincodeID(chaincodeID: string = this.chaincodeName()): Promise<any> {
		return await this.invoke("SetChaincodeID", [chaincodeID])
	}

	async setLinkerEndpointID(chaincodeID: string): Promise<any> {
		return await this.invoke("SetLinkerEndpointID", [chaincodeID])
	}

	async setLinkerNullifierID(chaincodeID: string): Promise<any> {
		return await this.invoke("SetLinkerNullifierID", [chaincodeID])
	}

	async setExpectedSource(srcChainID: string, contractAddress: string, topic0: string = ""): Promise<any> {
		return await this.invoke("SetExpectedSource", [srcChainID, contractAddress, topic0])
	}

	async setMinter(account: string | Address, enabled: boolean): Promise<any> {
		return await this.invoke("SetMinter", [this.addressArg(account), this.boolArg(enabled)])
	}

	async setBurner(account: string | Address, enabled: boolean): Promise<any> {
		return await this.invoke("SetBurner", [this.addressArg(account), this.boolArg(enabled)])
	}

	async mint(signer: ChaincodeSigner, to: string | Address, amount: string): Promise<any> {
		return await this.invokeWithSig(signer, "Mint", ["", this.addressArg(to), amount])
	}

	prepareMint(to: string | Address, amount: string): PreparedSignatureInvocation {
		return this.createExternalSigner().prepareInvocation("Mint", ["", this.addressArg(to), amount])
	}

	async burn(signer: ChaincodeSigner, amount: string): Promise<any> {
		return await this.invokeWithSig(signer, "Burn", ["", amount])
	}

	prepareBurn(amount: string): PreparedSignatureInvocation {
		return this.createExternalSigner().prepareInvocation("Burn", ["", amount])
	}

	async burnFrom(signer: ChaincodeSigner, from: string | Address, amount: string): Promise<any> {
		return await this.invokeWithSig(signer, "BurnFrom", ["", this.addressArg(from), amount])
	}

	prepareBurnFrom(from: string | Address, amount: string): PreparedSignatureInvocation {
		return this.createExternalSigner().prepareInvocation("BurnFrom", ["", this.addressArg(from), amount])
	}

	async transfer(signer: ChaincodeSigner, to: string | Address, amount: string): Promise<any> {
		return await this.invokeWithSig(signer, "Transfer", ["", this.addressArg(to), amount])
	}

	prepareTransfer(to: string | Address, amount: string): PreparedSignatureInvocation {
		return this.createExternalSigner().prepareInvocation("Transfer", ["", this.addressArg(to), amount])
	}

	async approve(signer: ChaincodeSigner, spender: string | Address, amount: string): Promise<any> {
		return await this.invokeWithSig(signer, "Approve", ["", this.addressArg(spender), amount])
	}

	prepareApprove(spender: string | Address, amount: string): PreparedSignatureInvocation {
		return this.createExternalSigner().prepareInvocation("Approve", ["", this.addressArg(spender), amount])
	}

	async transferFrom(signer: ChaincodeSigner, from: string | Address, to: string | Address, amount: string): Promise<any> {
		return await this.invokeWithSig(signer, "TransferFrom", ["", this.addressArg(from), this.addressArg(to), amount])
	}

	prepareTransferFrom(from: string | Address, to: string | Address, amount: string): PreparedSignatureInvocation {
		return this.createExternalSigner().prepareInvocation("TransferFrom", ["", this.addressArg(from), this.addressArg(to), amount])
	}

	async executePreparedInvocation(prepared: PreparedSignatureInvocation, signature: string): Promise<any> {
		return await this.createExternalSigner().invokePrepared(prepared, signature)
	}

	async name(): Promise<string> {
		return await this.query("Name", [])
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

	async allowance(owner: string | Address, spender: string | Address): Promise<string> {
		return await this.query("Allowance", [this.addressArg(owner), this.addressArg(spender)])
	}

	async info(): Promise<StablecoinV2Info> {
		return {
			chaincodeName: this.chaincodeName(),
			name: await this.name(),
			symbol: await this.symbol(),
			decimals: await this.decimals(),
			owner: await this.owner(),
			totalSupply: await this.totalSupply(),
		}
	}

	private createExternalSigner(): ChaincodeExternalSigner {
		return new ChaincodeExternalSigner(this)
	}

	private addressArg(value: string | Address): string {
		return typeof value === "string" ? value : value.toString()
	}

	private boolArg(value: boolean): string {
		return value ? "true" : "false"
	}
}
