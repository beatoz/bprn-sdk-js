/** @format */

import { Account } from "../../types/account"
import type { AddressedSignatureProvider } from "../../types/signature-provider"
import { EvmTransactionParam } from "../types/evm-transaction-param"

export interface Erc20SignatureRequest {
	chaincodeName: string
	chaincodeFunction: string
	evmTxParam: EvmTransactionParam
	sigMsg: Uint8Array
}

export type Erc20Actor = Account | AddressedSignatureProvider<Erc20SignatureRequest>
