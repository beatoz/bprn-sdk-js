/** @format */

import { ChaincodeArgs, NsRwSet } from "./chaincode"

export enum TransactionType {
	CONFIG = "CONFIG",
	ENDORSER_TRANSACTION = "ENDORSER_TRANSACTION",
}

export class ExtendedTransaction {
	public readonly txNum: number
	public readonly validationCode: number
	public readonly transaction: CommonTransaction

	constructor(txNum: number, validationCode: number, transaction: CommonTransaction) {
		this.txNum = txNum
		this.validationCode = validationCode
		this.transaction = transaction
	}
}

export class CommonTransaction {
	public readonly signature: string // EnvelopeSignature
	public readonly header: TransactionHeader
	public readonly data: ConfigTransaction | EndorserTransaction

	constructor(signature: string, header: TransactionHeader, data: ConfigTransaction | EndorserTransaction) {
		this.signature = signature
		this.header = header
		this.data = data
	}
}

export class ConfigTransaction {}

export class EndorserTransaction {
	public readonly endorserMspIds: string[]
	public readonly payloadProposalHash: string
	public readonly chaincodeData: ChaincodeData

	constructor(endorserMspIds: string[], payloadProposalHash: string, chaincodeData: ChaincodeData) {
		this.endorserMspIds = endorserMspIds
		this.payloadProposalHash = payloadProposalHash
		this.chaincodeData = chaincodeData
	}
}

export class ChaincodeData {
	public readonly chaincodeName: string
	public readonly status: number
	public readonly nsRwsets: NsRwSet[]
	public readonly nsRwsetsJson: string
	public readonly chaincodeArgs: ChaincodeArgs

	constructor(chaincodeName: string, status: number, nsRwsets: NsRwSet[], nsRwsetsJson: string, chaincodeArgs: ChaincodeArgs) {
		this.chaincodeName = chaincodeName
		this.status = status
		this.nsRwsets = nsRwsets
		this.nsRwsetsJson = nsRwsetsJson
		this.chaincodeArgs = chaincodeArgs
	}
}

export class TransactionHeader {
	public readonly channelHeader: ChannelHeader
	public readonly signatureHeader: SignatureHeader

	constructor(channelHeader: ChannelHeader, signatureHeader: SignatureHeader) {
		this.channelHeader = channelHeader
		this.signatureHeader = signatureHeader
	}
}

export class ChannelHeader {
	public readonly version: number
	public readonly timestamp: string
	public readonly channelName: string
	public readonly txId: string
	public readonly extension: string
	public readonly typeString: string

	constructor(version: number, timestamp: string, channelName: string, txId: string, extension: string, typeString: string) {
		this.version = version
		this.timestamp = timestamp
		this.channelName = channelName
		this.txId = txId
		this.extension = extension
		this.typeString = typeString
	}

	public isEndorserTransaction() {
		return this.typeString === TransactionType.ENDORSER_TRANSACTION
	}

	public isConfigTransaction() {
		return this.typeString === TransactionType.CONFIG
	}
}

export class SignatureHeader {
	public readonly creatorMspId: string
	public readonly nonce: string

	constructor(mspId: string, nonce: string) {
		this.creatorMspId = mspId
		this.nonce = nonce
	}
}
