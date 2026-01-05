/** @format */
import { NodeId } from "../peer-id"

export class NetworkInfo {
	public readonly orderers: OrdererInfo[]
	public readonly peers: PeerInfo[]

	constructor(orderers: OrdererInfo[], peers: PeerInfo[]) {
		this.orderers = orderers
		this.peers = peers
	}
}

export class OrdererInfo {
	public readonly id: NodeId
	public readonly address: string
	public readonly port: string
	public readonly organization: string
	public readonly mspId: string
	public readonly mspDir: string
	public readonly tlsDir: string
	public readonly tlsEnabled: boolean

	constructor(id: NodeId, address: string, port: string, organization: string, mspId: string, mspDir: string, tlsDir: string, tlsEnabled: boolean) {
		this.id = id
		this.address = address
		this.port = port
		this.organization = organization
		this.mspId = mspId
		this.mspDir = mspDir
		this.tlsDir = tlsDir
		this.tlsEnabled = tlsEnabled
	}

	tlsCaCertFilePath(): string {
		return `${this.mspDir}/tlscacerts/tlsca.${this.id.domainName}-cert.pem`
		//return `${this.mspDir}/tlscacerts/tlsca.ordererorg.bc-cert.pem`
		//return `${this.mspDir}/tlscacerts/tlsca.example.com-cert.pem`
	}

	tlsRootCaFilePath(): string {
		return `${this.tlsDir}/ca.crt`
	}

	tlsCertFilePath(): string {
		return `${this.tlsDir}/server.crt`
	}

	tlsKeyFilePath(): string {
		return `${this.tlsDir}/server.key`
	}

	mspKeyFilePath(): string {
		return `${this.mspDir}/keystore/priv_sk`
	}

	mspSignCertFilePath(): string {
		return `${this.mspDir}/signcerts/${this.id}-cert.pem`
	}

	endpoint(): string {
		return `${this.address}:${this.port}`
	}
}

export class PeerInfo {
	public readonly id: NodeId
	public readonly address: string
	public readonly organization: string
	public readonly mspId: string
	public readonly mspDir: string
	public readonly tlsDir: string
	public readonly tlsEnabled: boolean

	constructor(id: NodeId, address: string, organization: string, mspId: string, mspDir: string, tlsDir: string, tlsEnabled: boolean) {
		this.id = id
		this.address = address
		this.organization = organization
		this.mspId = mspId
		this.mspDir = mspDir
		this.tlsDir = tlsDir
		this.tlsEnabled = tlsEnabled
	}

	mspKeyFilePath(): string {
		return `${this.mspDir}/keystore/priv_sk`
	}

	mspSignCertFilePath(): string {
		return `${this.mspDir}/signcerts/${this.id}-cert.pem`
	}

	tlsCaCertFilePath(): string {
		return `${this.mspDir}/tlscacerts/tlsca.${this.id.domainName}-cert.pem`
		//return `${this.mspDir}/tlscacerts/tlsca.org1.bc-cert.pem`
		//return `${this.mspDir}/tlscacerts/tlsca.org1.example.com-cert.pem`
	}

	tlsCertFilePath(): string {
		return `${this.tlsDir}/server.crt`
	}

	tlsKeyFilePath(): string {
		return `${this.tlsDir}/server.key`
	}

	tlsRootCertFilePath(): string {
		return `${this.tlsDir}/ca.crt`
	}
}
