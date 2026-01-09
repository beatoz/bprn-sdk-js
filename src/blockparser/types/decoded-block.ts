/** @format */
import * as fabprotos from "fabric-protos"

export interface DecodedChaincodeInput extends fabprotos.protos.IChaincodeInput {
	args?: Uint8Array[]
}

export interface DecodedChaincodeSpec extends Omit<fabprotos.protos.IChaincodeSpec, "input"> {
	input?: DecodedChaincodeInput
}

export interface DecodedChaincodeInvocationSpec extends Omit<fabprotos.protos.IChaincodeInvocationSpec, "chaincode_spec"> {
	chaincode_spec?: DecodedChaincodeSpec
}

export interface DecodedChaincodeProposalPayload extends Omit<fabprotos.protos.IChaincodeProposalPayload, "input"> {
	input?: DecodedChaincodeInvocationSpec
}

export interface DecodedKVRWSet extends fabprotos.kvrwset.IKVRWSet {
	reads?: fabprotos.kvrwset.IKVRead[]
	writes?: fabprotos.kvrwset.IKVWrite[]
	range_queries_info?: fabprotos.kvrwset.IRangeQueryInfo[]
}

export interface DecodedHashedRWSet extends fabprotos.kvrwset.IHashedRWSet {
	hashed_reads?: fabprotos.kvrwset.IKVReadHash[]
	hashed_writes?: fabprotos.kvrwset.IKVWriteHash[]
}

export interface DecodedCollectionHashedReadWriteSet extends Omit<fabprotos.rwset.ICollectionHashedReadWriteSet, "hashed_rwset"> {
	hashed_rwset?: DecodedHashedRWSet
}

export interface DecodedNsReadWriteSet extends Omit<fabprotos.rwset.INsReadWriteSet, "rwset" | "collection_hashed_rwset"> {
	rwset?: DecodedKVRWSet
	collection_hashed_rwset?: DecodedCollectionHashedReadWriteSet[]
}

export interface DecodedTxReadWriteSet extends Omit<fabprotos.rwset.ITxReadWriteSet, "ns_rwset"> {
	ns_rwset?: DecodedNsReadWriteSet[]
}

export interface DecodedChaincodeAction extends Omit<fabprotos.protos.IChaincodeAction, "results" | "events"> {
	results?: DecodedTxReadWriteSet
	events?: fabprotos.protos.IChaincodeEvent
	response?: fabprotos.protos.IResponse
}

export interface DecodedProposalResponsePayload extends Omit<fabprotos.protos.IProposalResponsePayload, "extension"> {
	proposal_hash?: Uint8Array
	extension?: DecodedChaincodeAction
}

export interface DecodedChaincodeEndorsedAction extends Omit<fabprotos.protos.IChaincodeEndorsedAction, "proposal_response_payload"> {
	proposal_response_payload?: DecodedProposalResponsePayload
	endorsements?: fabprotos.protos.IEndorsement[]
}

export interface DecodedChaincodeActionPayload extends Omit<fabprotos.protos.IChaincodeActionPayload, "chaincode_proposal_payload" | "action"> {
	chaincode_proposal_payload?: DecodedChaincodeProposalPayload
	action?: DecodedChaincodeEndorsedAction
}

export interface DecodedTransactionAction extends Omit<fabprotos.protos.ITransactionAction, "payload"> {
	header?: Uint8Array
	payload?: DecodedChaincodeActionPayload
}

export interface DecodedTransaction extends Omit<fabprotos.protos.ITransaction, "actions"> {
	actions?: DecodedTransactionAction[]
}

export interface DecodedPayload extends Omit<fabprotos.common.IPayload, "header" | "data"> {
	header?: {
		channel_header?: fabprotos.common.IChannelHeader
		signature_header?: fabprotos.common.ISignatureHeader
	}
	data?: DecodedTransaction | fabprotos.common.IConfigEnvelope
}

export interface DecodedEnvelope extends Omit<fabprotos.common.IEnvelope, "payload"> {
	signature?: Uint8Array
	payload?: DecodedPayload
}

export interface DecodedBlockData {
	data?: DecodedEnvelope[]
}

export interface DecodedBlock {
	header?: fabprotos.common.IBlockHeader
	data?: DecodedBlockData
	metadata?: fabprotos.common.IBlockMetadata
}

export function isDecodedTransaction(data: DecodedTransaction | fabprotos.common.IConfigEnvelope | undefined): data is DecodedTransaction {
	return data !== undefined && data !== null && "actions" in data
}

export function isConfigEnvelope(data: DecodedTransaction | fabprotos.common.IConfigEnvelope | undefined): data is fabprotos.common.IConfigEnvelope {
	return data !== undefined && data !== null && "config" in data
}

export function getTransactionType(payload: DecodedPayload): "ENDORSER_TRANSACTION" | "CONFIG" | "UNKNOWN" {
	const headerType = payload.header?.channel_header?.type

	if (headerType === fabprotos.common.HeaderType.ENDORSER_TRANSACTION) {
		return "ENDORSER_TRANSACTION"
	} else if (headerType === fabprotos.common.HeaderType.CONFIG) {
		return "CONFIG"
	}

	return "UNKNOWN"
}
