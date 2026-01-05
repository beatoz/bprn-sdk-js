/** @format */

export interface NetworkConfig {
	connectionProfile: string
	walletPath: string
	userId: string
	orgMSPId: string
	certPath: string
	keyPath: string
}

export interface TLSCACerts {
	path?: string
	pem?: string
}

export interface GrpcOptions {
	"ssl-target-name-override"?: string
	hostnameOverride?: string
	"keep-alive-time"?: string
	"keep-alive-timeout"?: string
	"keep-alive-permit"?: boolean
	"fail-fast"?: boolean
	"allow-insecure"?: boolean
}

export interface Peer {
	url: string
	operationPort?: string
	grpcOptions?: GrpcOptions
	tlsCACerts?: TLSCACerts
}

export interface Orderer {
	url: string
	mspid?: string
	operationPort?: string
	grpcOptions?: GrpcOptions
	tlsCACerts?: TLSCACerts
}

export interface ChannelPeer {
	endorsingPeer?: boolean
	chaincodeQuery?: boolean
	ledgerQuery?: boolean
	eventSource?: boolean
}

export interface Channel {
	orderers?: string[]
	peers?: { [key: string]: ChannelPeer }
}

export interface CertificateAuthority {
	url: string
	caName?: string
	tlsCACerts?: TLSCACerts
	httpOptions?: any
	registrar?: {
		enrollId: string
		enrollSecret: string
	}
}

export interface Organization {
	mspid: string
	peers?: string[]
	orderers?: string[]
	certificateAuthorities?: string[]
	cryptoPath?: string
	adminPrivateKey?: {
		path?: string
		pem?: string
	}
	signedCert?: {
		path?: string
		pem?: string
	}
}

export interface Client {
	organization: string
	mspId: string
	id: string
	privateKeyPath: string
	signedCertPath: string
}

export interface ConnectionProfile {
	name: string
	version: string
	clients: Client[]
	organizations?: { [key: string]: Organization }
	orderers?: { [key: string]: Orderer }
	peers?: { [key: string]: Peer }
	channels?: { [key: string]: Channel }
	certificateAuthorities?: { [key: string]: CertificateAuthority }
}
