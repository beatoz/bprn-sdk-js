/** @format */
import * as fabprotos from 'fabric-protos';
import * as fabproto6 from 'fabric-protos';
import Long from 'long';
import { CommonParser } from "./common-parser"
import {
	ChaincodeData,
	ChannelHeader,
	CommonTransaction,
	ConfigTransaction,
	EndorserTransaction,
	ExtendedTransaction,
	SignatureHeader,
	TransactionHeader,
	TransactionType,
} from "./types/transaction"
import { ChaincodeConverter } from "./chaincode-parser"
import { TransactionEntryPoint } from "./transaction-entry-point"

export class TransactionParser {

	static validateBlock(block: fabproto6.common.IBlock) {
		return block.header != null && block.data != null && block.metadata != null;
	}

	static convertExtendedTransactions(block: fabproto6.common.IBlock) {
		if (!this.validateBlock(block)) {
			throw new Error('Invalid block');
		}

		const blockNum = block.header!.number as Long;
		const transactions = block.data!.data;
		const metadata = block.metadata;

		if (transactions == null || metadata == null) {
			throw new Error('Invalid block data');
		}

		const txLen = transactions.length;
		const txValidationCodes = metadata.metadata![fabprotos.common.BlockMetadataIndex.TRANSACTIONS_FILTER];
		const extendedTxs: ExtendedTransaction[] = [];
		let invalidTxCount = 0;

		for (let i = 0; i < txLen; i++) {
			const txValidCode = txValidationCodes[i];
			const tx = transactions[i]
			const extTx = this.convertExtendedTransaction(blockNum, i, tx, txValidCode);
			extendedTxs.push(extTx);

			if (CommonParser.isInvalidTransaction(extTx)) {
				invalidTxCount++;
			}
		}

		return {
			extendedTxs: extendedTxs,
			invalidTxCount: invalidTxCount
		};
	}

	static convertExtendedTransaction(blockNum: Long, txNum: number, transaction: any, txValidationCode: any) {
		const txValidCode = Number(txValidationCode);
		const tx = this.convertTransaction(transaction);
		return new ExtendedTransaction(txNum, txValidCode, tx);
	}

	static convertTransaction(transaction: any): CommonTransaction {
		const signature = BigInt('0x' + transaction.signature.toString('hex')).toString();
		const header = TransactionParser.convertTransactionHeader(transaction);

		switch (header.channelHeader.typeString) {
			case TransactionType.CONFIG: {
				const configTx = TransactionParser.convertConfigTransaction(transaction);
				return new CommonTransaction(signature, header, configTx);
			}
			case TransactionType.ENDORSER_TRANSACTION: {
				const endorserTx = TransactionParser.convertEndorserTransaction(transaction);
				return new CommonTransaction(signature, header, endorserTx);
			}
			default:
				break;
		}

		throw new Error('Unknown transaction type');
	}

	static convertTransactionHeader(transaction: any) {
		const header = transaction.payload.header;
		const chHeader = header.channel_header;

		const extension = (chHeader.extension !== undefined) ? Buffer.from(JSON.stringify(chHeader.extension)).toString('hex') : '';
		const channelHeader = new ChannelHeader(chHeader.version, chHeader.timestamp, chHeader.channel_id, chHeader.tx_id, extension, chHeader.typeString);
		const signatureHeader = new SignatureHeader(header.signature_header.creator.mspid, header.signature_header.nonce);
		return new TransactionHeader(channelHeader, signatureHeader);
	}

	static convertConfigTransaction(transaction: any) {
		return new ConfigTransaction();
	}

	static convertEndorserTransaction(transaction: any) {
		// const txHelper = new TransactionHelper(transaction);
		// const action = txHelper.action();
		const action = TransactionEntryPoint.action(transaction);

		const endorserMsgId = action.endorsements.map(
			(endorsement: any) => endorsement.endorser.mspid,
			//(endorsement: protos.IEndorsement) => endorsement.endorser.mspid,
		);
		const proposalResponsePayload = action.proposal_response_payload;
		const PayloadProposalHash = proposalResponsePayload.proposal_hash.toString(
			'hex',
		);
		const chaincodeData = TransactionParser.converterChaincodeData(transaction);
		return new EndorserTransaction(endorserMsgId, PayloadProposalHash, chaincodeData);
	}

	static converterChaincodeData(transaction: any) {
		const txHelper = new TransactionEntryPoint(transaction);
		const action = txHelper.action();
		//const action = TransactionPathHelper.action(transaction);

		const chaincodeSpec = txHelper.chaincodeSpec();
		const chaincodeName = chaincodeSpec.chaincode_id.name;
		const chaincodeArgs = ChaincodeConverter.toChaincodeArgs(chaincodeSpec.input.args);
		const nsRwSets = ChaincodeConverter.toRwsets(txHelper.nsRwset());
		const status = action.proposal_response_payload.extension.response.status;

		return new ChaincodeData(chaincodeName, status, nsRwSets, JSON.stringify(nsRwSets), chaincodeArgs);
	}
}