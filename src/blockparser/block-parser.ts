/** @format */
import { BlockEvent } from "fabric-network"
import * as fabprotos from "fabric-protos"
import { TransactionParser } from "./transaction-parser"
import { ExtendedTransaction } from "./types/transaction"
import Long from "long"
import { CommonParser } from "./common-parser"
import { Block } from "./types/block"
import logger from "../logger"

export class BlockParser {
	static parseBlockEvent(blockEvent: BlockEvent) {
		try {
			//const block = blockEvent.blockData as fabproto6.common.IBlock;
			const block = blockEvent.blockData as fabprotos.common.Block;
			const blockNumber = blockEvent.blockNumber;
			const txEvents = blockEvent.getTransactionEvents()

			const extendedTxsInfo = TransactionParser.convertExtendedTransactions(block);
			return BlockParser.toBlockDto(block, extendedTxsInfo.extendedTxs, extendedTxsInfo.invalidTxCount);
		} catch (err) {
			throw new Error(`blockEventToBlockDto error: ${err}, block num: ${blockEvent.blockNumber}`);
		}
	}

	static toBlockDto(block: fabprotos.common.Block, extendedTxs: ExtendedTransaction[], invalidTxCount: number) {
		if (block.header == null || block.data == null || block.metadata == null) {
			throw new Error('Invalid block');
		}

		try {
			const header = block.header!;
			const data = block.data!;
			const metadata = block.metadata!;

			const blockNum = header.number as Long;
			const dataHash = CommonParser.getHexHash(header.data_hash!);
			const prevHash = CommonParser.getHexHash(header.previous_hash!);
			const blockHash = CommonParser.calculateBlockHash(header);
			const txCount = data.data!.length;

			let lastTxTimestamp;
			if (extendedTxs.length > 0) {
				const lastTx = extendedTxs[extendedTxs.length-1];
				lastTxTimestamp = lastTx.transaction.header.channelHeader.timestamp;
			} else {
				lastTxTimestamp = "";
			}
			const blockSize = CommonParser.getBlockSize(block);

			return new Block(blockNum, blockHash, dataHash, prevHash, txCount, lastTxTimestamp, blockSize, extendedTxs, invalidTxCount);
		} catch (err) {
			logger.error(`toBlockDto error: ${err}, block num: ${block.header.number}`);
		}
	}

	static jsonObjSize(json: any) {
		let bytes = 0;

		function sizeOf(obj : any) {
			if (obj !== null && obj !== undefined) {
				switch (typeof obj) {
					case 'number': {
						bytes += 8;
						break;
					}
					case 'string': {
						bytes += obj.length;
						break;
					}
					case 'boolean': {
						bytes += 4;
						break;
					}
					case 'object': {
						const objClass = Object.prototype.toString.call(obj).slice(8, -1);
						if (objClass === 'Object' || objClass === 'Array') {
							for (const key in obj) {
								if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
								sizeOf(obj[key]);
							}
						} else {
							bytes += obj.length;
						}
						break;
					}
					default:
						//logger.debug(typeof obj);
						break;
				}
			}
			return bytes;
		}

		function formatByteSize(rawByte : any) {
			return (rawByte / 1024).toFixed(0);
		}

		return formatByteSize(sizeOf(json));
	}
}
