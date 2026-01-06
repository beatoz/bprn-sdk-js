/** @format */

import { BpnDirInfo, BpnFactory, BpnNetwork, NetworkInfo, PeerEnvs, UserInfoRepository } from "./bpn-network"
import { PeerCli } from "./cli"
import { CliChaincodeDeployer } from "./cli"
import { CliChaincodeDeployService } from "./service"
import { CliChaincodeInvoker } from "./cli"

export class BpnProvider {
	readonly bpnConfigDirInfo: BpnDirInfo
	readonly bpnNetwork: BpnNetwork
	readonly networkInfo: NetworkInfo
	readonly userInfoRepository: UserInfoRepository
	readonly peerCli: PeerCli

	constructor(bpnConfigDirPath: string, bpnNetwork: BpnNetwork, networkInfo: NetworkInfo, userInfoRepository: UserInfoRepository, peerCli: PeerCli) {
		this.bpnConfigDirInfo = new BpnDirInfo(bpnConfigDirPath)
		this.bpnNetwork = bpnNetwork
		this.networkInfo = networkInfo
		this.userInfoRepository = userInfoRepository
		this.peerCli = peerCli
	}

	newPeerEnvs(orgName: string) {
		const userInfos = this.userInfoRepository.getUsersByOrganization(orgName)
		const peerInfo = this.networkInfo.peers[0]
		const peerEnv: PeerEnvs = {
			CORE_PEER_MSPCONFIGPATH: userInfos[0].mspDir,
			CORE_PEER_TLS_ENABLED: "true",
			CORE_PEER_TLS_ROOTCERT_FILE: peerInfo.tlsRootCertFilePath(),
			CORE_PEER_LOCALMSPID: peerInfo.mspId,
			CORE_PEER_ADDRESS: peerInfo.address,
		}
		return peerEnv
	}

	cliChaincodeInvoker(orgName: string) {
		const userInfos = this.userInfoRepository.getUsersByOrganization(orgName)
		return new CliChaincodeInvoker(this.peerCli, this.networkInfo, userInfos[0])
	}

	cliChaincodeDeployer() {
		return new CliChaincodeDeployer(this.peerCli, this.networkInfo)
	}

	cliChaincodeDeployService(stableCoinChaincodeSourceDir: string, orgName: string) {
		const adminUser = this.userInfoRepository.getAdminByOrganization(orgName)

		return new CliChaincodeDeployService(
			this.cliChaincodeDeployer(),
			adminUser,
			stableCoinChaincodeSourceDir,
			this.bpnConfigDirInfo.chaincodePackageDir()
		)
	}

	static async createProvider(bpnConfigDirPath: string): Promise<BpnProvider> {
		const bpnFactory = BpnFactory.fromBpnConfigDir(bpnConfigDirPath)
		const bpnNetwork = await bpnFactory.createBpnNetwork()
		const networkInfo = bpnFactory.createNetworkInfo()
		const userInfoRepository = bpnFactory.createUserInfoRepository()

		const peerCliEnv: PeerEnvs = {
			FABRIC_CFG_PATH: bpnFactory.getBpnConfigDirPath().configDir(),
			PATH: "/usr/local/go/bin:/usr/local/bin",
		}
		const peerCli = new PeerCli(bpnFactory.getBpnConfigDirPath().binDir(), peerCliEnv)

		return new BpnProvider(bpnConfigDirPath, bpnNetwork, networkInfo, userInfoRepository, peerCli)
	}
}
