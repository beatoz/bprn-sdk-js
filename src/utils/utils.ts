/** @format */

import * as fs from "fs"

export class Utils {
	static readFile(path: string): string {
		return fs.readFileSync(path, "utf8")
	}
}

export function bigIntParamToHex(value: string): string {
	try {
		return BigInt(value).toString(16)
	} catch (error) {
		throw new Error(`Invalid numeric value: ${value}`)
	}
}

export function decodeFromHex(messageHex: string): string {
	try {
		const bigIntValue = BigInt(messageHex);
		return bigIntValue.toString();
	} catch (_error) {
		return messageHex;
	}
}

export function decodeFromBase64(base64Str: string): Buffer {
	return Buffer.from(base64Str, 'base64')
}