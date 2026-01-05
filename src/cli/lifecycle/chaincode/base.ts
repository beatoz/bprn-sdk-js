/** @format */

import { LifecycleChaincodeV2 } from "../lifecycle-chaincode"

export abstract class BaseLifecycleChaincode {
	protected readonly parentLifecycleChaincode: LifecycleChaincodeV2

	constructor(parent: LifecycleChaincodeV2) {
		this.parentLifecycleChaincode = parent
	}
}
