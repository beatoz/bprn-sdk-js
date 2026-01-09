/** @format */

import { BpnNetwork, Chaincode } from "../../bpn-network"
import { Erc20ArgsGenerator } from "../generator/erc20-args-generator"
import { Account } from "../../types/account"
import { Erc20Chaincode } from "./erc20-chaincode"
import { CliChaincodeInvoker } from "../../cli"

export class CollateralInfo {
	readonly totalCollateral: bigint
	readonly usedCollateral: bigint
	readonly availableCollateral: bigint

	constructor(totalCollateral: bigint, usedCollateral: bigint) {
		this.totalCollateral = totalCollateral
		this.usedCollateral = usedCollateral
		this.availableCollateral = totalCollateral - usedCollateral
	}

	toJsonString(): string {
		return JSON.stringify({
			totalCollateral: this.totalCollateral.toString(),
			usedCollateral: this.usedCollateral.toString(),
			availableCollateral: this.availableCollateral.toString(),
		})
	}
}

export class VaultChaincode {
	readonly chaincode: Chaincode
	private readonly erc20ArgsCreator = new Erc20ArgsGenerator()

	constructor(chaincode: Chaincode) {
		this.chaincode = chaincode
	}

	static async create(bpnNetwork: BpnNetwork, vaultChaincodeName: string): Promise<VaultChaincode> {
		const chaincode = await bpnNetwork.getChaincode(vaultChaincodeName)
		return new VaultChaincode(chaincode)
	}

	chaincodeAddress(): string {
		return this.chaincode.chaincodeAddress()
	}

	init(cliInvoker: CliChaincodeInvoker) {
		cliInvoker.invoke(this.chaincode.channelName, this.chaincode.chaincodeName(), "InitLedger", ["", "", ""], true)
	}

	async depositCollateral(wbtzCoinChaincode: Erc20Chaincode, issuerAccount: Account, depositAmount: string) {
		const vaultChaincodeAddress = this.chaincodeAddress()
		const btzCoinTransferArgs = await this.erc20ArgsCreator.createArgs(issuerAccount, wbtzCoinChaincode, "Transfer", [
			vaultChaincodeAddress,
			depositAmount,
		])

		const depositPayload = await this.chaincode.submit("DepositCollateral", [wbtzCoinChaincode.chaincodeName(), btzCoinTransferArgs.toJson()])

		return depositPayload.payload
	}

	async mintStableCoin(stableCoinChaincodeName: string, toAddress: string, mintAmount: string) {
		return await this.chaincode.submit("MintStableCoin", [stableCoinChaincodeName, toAddress, mintAmount])
	}

	async depositAndMintStableCoin(
		wbtzCoinChaincode: Erc20Chaincode,
		stableCoinChaincodeName: string,
		btzCoinSigner: Account,
		toAddress: string,
		mintAmount: string
	): Promise<string> {
		const vaultChaincodeAddress = this.chaincode.chaincodeAddress()
		console.log("vaultChaincodeAddress", vaultChaincodeAddress)

		const btzCoinTransferArgs = await this.erc20ArgsCreator.createArgs(btzCoinSigner, wbtzCoinChaincode, "Transfer", [
			vaultChaincodeAddress,
			mintAmount,
		])

		const ratio = "100"
		const mintPayload = await this.chaincode.submit("DepositAndMintStableCoin", [
			wbtzCoinChaincode.chaincodeName(),
			btzCoinTransferArgs.toJson(),
			stableCoinChaincodeName,
			toAddress,
			ratio,
		])

		return mintPayload.payload
	}

	async getCollateralInfo(address: string) {
		const collateralInfoResult = await this.chaincode.query("GetCollateralInfo", [address])
		return new CollateralInfo(BigInt(collateralInfoResult.totalCollateral.value), BigInt(collateralInfoResult.usedCollateral.value))
	}

	async colletaralAmount(address: string) {
		const amount = await this.chaincode.submit("ColleteralAmount", [address])
		return amount
	}

	async isCollateralSufficient(address: string, amount: string) {
		try {
			await this.chaincode.query("IsCollateralSufficient", [address, amount])
			return true
		} catch (error) {
			return false
		}
	}
}
