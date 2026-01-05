import Long from 'long';
import { ExtendedTransaction } from "./transaction"

export class Block {
  public readonly blockNum: Long;
  public readonly blockHash: string;
  public readonly dataHash: string;
  public readonly previousHash: string;
  public readonly transacionsCount: number;
  public readonly invalidTxCount: number;
  public readonly timestamp: string;
  public readonly blockSize: number;
  public readonly extendedTransactions: ExtendedTransaction[];

  constructor(blockNum: Long, blockHash : string, dataHash: string, previousHash: string, transacionsCount: number, timestamp: string, blkSize: number, extendedTransactions: ExtendedTransaction[], invalidTxCount: number) {
    this.blockNum = blockNum;
    this.blockHash = blockHash;
    this.dataHash = dataHash;
    this.previousHash = previousHash;
    this.transacionsCount = transacionsCount;
    this.invalidTxCount = invalidTxCount;
    this.timestamp = timestamp;
    this.blockSize = blkSize;
    this.extendedTransactions = extendedTransactions;
  }

  static newEmptyBlock(): Block {
    return new Block(Long.fromNumber(0) , "", "", "", 0, "", 0, [], 0);
  }
}