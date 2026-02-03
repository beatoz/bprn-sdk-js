/** @format */

import { Btip10TokenChaincode, LinkerEndpointChaincodeV2 } from "../chaincode-client"
import { Account } from "../types/account"

export class BprnPrepareLinkerProtocol {
	constructor(private readonly linkerEndpoint: LinkerEndpointChaincodeV2) {}

	async prepareLinkerProtocol(newBtipToken: Btip10TokenChaincode, tokenOwnerAccount: Account, targetChainId: string, targetContractAddress: string) {
		const linkerChannelAndVerifierId = await newBtipToken.setLinkerEndpoint(tokenOwnerAccount, this.linkerEndpoint.chaincodeName())

		await this.linkerEndpoint.addDAppChannel(tokenOwnerAccount, newBtipToken.chaincodeAddress(), targetChainId, targetContractAddress)
	}
}
