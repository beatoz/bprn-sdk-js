/** @format */

import { OrdererInfo, PeerInfo } from "../../../bpn-network/info/network-info/network-info"
import { InvokeParam } from "../../chaincode/invoke"

export class FlagBuilder {
	channelId?: string
	ccName?: string
	ccVersion?: number
	ccSequence?: number
	_packageId?: string
	ordererInfo?: OrdererInfo
	peerInfos?: PeerInfo[]
	peerAddressList: string[] = []
	_waitForEvent: boolean = false
	_isInit: boolean = false
	_initRequired: boolean = false
	ccParamJson?: string
	_invokeParam?: InvokeParam

	ordererFlag(ordererInfo: OrdererInfo) {
		this.ordererInfo = ordererInfo
		return this
	}

	initRequired(initRequired: boolean) {
		this._initRequired = initRequired
		return this
	}

	isInit(isInit: boolean) {
		this._isInit = isInit
		return this
	}

	waitForEvent(set: boolean = true) {
		this._waitForEvent = set
		return this
	}

	c(invokeParam: InvokeParam) {
		this._invokeParam = invokeParam
		return this
	}

	packageId(packageId: string) {
		this._packageId = packageId
		return this
	}

	// c(chaincodeParamJson: string) {
	//     this.ccParamJson = chaincodeParamJson
	//     return this
	// }

	peerAddresses(peerInfos: PeerInfo[]) {
		this.peerInfos = peerInfos
		this.peerAddressList = peerInfos.map((peerInfo) => peerInfo.address)
		return this
		// const peerAddressesFlag : string[] = []
		// for (const peerAddress of peerAddresses) {
		//     peerAddressesFlag.push( `--peerAddresses "${peerAddress}"`);
		// }
		// return peerAddressesFlag.join(" ")
	}

	channelID(channelID: string) {
		this.channelId = channelID
		return this
	}

	chaincodeName(chaincodeName: string) {
		this.ccName = chaincodeName
		return this
	}

	version(chaincodeVersion: number) {
		this.ccVersion = chaincodeVersion
		return this
	}

	sequence(chaincodeSequece: number) {
		this.ccSequence = chaincodeSequece
		return this
	}

	build() {
		const flags: string[] = []
		if (this.channelId) {
			flags.push(`--channelID ${this.channelId}`)
		}
		if (this.ccName) {
			flags.push(`--name ${this.ccName}`)
		}
		if (this.ccVersion) {
			flags.push(`--version ${this.ccVersion}`)
		}
		if (this.ccSequence) {
			flags.push(`--sequence ${this.ccSequence}`)
		}
		if (this._packageId) {
			flags.push(`--package-id ${this._packageId}`)
		}
		if (this.ordererInfo) {
			const cmd = `-o "${this.ordererInfo.endpoint()}" --ordererTLSHostnameOverride "${this.ordererInfo.id}" --cafile "${this.ordererInfo.tlsCaCertFilePath()}" --tls`
			flags.push(cmd)
			//flags.push(CommonFlag.ordererFlags(this.ordererInfo))
		}
		if (this._waitForEvent) {
			flags.push("--waitForEvent")
		}
		if (this._initRequired) {
			flags.push("--init-required")
		}
		if (this._isInit) {
			flags.push("--isInit")
		}
		if (this._invokeParam) {
			flags.push(`-c '${this._invokeParam.chaincodeParamCommand()}'`)
		}
		if (this.ccParamJson) {
			flags.push(`-c '${this.ccParamJson}'`)
		}
		if (this.peerInfos) {
			const peerFlags: string[] = []
			for (const peerInfo of this.peerInfos) {
				peerFlags.push(`--peerAddresses ${peerInfo.address}`)
				//peerFlags.push(`--tlsRootCertFiles "${peerInfo.tlsRootCertFilePath()}"`);
				peerFlags.push(`--tlsRootCertFiles "${peerInfo.tlsCaCertFilePath()}"`)
			}
			flags.push(peerFlags.join(" "))
		}

		// if (this.peerAddressList.length > 0) {
		//     const peerAddressesFlag : string[] = []
		//     for (const peerAddress of this.peerAddressList) {
		//         peerAddressesFlag.push( `--peerAddresses "${peerAddress}"`);
		//         peerAddressesFlag.push( `--tlsRootCertFiles "${peerAddress}"`);
		//     }
		//     flags.push(peerAddressesFlag.join(" "))
		// }

		return flags.join(" ")
	}
}
