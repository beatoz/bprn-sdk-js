/** @format */

import { Chaincode } from "../../bpn-network"
import { Erc20ArgsGenerator } from "../generator/erc20-args-generator"
import { Address } from "../../types/address"
import { Account } from "../../types/account"
import { CliChaincodeInvoker } from "../../cli"
import { bigIntParamToHex } from "../../utils"

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

export class Erc20Chaincode {
	private readonly chaincode: Chaincode
	private readonly erc20ArgsCreator = new Erc20ArgsGenerator()
	erc20ChaincodeInfo!: Erc20ChaincodeInfo

	constructor(chaincode: Chaincode) {
		this.chaincode = chaincode
	}

	chaincodeAddress(): string {
		return this.chaincode.chaincodeAddress()
	}

	chaincodeName(): string {
		return this.chaincode.chaincodeName()
	}

	async info() {
		if (!this.erc20ChaincodeInfo) {
			this.erc20ChaincodeInfo = {
				chaincodeName: this.chaincode.chaincodeName(),
				name: await this.name(),
				symbol: await this.symbol(),
				decimal: "18",
			}
		}
		return this.erc20ChaincodeInfo
	}

	init(
		cliInvoker: CliChaincodeInvoker,
		name: string,
		symbol: string,
		decimal: string,
		deployer: string,
		initAmount: string,
		gas: string,
		gasPrice: string,
		ownerChaincodeName: string = ""
	) {
		const amount = bigIntParamToHex(initAmount)
		this.erc20ChaincodeInfo = { chaincodeName: this.chaincode.chaincodeName(), name, symbol, decimal }
		cliInvoker.invoke(
			this.chaincode.channelName,
			this.chaincodeName(),
			"initLedger",
			[this.chaincodeName(), name, symbol, decimal, deployer, amount, gas, gasPrice, ownerChaincodeName],
			true
		)
	}

	async mint(fromAccount: Account, toAddress: Address, mintAmount: string) {
		const mintPayload = await this.invoke(fromAccount, "_mint", [toAddress.toHexString(), mintAmount])
		return mintPayload.amount
	}

	async transfer(fromAccount: Account, toAddress: Address, amount: string) {
		return await this.invoke(fromAccount, "transfer", [toAddress.toHexString(), amount])
	}

	async approve(signer: Account, spender: string, amount: string) {
		return await this.invoke(signer, "transfer", [spender, amount])
	}

	async transferFrom(signer: Account, from: string, to: string, amount: string): Promise<string> {
		const transferFromPayload = await this.invoke(signer, "transfer", [from, to, amount])
		return transferFromPayload.amount
	}

	async totalSupply(): Promise<string> {
		const totalSupplyPayload = await this.query("totalSupply", [])
		return totalSupplyPayload.totalSupply
	}

	async getAddressNonce(address: string): Promise<number> {
		const addressNoncePayload = await this.query("getAddressNonce", [address])
		return addressNoncePayload.nonce
	}

	async balanceOf(address: string): Promise<string> {
		//const balanceOfPayload = await this.query("balanceOf", [address.toHexString()])
		const balanceOfPayload = await this.query("balanceOf", [address])
		return balanceOfPayload.balance
		//return BigInt(balanceOf.balance).toString()
	}

	async allowance(owner: string, spender: string): Promise<string> {
		const allowancePayload = await this.query("allowance", [owner, spender])
		return allowancePayload.allowance
	}

	async symbol(): Promise<string> {
		const symbolPayload = await this.query("symbol", [])
		return symbolPayload.symbol
	}

	async name(): Promise<string> {
		const namePayload = await this.query("name", [])
		return namePayload.name
	}

	async decimal(): Promise<string> {
		const decimalPayload = await this.query("decimal", [])
		return decimalPayload.name
	}

	async basicInfo(): Promise<Erc20BasicInfo> {
		return await this.query("basicInfo", [])
	}

	async query(functionName: string, args: string[] = []): Promise<any> {
		const result = await this.chaincode.query(functionName, args)
		return result.query
	}

	async invoke(signer: Account, functionName: string, args: string[]): Promise<any> {
		const erc20Args = await this.erc20ArgsCreator.createArgs(signer, this, functionName, args)
		const result = await this.chaincode.submit(functionName, erc20Args.toStringArray())
		return result.payload.tx.payload.details
	}
}
