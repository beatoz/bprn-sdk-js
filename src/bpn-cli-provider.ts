/** @format */

import { PeerEnvs } from "./bpn-network"
import { PeerCli } from "./cli"
import { CliChaincodeDeployer } from "./cli"
import { CliChaincodeDeployService } from "./service"
import { CliChaincodeInvoker } from "./cli"
import { BpnProvider } from "./bpn-provider"
import { CliChaincodeDeployInitService } from "./service"
import { CliChaincodeInvokeService } from "./service"

export class BpnCliProvider {
	readonly bpnProvider: BpnProvider
	readonly peerCli: PeerCli

	constructor(bpnProvider: BpnProvider, peerCli: PeerCli) {
		this.bpnProvider = bpnProvider
		this.peerCli = peerCli
	}

	cliChaincodeInvoker(orgDomainName: string) {
		const userInfos = this.bpnProvider.userInfoRepository.getUsersByOrganization(orgDomainName)
		return new CliChaincodeInvoker(this.peerCli, this.bpnProvider.networkInfo, userInfos[0])
	}

	cliChaincodeDeployer() {
		return new CliChaincodeDeployer(this.peerCli, this.bpnProvider.networkInfo)
	}

	cliChaincodeDeployService(stableCoinChaincodeSourceDir: string, orgName: string) {
		const adminUser = this.bpnProvider.userInfoRepository.getAdminByOrganization(orgName)

		return new CliChaincodeDeployService(
			this.cliChaincodeDeployer(),
			adminUser,
			stableCoinChaincodeSourceDir,
			this.bpnProvider.bpnConfigDirInfo.chaincodePackageDir()
		)
	}

	cliChaincodeInvokeService(orgName: string): CliChaincodeInvokeService {
		const userInfo = this.bpnProvider.userInfoRepository.getUsersByOrganization(orgName)
		if (userInfo.length === 0) throw new Error("no user found")

		return new CliChaincodeInvokeService(this.peerCli, this.bpnProvider.networkInfo, userInfo[0])
	}

	cliChaincodeDeployAndInitService(stableCoinChaincodeSourceDir: string, orgName: string): CliChaincodeDeployInitService {
		return new CliChaincodeDeployInitService(
			this.cliChaincodeDeployService(stableCoinChaincodeSourceDir, orgName),
			this.cliChaincodeInvokeService(orgName)
		)
	}

	static async createCliProvider(bpnProvider: BpnProvider): Promise<BpnCliProvider> {
		const peerCliEnv: PeerEnvs = {
			FABRIC_CFG_PATH: bpnProvider.bpnConfigDirInfo.configDir(),
			PATH: "/usr/local/go/bin:/usr/local/bin",
		}
		const peerCli = new PeerCli(bpnProvider.bpnConfigDirInfo.binDir(), peerCliEnv)

		return new BpnCliProvider(bpnProvider, peerCli)
	}
}
