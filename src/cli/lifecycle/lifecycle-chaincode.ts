/** @format */

import { Package } from "./chaincode/package"
import { Lifecycle } from "./lifecycle"
import { Approve } from "./chaincode/approve"
import { QueryInstalled } from "./chaincode/queryInstalled"
import { Commit } from "./chaincode/commit"
import { Install } from "./chaincode/install"
import { CheckCommitReadiness } from "./chaincode/checkcommitreadiness"
import { ChaincodeDefinition } from "./chaincode/params"
import { OrdererInfo } from "../../bpn-network"
import { QueryCommitted } from "./chaincode/querycommitted"
import { QueryApproved } from "./chaincode/queryapproved"

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

	approve(ccInfo: ChaincodeDefinition, ordererInfo: OrdererInfo): Approve {
		return new Approve(ccInfo, ordererInfo, this)
	}

	queryInstalled(): QueryInstalled {
		return new QueryInstalled(this)
	}

	queryCommitted(): QueryCommitted {
		return new QueryCommitted(this)
	}

	queryApproved(): QueryApproved {
		return new QueryApproved(this)
	}

	checkCommitReadiness() {
		return new CheckCommitReadiness(this)
	}

	commit() {
		return new Commit(this)
	}
}
