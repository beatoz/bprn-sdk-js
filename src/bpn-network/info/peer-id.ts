/** @format */

export class NodeId {
	// peer0.org1.bc -> name: peer0, domainName: org1.bc
	static fromId(id: string): NodeId {
		const dotIndex = id.indexOf(".")
		if (dotIndex === -1) {
			throw new Error(`Invalid peer ID format: ${id}`)
		}

		const peerName = id.substring(0, dotIndex)
		const domainName = id.substring(dotIndex + 1)

		return new NodeId(peerName, domainName)
	}

	constructor(
		public readonly peerName: string,
		public readonly domainName: string
	) {}

	toString() {
		return `${this.peerName}.${this.domainName}`
	}
}
