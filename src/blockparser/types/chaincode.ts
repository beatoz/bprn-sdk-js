import Long from 'long';
import util from 'node:util';
import { RwSetParser } from "../rwset-parser"

export class ChaincodeArgs {
  method: string;
  args: string[];

   constructor(method: string, args: string[]) {
    this.method = method;
    this.args = args;
  }
}

export class NsRwSet {
  readonly namespace: string;
  readonly readSets: ReadSet[];
  readonly writeSets: WriteSet[];

  constructor(namespace: string, readSets: ReadSet[], writeSets: WriteSet[]) {
    this.namespace = namespace;
    this.readSets = readSets;
    this.writeSets = writeSets;
  }
}

export class Version {
  readonly blockNum: Long;
  readonly txNum: number;

  constructor(blockNum: Long, txNum: number) {
    this.blockNum = blockNum;
    this.txNum = txNum;
  }
}

export class ReadSet {
  readonly key: string;
  readonly version?: Version;

  constructor(key: string, version: any) {
    this.key = RwSetParser.convertRwSetKey(key);
    if (version !== undefined) {
      this.version = new Version(version.block_num, version.tx_num);
    }
  }
}

export class WriteSet {
  readonly key: string;
  readonly value: string;
  readonly isDelete: boolean;

  constructor(key: string, value: string, isDelete: boolean) {
    this.key = RwSetParser.convertRwSetKey(key);
    this.value = RwSetParser.convertWriteSetValue(value);
    this.isDelete = isDelete;
  }

  static toJson(writeSet: WriteSet): string {
    return util.format(
      '{"key":"%s", "value":%s, "isDeleted":%s}',
      writeSet.key,
      writeSet.value,
      writeSet.isDelete
    );
  }
}
