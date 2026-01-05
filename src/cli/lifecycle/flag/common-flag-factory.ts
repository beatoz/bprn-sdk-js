/** @format */

import { OrdererInfo } from "../../../bpn-network"

export class CommonFlagFactory {
	static ordererFlags(ordererInfo: OrdererInfo) {
		return `-o ${ordererInfo.endpoint()} --ordererTLSHostnameOverride ${ordererInfo.id} --cafile ${ordererInfo.tlsRootCaFilePath()} --tls`
	}

	static tlsRootCertFiles(tlsRootCertFiles: string[]) {
		const tlsRootCertFileFlags: string[] = []
		for (const tlsRootCertFile of tlsRootCertFiles) {
			tlsRootCertFileFlags.push(`--tlsRootCertFiles "${tlsRootCertFile}"`)
		}
		return tlsRootCertFileFlags.join(" ")
	}

	static peerAddresses(peerAddresses: string[]) {
		const peerAddressesFlag: string[] = []
		for (const peerAddress of peerAddresses) {
			peerAddressesFlag.push(`--peerAddresses "${peerAddress}"`)
		}
		return peerAddressesFlag.join(" ")
	}
}
