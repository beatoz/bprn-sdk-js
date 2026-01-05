/** @format */

import { ConnectionProfile } from "../../connection-profile/connection-profile"
import { PeerInfo } from "./network-info"
import * as path from "path"

import { BpnDirInfo } from "../bpn-dir-info"
import { NodeId } from "../peer-id"

export class PeerInfoBuilder {
	private readonly connectionProfile: ConnectionProfile
	private readonly networkDirInfo: BpnDirInfo

	constructor(connectionProfile: ConnectionProfile, networkDirInfo: BpnDirInfo) {
		this.connectionProfile = connectionProfile
		this.networkDirInfo = networkDirInfo
	}

	public buildList(cryptoConfigPath: string = "crypto-config"): PeerInfo[] {
		const peerList: PeerInfo[] = []

		if (!this.connectionProfile.peers) {
			return peerList
		}

		for (const [peerId, peerConfig] of Object.entries(this.connectionProfile.peers)) {
			const peerInfo = this.buildPeerInfo(peerId, peerConfig, cryptoConfigPath)
			if (peerInfo) {
				peerList.push(peerInfo)
			}
		}

		return peerList
	}

	public build(peerId: string, cryptoConfigPath: string = "crypto-config"): PeerInfo | undefined {
		if (!this.connectionProfile.peers) {
			return undefined
		}

		const peerConfig = this.connectionProfile.peers[peerId]
		if (!peerConfig) {
			return undefined
		}

		return this.buildPeerInfo(peerId, peerConfig, cryptoConfigPath)
	}

	private buildPeerInfo(peerId: string, peerConfig: any, cryptoConfigPath: string): PeerInfo | undefined {
		const nodeId = NodeId.fromId(peerId)

		// URL에서 주소 추출 (예: grpcs://peer0.org1.bc:7051)
		const peerAddress = peerConfig.url.replace(/^grpcs?:\/\//, "")

		// 해당 peer가 속한 organization 찾기
		const orgName = this.findOrganizationByPeer(peerId)
		if (!orgName) {
			return undefined
		}

		const org = this.connectionProfile.organizations?.[orgName]
		if (!org) {
			return undefined
		}

		// TLS enabled 여부
		const tlsEnabled = peerConfig.url.startsWith("grpcs://")

		// peer의 도메인 추출 (예: peer0.org1.bc -> org1.bc)
		const peerDomain = this.extractDomainFromPeerId(peerId)

		// MSP 디렉토리 경로 구성
		// 예: ./crypto-config/peerOrganizations/org1.bc/peers/peer0.org1.bc/msp
		const mspDir = path.resolve(this.networkDirInfo.cryptoConfigDir(), `peerOrganizations/${peerDomain}/peers/${peerId}/msp`)

		// TLS 디렉토리 경로 구성
		// 예: ./crypto-config/peerOrganizations/org1.bc/peers/peer0.org1.bc/tls
		const tlsDir = path.resolve(this.networkDirInfo.cryptoConfigDir(), `peerOrganizations/${peerDomain}/peers/${peerId}/tls`)

		return new PeerInfo(nodeId, peerAddress, orgName, org.mspid, mspDir, tlsDir, tlsEnabled)
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

	/**
	 * peer ID에서 도메인 추출 (예: peer0.org1.bc -> org1.bc)
	 */
	private extractDomainFromPeerId(peerId: string): string {
		const parts = peerId.split(".")
		if (parts.length > 1) {
			return parts.slice(1).join(".")
		}
		return peerId
	}
}
