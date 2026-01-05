/** @format */

import { CliChaincodeDeployService } from "./cli-chaincode-deploy-service"
import { InvokeParam } from "../cli/chaincode/invoke"
import { CliChaincodeInvokeService } from "./cli-chaincode-invoke-service"
import { PackagingMode } from "../cli"

export class CliChaincodeDeployInitService {
	readonly cliChaincodeDeployService: CliChaincodeDeployService
	readonly cliChaincodeInit: CliChaincodeInvokeService

	constructor(ccDeployService: CliChaincodeDeployService, cliChaincodeInit: CliChaincodeInvokeService) {
		this.cliChaincodeDeployService = ccDeployService
		this.cliChaincodeInit = cliChaincodeInit
	}

	deployAndInit(channelName: string, chaincodeName: string, invokeParam: InvokeParam, packagingMode= PackagingMode.PeerCli) {
		this.cliChaincodeDeployService.deploy(channelName, chaincodeName, true, packagingMode)
		return this.cliChaincodeInit.invoke(channelName, chaincodeName, invokeParam.functionName, invokeParam.args, true)
	}
}
