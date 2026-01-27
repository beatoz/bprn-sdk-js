/** @format */

import { BpnNetwork, Chaincode } from "../../bpn-network"
import { Account, SigMsg } from "../../types"
import { CliChaincodeInvoker } from "../../cli"
import { Btip10TokenChaincode } from "./btip10-token-chaincode"
import * as web3Account from "@beatoz/web3-accounts"
import { CollateralInfo } from "./vault-chaincode"

export class VaultChaincodeV2 extends Chaincode {
	readonly emptySig = ""

	static async create(bpnNetwork: BpnNetwork, vaultChaincodeName: string): Promise<VaultChaincodeV2> {
		const contract = await bpnNetwork.getContract(vaultChaincodeName)
		return new VaultChaincodeV2(bpnNetwork.getChannelName(), contract, bpnNetwork.chainType, bpnNetwork.chainId)
	}

	init(cliInvoker: CliChaincodeInvoker) {
		cliInvoker.invoke(this.channelName, this.chaincodeName(), "InitLedger", [""], true)
	}

	async depositCollateral(wbtzCoinChaincode: Btip10TokenChaincode, issuerAccount: Account, depositAmount: string) {
		const vaultChaincodeAddress = this.chaincodeAddress()
		const methodName = "Transfer"
		const args = [this.emptySig, vaultChaincodeAddress, depositAmount]
		const sigMsg = new SigMsg("", this.chaincodeName(), methodName, args).serialize()
		args[0] = web3Account.sign(sigMsg, issuerAccount.privateKey).toHex()

		const depositPayload = await this.submit("DepositCollateral", [wbtzCoinChaincode.chaincodeName(), JSON.stringify(args)])

		return depositPayload.payload
	}

	async depositCollateral2(wbtzCoinChaincode: Btip10TokenChaincode, issuerAccount: Account, depositAmount: string) {
		return await this.invokeWithSig(issuerAccount, "DepositCollateral2", [this.emptySig, wbtzCoinChaincode.chaincodeName(), depositAmount])
	}

	async mintStableCoin(stableCoinChaincodeName: string, toAddress: string, mintAmount: string) {
		return await this.submit("MintStableCoin", [stableCoinChaincodeName, toAddress, mintAmount])
	}

	async depositAndMintStableCoin(
		wbtzCoinChaincode: Btip10TokenChaincode,
		stableCoinChaincodeName: string,
		btzCoinSigner: Account,
		toAddress: string,
		mintAmount: string
	): Promise<string> {
		const vaultChaincodeAddress = this.chaincodeAddress()
		console.log("vaultChaincodeAddress", vaultChaincodeAddress)

		const args = [this.emptySig, vaultChaincodeAddress, mintAmount]
		const sigMsg = new SigMsg("", this.chaincodeName(), "Transfer", args).serialize()
		args[0] = web3Account.sign(sigMsg, btzCoinSigner.privateKey).toHex()

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
