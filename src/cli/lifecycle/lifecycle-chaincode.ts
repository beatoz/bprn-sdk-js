/** @format */

import { Package } from "./chaincode/package"
import { Lifecycle } from "./lifecycle"
import { Approve } from "./chaincode/approve"
import { QueryInstalled } from "./chaincode/queryInstalled"
import { Commit } from "./chaincode/commit"
import { Install } from "./chaincode/install"
import { CheckCommitReadiness } from "./chaincode/checkcommitreadiness"
import { ChaincodeInfo } from "./chaincode/params"
import { OrdererInfo } from "../../bpn-network/info/network-info/network-info"
import { QueryCommitted } from "./chaincode/querycommitted"

export class LifecycleChaincodeV2 {
	readonly parentLifecycle: Lifecycle

	constructor(lifecycle: Lifecycle) {
		this.parentLifecycle = lifecycle
	}

	command(): string {
		return this.parentLifecycle.command() + "chaincode "
	}

	package(): Package {
		return new Package(this)
	}

	install(): Install {
		return new Install(this)
	}

	approve(ccInfo: ChaincodeInfo, ordererInfo: OrdererInfo): Approve {
		return new Approve(ccInfo, ordererInfo, this)
	}

	queryInstalled(): QueryInstalled {
		return new QueryInstalled(this)
	}

	queryCommitted(): QueryCommitted {
		return new QueryCommitted(this)
	}

	checkCommitReadiness() {
		return new CheckCommitReadiness(this)
	}

	commit() {
		return new Commit(this)
	}
}
