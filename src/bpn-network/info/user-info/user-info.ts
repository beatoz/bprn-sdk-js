/** @format */

export class UserInfo {
	public readonly userId: string
	public readonly organization: string
	public readonly mspDir: string
	public readonly tlsDir: string

	constructor(userId: string, organization: string, mspDir: string, tlsDir: string) {
		this.userId = userId
		this.organization = organization
		this.mspDir = mspDir
		this.tlsDir = tlsDir
	}

	mspKeyFilePath(): string {
		return `${this.mspDir}/keystore/priv_sk`
	}

	mspSignCertFilePath(): string {
		return `${this.mspDir}/signcerts/${this.userId}-cert.pem`
	}

	tlsCertFilePath(): string {
		return `${this.tlsDir}/client.crt`
	}

	tlsKeyFilePath(): string {
		return `${this.tlsDir}/client.key`
	}

	tlsRootCertFilePath(): string {
		return `${this.tlsDir}/ca.crt`
	}
}
