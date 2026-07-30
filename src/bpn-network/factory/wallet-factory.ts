/** @format */

import { Wallet, Wallets, Identity } from "fabric-network"
import { Utils } from "../../utils"
import { Client } from "../connection-profile/connection-profile"

export class WalletFactory {
	async createWallet(clients: Client[]): Promise<Wallet> {
		const wallet = await Wallets.newInMemoryWallet()
		//const wallet = await Wallets.newFileSystemWallet(walletPath);

		for (const client of clients) {
			const clientIdentity = this.createClientIdentity(client)
			await wallet.put(client.id, clientIdentity)
		}

		return wallet
	}

	createClientIdentity(client: Client): any {
		const cert = Utils.readFile(client.signedCertPath)
		const privKey = Utils.readFile(client.privateKeyPath)

		this.validateUserIdentity(cert, privKey)

		return this.createX509Identity(cert, privKey, client.mspId)
	}

	createX509Identity(cert: string, pvKey: string, mspId: string): Identity {
		const x509Identity = {
			credentials: {
				certificate: cert,
				privateKey: pvKey,
			},
			mspId: mspId,
			type: "X.509",
		}

		return x509Identity
	}

	validateUserIdentity(cert: string, key: string): void {
		// Basic validation for certificate format
		if (!cert.includes("-----BEGIN CERTIFICATE-----") || !cert.includes("-----END CERTIFICATE-----")) {
			throw new Error("Invalid certificate format: must be PEM encoded")
		}

		// Basic validation for private key format
		const validKeyHeaders = ["-----BEGIN PRIVATE KEY-----", "-----BEGIN RSA PRIVATE KEY-----", "-----BEGIN EC PRIVATE KEY-----"]

		const hasValidKeyHeader = validKeyHeaders.some((header) => key.includes(header))
		if (!hasValidKeyHeader) {
			throw new Error("Invalid private key format: must be PEM encoded")
		}

		// Check if certificate and key are not empty after trimming
		if (cert.trim().length === 0) {
			throw new Error("Certificate file is empty")
		}

		if (key.trim().length === 0) {
			throw new Error("Private key file is empty")
		}
	}
}
