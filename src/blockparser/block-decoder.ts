/** @format */
import * as fabprotos from "fabric-protos"
import {
	DecodedBlock,
	DecodedChaincodeAction,
	DecodedChaincodeActionPayload,
	DecodedChaincodeEndorsedAction,
	DecodedChaincodeInvocationSpec,
	DecodedChaincodeProposalPayload,
	DecodedChaincodeSpec,
	DecodedEnvelope,
	DecodedNsReadWriteSet,
	DecodedPayload,
	DecodedProposalResponsePayload,
	DecodedTransaction,
	DecodedTransactionAction,
	DecodedTxReadWriteSet,
} from "./types/decoded-block"

export class BlockDecoder {
	static decodeBlock(blockRaw: Buffer): DecodedBlock {
		const block = fabprotos.common.Block.decode(blockRaw)

		const decodedBlock: DecodedBlock = {
			header: block.header ?? undefined,
			metadata: block.metadata ?? undefined,
			data: {
				data: [],
			},
		}

		if (block.data?.data) {
			for (const envelopeBytes of block.data.data) {
				const envelope = fabprotos.common.Envelope.decode(envelopeBytes)
				const decodedEnvelope = this.decodeEnvelope(envelope)
				decodedBlock.data!.data!.push(decodedEnvelope)
			}
		}

		return decodedBlock
	}

	private static decodeEnvelope(envelope: fabprotos.common.IEnvelope): DecodedEnvelope {
		const decodedEnvelope: DecodedEnvelope = {
			signature: envelope.signature ?? undefined,
		}

		if (envelope.payload) {
			const payload = fabprotos.common.Payload.decode(envelope.payload as Uint8Array)
			decodedEnvelope.payload = this.decodePayload(payload)
		}

		return decodedEnvelope
	}

	private static decodePayload(payload: fabprotos.common.IPayload): DecodedPayload {
		const decodedPayload: DecodedPayload = {
			header: {},
		}

		if (payload.header) {
			if (payload.header.channel_header) {
				decodedPayload.header!.channel_header = fabprotos.common.ChannelHeader.decode(payload.header.channel_header as Uint8Array)
			}

			if (payload.header.signature_header) {
				decodedPayload.header!.signature_header = fabprotos.common.SignatureHeader.decode(payload.header.signature_header as Uint8Array)
			}
		}

		const channelHeader = decodedPayload.header?.channel_header
		if (payload.data && channelHeader?.type === fabprotos.common.HeaderType.ENDORSER_TRANSACTION) {
			const transaction = fabprotos.protos.Transaction.decode(payload.data as Uint8Array)
			decodedPayload.data = this.decodeTransaction(transaction)
		} else if (payload.data && channelHeader?.type === fabprotos.common.HeaderType.CONFIG) {
			decodedPayload.data = fabprotos.common.ConfigEnvelope.decode(payload.data as Uint8Array)
		}

		return decodedPayload
	}

	private static decodeTransaction(transaction: fabprotos.protos.ITransaction): DecodedTransaction {
		const decodedTransaction: DecodedTransaction = {
			actions: [],
		}

		if (transaction.actions) {
			for (const action of transaction.actions) {
				decodedTransaction.actions!.push(this.decodeTransactionAction(action))
			}
		}

		return decodedTransaction
	}

	private static decodeTransactionAction(action: fabprotos.protos.ITransactionAction): DecodedTransactionAction {
		const decodedAction: DecodedTransactionAction = {
			header: action.header ?? undefined,
		}

		if (action.payload) {
			const chaincodeActionPayload = fabprotos.protos.ChaincodeActionPayload.decode(action.payload as Uint8Array)
			decodedAction.payload = this.decodeChaincodeActionPayload(chaincodeActionPayload)
		}

		return decodedAction
	}

	private static decodeChaincodeActionPayload(payload: fabprotos.protos.IChaincodeActionPayload): DecodedChaincodeActionPayload {
		const decoded: DecodedChaincodeActionPayload = {}

		if (payload.chaincode_proposal_payload) {
			const proposalPayload = fabprotos.protos.ChaincodeProposalPayload.decode(payload.chaincode_proposal_payload as Uint8Array)
			decoded.chaincode_proposal_payload = this.decodeChaincodeProposalPayload(proposalPayload)
		}

		if (payload.action) {
			decoded.action = this.decodeChaincodeEndorsedAction(payload.action)
		}

		return decoded
	}

	private static decodeChaincodeProposalPayload(payload: fabprotos.protos.IChaincodeProposalPayload): DecodedChaincodeProposalPayload {
		const decoded: DecodedChaincodeProposalPayload = {
			TransientMap: payload.TransientMap,
		}

		if (payload.input) {
			const invocationSpec = fabprotos.protos.ChaincodeInvocationSpec.decode(payload.input as Uint8Array)
			decoded.input = this.decodeChaincodeInvocationSpec(invocationSpec)
		}

		return decoded
	}

	private static decodeChaincodeInvocationSpec(spec: fabprotos.protos.IChaincodeInvocationSpec): DecodedChaincodeInvocationSpec {
		const decoded: DecodedChaincodeInvocationSpec = {}

		if (spec.chaincode_spec) {
			decoded.chaincode_spec = this.decodeChaincodeSpec(spec.chaincode_spec)
		}

		return decoded
	}

	private static decodeChaincodeSpec(spec: fabprotos.protos.IChaincodeSpec): DecodedChaincodeSpec {
		const decoded: DecodedChaincodeSpec = {
			type: spec.type,
			chaincode_id: spec.chaincode_id,
			timeout: spec.timeout,
		}

		if (spec.input && ArrayBuffer.isView(spec.input)) {
			decoded.input = fabprotos.protos.ChaincodeInput.decode(spec.input as Uint8Array)
		} else if (spec.input) {
			decoded.input = spec.input as any
		}

		return decoded
	}

	private static decodeChaincodeEndorsedAction(action: fabprotos.protos.IChaincodeEndorsedAction): DecodedChaincodeEndorsedAction {
		const decoded: DecodedChaincodeEndorsedAction = {
			endorsements: action.endorsements ?? undefined,
		}

		if (action.proposal_response_payload) {
			const responsePayload = fabprotos.protos.ProposalResponsePayload.decode(action.proposal_response_payload as Uint8Array)
			decoded.proposal_response_payload = this.decodeProposalResponsePayload(responsePayload)
		}

		return decoded
	}

	private static decodeProposalResponsePayload(payload: fabprotos.protos.IProposalResponsePayload): DecodedProposalResponsePayload {
		const decoded: DecodedProposalResponsePayload = {
			proposal_hash: payload.proposal_hash ?? undefined,
		}

		if (payload.extension) {
			const chaincodeAction = fabprotos.protos.ChaincodeAction.decode(payload.extension as Uint8Array)
			decoded.extension = this.decodeChaincodeAction(chaincodeAction)
		}

		return decoded
	}

	private static decodeChaincodeAction(action: fabprotos.protos.IChaincodeAction): DecodedChaincodeAction {
		const decoded: DecodedChaincodeAction = {
			response: action.response ?? undefined,
		}

		if (action.results) {
			const txReadWriteSet = fabprotos.rwset.TxReadWriteSet.decode(action.results as Uint8Array)
			decoded.results = this.decodeTxReadWriteSet(txReadWriteSet)
		}

		// Decode events
		if (action.events) {
			decoded.events = fabprotos.protos.ChaincodeEvent.decode(action.events as Uint8Array)
		}

		return decoded
	}

	private static decodeTxReadWriteSet(rwset: fabprotos.rwset.ITxReadWriteSet): DecodedTxReadWriteSet {
		const decoded: DecodedTxReadWriteSet = {
			data_model: rwset.data_model,
			ns_rwset: [],
		}

		if (rwset.ns_rwset) {
			for (const nsRwset of rwset.ns_rwset) {
				const decodedNsRwset: DecodedNsReadWriteSet = {
					namespace: nsRwset.namespace,
				}

				if (nsRwset.rwset) {
					decodedNsRwset.rwset = fabprotos.kvrwset.KVRWSet.decode(nsRwset.rwset as Uint8Array)
				}

				// Decode collection hashed read-write sets
				if (nsRwset.collection_hashed_rwset) {
					decodedNsRwset.collection_hashed_rwset = []
					for (const collHashedRwset of nsRwset.collection_hashed_rwset) {
						const decoded: any = {
							collection_name: collHashedRwset.collection_name,
							pvt_rwset_hash: collHashedRwset.pvt_rwset_hash,
						}

						if (collHashedRwset.hashed_rwset) {
							decoded.hashed_rwset = fabprotos.kvrwset.HashedRWSet.decode(collHashedRwset.hashed_rwset as Uint8Array)
						}

						decodedNsRwset.collection_hashed_rwset.push(decoded)
					}
				}

				decoded.ns_rwset!.push(decodedNsRwset)
			}
		}

		return decoded
	}
}
