/** @format */

import { BpnNetwork, Chaincode } from "../../bpn-network"
import type { AddressedChaincodeSigner, ChaincodeSigner } from "../../bpn-network"
import { CliChaincodeInvoker } from "../../cli"
import { Btip10TokenChaincode } from "./btip10-token-chaincode"
import { CollateralInfo } from "./vault-chaincode"
import { signChaincodeRequest } from "../../bpn-network"

export class VaultChaincodeV2 extends Chaincode {
	readonly emptySig = ""

	static async create(bpnNetwork: BpnNetwork, vaultChaincodeName: string): Promise<VaultChaincodeV2> {
		const contract = await bpnNetwork.getContract(vaultChaincodeName)
		return new VaultChaincodeV2(bpnNetwork.getChannelName(), contract, bpnNetwork.chainType, bpnNetwork.chainId)
	}

	init(cliInvoker: CliChaincodeInvoker) {
		cliInvoker.invoke(this.channelName, this.chaincodeName(), "InitLedger", [""], true)
	}

	async depositCollateral(wbtzCoinChaincode: Btip10TokenChaincode, issuerAccount: ChaincodeSigner, depositAmount: string) {
		const vaultChaincodeAddress = this.chaincodeAddress()
		const methodName = "Transfer"
		const args = [this.emptySig, vaultChaincodeAddress, depositAmount]
		args[0] = await signChaincodeRequest(issuerAccount, this.createSignatureRequest("", methodName, args))

		const depositPayload = await this.submit("DepositCollateral", [wbtzCoinChaincode.chaincodeName(), JSON.stringify(args)])

		return depositPayload.payload
	}

	async depositCollateral2(wbtzCoinChaincode: Btip10TokenChaincode, issuerAccount: ChaincodeSigner, depositAmount: string) {
		return await this.invokeWithSig(issuerAccount, "DepositCollateral2", [this.emptySig, wbtzCoinChaincode.chaincodeName(), depositAmount])
	}

	async mintStableCoin(stableCoinChaincodeName: string, toAddress: string, mintAmount: string) {
		return await this.submit("MintStableCoin", [stableCoinChaincodeName, toAddress, mintAmount])
	}

	async depositAndMintStableCoin(
		wbtzCoinChaincode: Btip10TokenChaincode,
		stableCoinChaincodeName: string,
		btzCoinSigner: ChaincodeSigner,
		toAddress: string,
		mintAmount: string
	): Promise<string> {
		const vaultChaincodeAddress = this.chaincodeAddress()
		console.log("vaultChaincodeAddress", vaultChaincodeAddress)

		const args = [this.emptySig, vaultChaincodeAddress, mintAmount]
		args[0] = await signChaincodeRequest(btzCoinSigner, this.createSignatureRequest("", "Transfer", args))

		const ratio = "100"
		const mintPayload = await this.submit("DepositAndMintStableCoin", [
			wbtzCoinChaincode.chaincodeName(),
			JSON.stringify(args),
			stableCoinChaincodeName,
			toAddress,
			ratio,
		])

		return mintPayload.payload
	}

	async getCollateralInfo(address: string) {
		const result = await this.query("GetCollateralInfo", [address])
		const collateralInfoResult = JSON.parse(result.toString())
		return new CollateralInfo(BigInt(collateralInfoResult.totalCollateral.value), BigInt(collateralInfoResult.usedCollateral.value))
	}

	async getUsedCollateral(address: string): Promise<string> {
		return await this.query("GetUsedCollateral", [address])
	}

	async getAvailableCollateral(address: string): Promise<string> {
		return await this.query("GetAvailableCollateral", [address])
	}

	async getTotalCollateral(address: string): Promise<string> {
		return await this.query("GetTotalCollateral", [address])
	}

	async colletaralAmount(address: string) {
		const amount = await this.submit("ColleteralAmount", [address])
		return amount
	}

	async isCollateralSufficient(address: string, amount: string) {
		try {
			await this.query("IsCollateralSufficient", [address, amount])
			return true
		} catch (error) {
			return false
		}
	}
}
