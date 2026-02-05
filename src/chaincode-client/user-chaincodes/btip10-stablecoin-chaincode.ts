import { BpnNetwork } from "../../bpn-network"
import { Btip10TokenChaincode } from "./btip10-token-chaincode"

export class Btip10StablecoinChaincode extends Btip10TokenChaincode {
	private readonly emptySig = ""

	static async create(bpnNetwork: BpnNetwork, dAppChaincodeName: string): Promise<Btip10StablecoinChaincode> {
		const contract = await bpnNetwork.getContract(dAppChaincodeName)
		const channelName = bpnNetwork.getChannelName()
		return new Btip10StablecoinChaincode(channelName, contract, bpnNetwork.chainType, bpnNetwork.chainId)
	}

	// async mint(fromAccount: Account, toAddress: string, mintAmount: string) {
	// 	return await this.invokeWithSig(fromAccount, "Mint", [this.emptySig, toAddress, mintAmount])
	// }
	//
	// async burn(fromAccount: Account, burnAmount: string) {
	// 	return await this.invokeWithSig(fromAccount, "Burn", [this.emptySig, burnAmount])
	// }
}
