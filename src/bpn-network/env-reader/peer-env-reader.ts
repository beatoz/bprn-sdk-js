/** @format */

import { ConnectionProfile } from "../connection-profile/connection-profile"
import * as path from "path"
import { PeerEnvs } from "../envs"

export class PeerEnvReader {
	private readonly connectionProfile: ConnectionProfile
	private readonly baseDir: string

	constructor(connectionProfile: ConnectionProfile, baseDir: string = process.cwd()) {
		this.connectionProfile = connectionProfile
		this.baseDir = baseDir
	}

	// constructor(connectionProfilePath: string, baseDir: string = process.cwd()) {
	//     const profileContent = fs.readFileSync(connectionProfilePath, 'utf-8');
	//     this.connectionProfile = JSON.parse(profileContent);
	//     this.baseDir = baseDir;
	// }

	public createPeerEnvsList(fabricCfgPath: string, mspConfigBasePath?: string): PeerEnvs[] {
		const peerEnvsList: PeerEnvs[] = []

		if (!this.connectionProfile.peers) {
			return peerEnvsList
		}

		// connection profile의 각 peer에 대해 PeerEnvs 생성
		for (const [peerId, peerConfig] of Object.entries(this.connectionProfile.peers)) {
			// URL에서 주소 추출 (예: grpcs://peer0.org1.bc:7051 -> peer0.org1.bc:7051)
			const peerAddress = peerConfig.url.replace(/^grpcs?:\/\//, "")

			// TLS root cert 파일 경로 추출
			const tlsRootCertFile = peerConfig.tlsCACerts?.path ? path.resolve(this.baseDir, peerConfig.tlsCACerts.path) : undefined

			// hostnameOverride 또는 peerId를 사용
			//const peerHostname = peerConfig.grpcOptions?.hostnameOverride || peerId;

			// 해당 peer가 속한 organization 찾기
			const orgName = this.findOrganizationByPeer(peerId)
			const org = orgName ? this.connectionProfile.organizations?.[orgName] : undefined

			// MSP 설정 경로 구성
			let mspConfigPath: string | undefined
			if (mspConfigBasePath && orgName) {
				// 예: ./crypto-config/peerOrganizations/org1.bc/users/Admin@org1.bc/msp
				const orgDomain = this.extractDomainFromPeerId(peerId)
				mspConfigPath = path.resolve(this.baseDir, mspConfigBasePath, `peerOrganizations/${orgDomain}/users/Admin@${orgDomain}/msp`)
			}

			const peerEnvs: PeerEnvs = {
				FABRIC_CFG_PATH: fabricCfgPath,
				CORE_PEER_ID: peerId,
				CORE_PEER_ADDRESS: peerAddress,
				CORE_PEER_LOCALMSPID: org?.mspid,
				CORE_PEER_TLS_ENABLED: "true",
				CORE_PEER_TLS_ROOTCERT_FILE: tlsRootCertFile,
				CORE_PEER_MSPCONFIGPATH: mspConfigPath,
			}

			peerEnvsList.push(peerEnvs)
		}

		return peerEnvsList
	}

	/**
	 * peer ID로부터 organization 이름 찾기
	 */
	private findOrganizationByPeer(peerId: string): string | undefined {
		if (!this.connectionProfile.organizations) {
			return undefined
		}

		for (const [orgName, orgConfig] of Object.entries(this.connectionProfile.organizations)) {
			if (orgConfig.peers?.includes(peerId)) {
				return orgName
			}
		}

		return undefined
	}

	private extractDomainFromPeerId(peerId: string): string {
		const parts = peerId.split(".")
		if (parts.length > 1) {
			return parts.slice(1).join(".")
		}
		return peerId
	}

	public createPeerEnvs(
		peerId: string,

		fabricCfgPath: string,
		mspConfigBasePath?: string
	): PeerEnvs | undefined {
		const allPeerEnvs = this.createPeerEnvsList(fabricCfgPath, mspConfigBasePath)
		return allPeerEnvs.find((env) => env.CORE_PEER_ID === peerId)
	}
}
