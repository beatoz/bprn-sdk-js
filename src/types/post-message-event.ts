/** @format */
import { decodeFromBase64 } from "../utils/utils"

export class PostMessageEvent {
	constructor(
		public srcChainId: string,
		public srcDAppAddr: string,
		public srcAccount: string,
		public dstChainId: string,
		public dstDAppAddr: string,
		public dstAccount: string,
		public midx: string,
		public message: string
	) {
	}

	static fromJson(jsonStr: string): PostMessageEvent {
		const parsed = JSON.parse(jsonStr);
		const messageDecoded = decodeFromBase64(parsed.message);

		return new PostMessageEvent(
			parsed.srcChainId,
			parsed.srcDAppAddr,
			parsed.srcAccount,
			parsed.dstChainId,
			parsed.dstDAppAddr,
			parsed.dstAccount,
			parsed.midx,
			messageDecoded.toString('hex')
		);
	}
}