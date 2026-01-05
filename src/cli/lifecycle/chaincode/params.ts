/** @format */

export class ChaincodeInfo {
	constructor(
		public channelName: string,
		public name: string,
		public version: number,
		public sequence: number,
		public chaincodeSourceDir: string,
		public packageDir: string,
		public packageId: string,
		public language: "golang" | "node" | "java" = "golang",
		public initRequired: boolean = false
	) {}

	get label(): string {
		return `${this.name}_${this.version}`
	}
}
