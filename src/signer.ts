/** @format */

import { Account } from "./types/account"
import * as web3Account from "@beatoz/web3-accounts"

export class Signer {
	private readonly account: Account

	constructor(account: Account) {
		this.account = account
	}

	sign(sigMsg: Buffer) {
		const signature = web3Account.sign(sigMsg, this.account.privateKey)
		return signature
	}

	hexSign(sigMsg: Buffer) {
		return this.sign(sigMsg).toHex()
	}
}
