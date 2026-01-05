/** @format */
import { NsRwSet, ReadSet, WriteSet } from "./types/chaincode"
import { CommonParser } from "./common-parser"


export class RwSetParser {
	readonly rwset: any

	constructor(rwset: any) {
		this.rwset = rwset;
	}

	reads() {
		return this.rwset.reads;
	}

	writes() {
		return this.rwset.writes;
	}

	static toReads(reads: any[]) {
		const readSetList: ReadSet[] = [];

		for (let i=0; i< reads.length; i++) {
			const read = reads[i];
			const readSet = new ReadSet(read.key.toString(), read.version);
			readSetList.push(readSet);
		}

		return readSetList;
	}

	static toWrites(writes: any[]) {
		const writeSetList: WriteSet[] = [];

		for (let i=0; i< writes.length; i++) {
			const write = writes[i];
			const writeSet = new WriteSet(write.key.toString(), write.value.toString(), write.is_delete??false);
			writeSetList.push(writeSet);
		}

		return writeSetList;
	}

	static toNsRwSet(nsRwSet: any) {
		const namespace = nsRwSet.namespace;
		const readSets = this.toReads(nsRwSet.rwset.reads);
		const writeSets = this.toWrites(nsRwSet.rwset.writes);
		return new NsRwSet(namespace, readSets, writeSets);
	}

	static convertRwSetKey(key: string) {
		let k = CommonParser.replaceUnicodeNull(key);
		k = CommonParser.replaceAsciiNull(k);
		return k;
	}

	static convertWriteSetValue(value : string) {
		let val = CommonParser.replaceUnicodeEscape(value);
		if (!/^\d+$/.test(val) && val[0] !== '{') {
			val = '"' + val + '"';
		}
		return val;
	}
}