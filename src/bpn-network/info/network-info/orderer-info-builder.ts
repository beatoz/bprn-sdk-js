/** @format */

import { ConnectionProfile } from "../../connection-profile/connection-profile"
import { OrdererInfo } from "./network-info"
import * as path from "path"

import { BpnDirInfo } from "../bpn-dir-info"
import { NodeId } from "../peer-id"

export class OrdererInfoBuilder {
	private readonly connectionProfile: ConnectionProfile
	private readonly networkDirInfo: BpnDirInfo

	constructor(connectionProfile: ConnectionProfile, networkDirInfo: BpnDirInfo) {
		this.connectionProfile = connectionProfile
		this.networkDirInfo = networkDirInfo
	}

	/**
	 * OrdererInfo 리스트 생성
	 * @param cryptoConfigPath crypto-config 디렉토리 경로 (기본값: crypto-config)
	 */
	public buildList(cryptoConfigPath: string = "crypto-config"): OrdererInfo[] {
		const ordererList: OrdererInfo[] = []

		if (!this.connectionProfile.orderers) {
			return ordererList
		}

		for (const [ordererId, ordererConfig] of Object.entries(this.connectionProfile.orderers)) {
			const ordererInfo = this.buildOrdererInfo(ordererId, ordererConfig, cryptoConfigPath)
			if (ordererInfo) {
				ordererList.push(ordererInfo)
			}
		}

		return ordererList
	}

	/**
	 * 특정 orderer의 OrdererInfo 생성
	 */
	public build(ordererId: string, cryptoConfigPath: string = "crypto-config"): OrdererInfo | undefined {
		if (!this.connectionProfile.orderers) {
			return undefined
		}

		const ordererConfig = this.connectionProfile.orderers[ordererId]
		if (!ordererConfig) {
			return undefined
		}

		return this.buildOrdererInfo(ordererId, ordererConfig, cryptoConfigPath)
	}

	private buildOrdererInfo(ordererId: string, ordererConfig: any, cryptoConfigPath: string): OrdererInfo | undefined {
		const nodeId = NodeId.fromId(ordererId)

		// URL에서 주소와 포트 추출 (예: grpcs://orderer0.ordererorg.bc:7050)
		const urlParts = ordererConfig.url.replace(/^grpcs?:\/\//, "").split(":")
		const ordererAddress = urlParts[0]
		const ordererPort = urlParts[1] || "7050"

		// TLS enabled 여부
		const tlsEnabled = ordererConfig.url.startsWith("grpcs://")

		// orderer의 도메인 추출 (예: orderer0.ordererorg.bc -> ordererorg.bc)
		const ordererDomain = this.extractDomainFromOrdererId(ordererId)

		// 해당 orderer가 속한 organization 찾기
		const orgName = this.findOrganizationByOrderer(ordererId)
		if (!orgName) {
			return undefined
		}

		// MSP 디렉토리 경로 구성
		// 예: ./crypto-config/ordererOrganizations/ordererorg.bc/orderers/orderer0.ordererorg.bc/msp
		const mspDir = path.resolve(this.networkDirInfo.cryptoConfigDir(), `ordererOrganizations/${ordererDomain}/orderers/${ordererId}/msp`)

		// TLS 디렉토리 경로 구성
		// 예: ./crypto-config/ordererOrganizations/ordererorg.bc/orderers/orderer0.ordererorg.bc/tls
		const tlsDir = path.resolve(this.networkDirInfo.cryptoConfigDir(), `ordererOrganizations/${ordererDomain}/orderers/${ordererId}/tls`)

		if (!ordererConfig.mspid) {
			throw new Error(`Missing mspid for orderer: ${ordererId}`)
		}

		return new OrdererInfo(nodeId, ordererAddress, ordererPort, orgName, ordererConfig.mspid, mspDir, tlsDir, tlsEnabled)
	}

	/**
	 * orderer ID로부터 organization 이름 찾기
	 */
	private findOrganizationByOrderer(ordererId: string): string | undefined {
		if (!this.connectionProfile.organizations) {
			return undefined
		}

		for (const [orgName, orgConfig] of Object.entries(this.connectionProfile.organizations)) {
			if (orgConfig.orderers?.includes(ordererId)) {
				return orgName
			}
		}

		return undefined
	}

	/**
	 * orderer ID에서 도메인 추출 (예: orderer0.ordererorg.bc -> ordererorg.bc)
	 */
	private extractDomainFromOrdererId(ordererId: string): string {
		const parts = ordererId.split(".")
		if (parts.length > 1) {
			return parts.slice(1).join(".")
		}
		return ordererId
	}
}
