/** @format */
import { ChaincodeArgs, NsRwSet } from "./types/chaincode"
import { CommonParser } from "./common-parser"
import { RwSetParser } from "./rwset-parser"

export class ChaincodeConverter {

	static toChaincodeArgs(args: any[]) {
		if (args.length === 0) {
			return new ChaincodeArgs('', []);
		}

		const method = CommonParser.getUtf8String(args[0]);
		const params = args.slice(1).map((arg) => {
			return CommonParser.getUtf8String(arg);
		});

		return new ChaincodeArgs(method, params);
	}

	static toRwsets(nsRwsets: any[]) {
		const nsRwsetList: NsRwSet[] = [];
		const len = nsRwsets.length;

		for (let i=0; i< len; i++) {
			const nsRwset = RwSetParser.toNsRwSet(nsRwsets[i]);
			nsRwsetList.push(nsRwset);
		}

		return nsRwsetList;
	}
}