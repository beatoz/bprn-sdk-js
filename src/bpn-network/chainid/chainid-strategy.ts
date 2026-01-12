/** @format */

import { ChainId } from "./chainid"

export interface ChainIdStrategy {
	chainId(): Promise<ChainId>
}
