/** @format */

import { NetworkInfo, OrdererInfo, PeerInfo } from "../bpn-network"
import { NodeId } from "../bpn-network/info/peer-id"
import { CliChaincodeDeployer } from "./cli-chaincode-deployer"
import { PeerCli } from "./peer-cli"

describe("CliChaincodeDeployer shared packages", () => {
	const packageFile = "/runtime/packages/btip34-v3.tar.gz"
	const packageId = "btip34-v3:0123456789abcdef"
	let executePeerCommand: jest.Mock
	let deployer: CliChaincodeDeployer

	beforeEach(() => {
		executePeerCommand = jest.fn()
		const peerCli = { executePeerCommand } as unknown as PeerCli
		const peer = new PeerInfo(
			NodeId.fromId("peer0.org1.example.com"),
			"peer0.org1.example.com:7051",
			"Org1",
			"Org1MSP",
			"/crypto/peer/msp",
			"/crypto/peer/tls",
			true
		)
		const orderer = new OrdererInfo(
			NodeId.fromId("orderer.example.com"),
			"orderer.example.com",
			"7050",
			"OrdererOrg",
			"OrdererMSP",
			"/crypto/orderer/msp",
			"/crypto/orderer/tls",
			true
		)
		deployer = new CliChaincodeDeployer(peerCli, new NetworkInfo([orderer], [peer]))
		jest.spyOn(deployer, "calculatePackageId").mockReturnValue(packageId)
	})

	it("reuses an exact package that is already installed", () => {
		executePeerCommand.mockReturnValueOnce(JSON.stringify({ installed_chaincodes: [{ package_id: packageId, label: "btip34-v3" }] }))

		const result = deployer.ensurePackageInstalled(packageFile, "/crypto/admin/msp")

		expect(result).toEqual({
			packageFile,
			packageId,
			label: "btip34-v3",
			installed: false,
		})
		expect(executePeerCommand).toHaveBeenCalledTimes(1)
		expect(executePeerCommand.mock.calls[0][0]).toBe("lifecycle chaincode queryinstalled --output json")
	})

	it("installs a missing package and verifies its package ID", () => {
		executePeerCommand
			.mockReturnValueOnce(JSON.stringify({ installed_chaincodes: [] }))
			.mockReturnValueOnce(`Chaincode code package identifier: ${packageId}\n`)

		const result = deployer.ensurePackageInstalled(packageFile, "/crypto/admin/msp")

		expect(result.installed).toBe(true)
		expect(result.packageId).toBe(packageId)
		expect(executePeerCommand.mock.calls[1][0]).toBe(`lifecycle chaincode install "${packageFile}"`)
	})

	it("rejects an install result that does not match the artifact", () => {
		executePeerCommand
			.mockReturnValueOnce(JSON.stringify({ installed_chaincodes: [] }))
			.mockReturnValueOnce("Chaincode code package identifier: btip34-v3:different\n")

		expect(() => deployer.ensurePackageInstalled(packageFile, "/crypto/admin/msp")).toThrow("Installed package ID does not match package artifact")
	})

	it("deploys a logical definition without packaging or installing code", () => {
		executePeerCommand.mockReturnValueOnce("approved").mockReturnValueOnce("ready").mockReturnValueOnce("committed")

		const result = deployer.deployDefinition(
			{
				channelName: "bprn-testnet0",
				name: "stablecoin-tom-TEST-v2",
				version: 3,
				sequence: 3,
				packageId,
				initRequired: true,
			},
			"/crypto/admin/msp"
		)

		expect(result).toMatchObject({
			name: "stablecoin-tom-TEST-v2",
			packageId,
			approvalResult: "approved",
			readinessResult: "ready",
			commitResult: "committed",
		})
		expect(executePeerCommand).toHaveBeenCalledTimes(3)
		expect(executePeerCommand.mock.calls[0][0]).toContain("approveformyorg")
		expect(executePeerCommand.mock.calls[0][0]).toContain(`--package-id ${packageId}`)
		expect(executePeerCommand.mock.calls[1][0]).toContain("checkcommitreadiness")
		expect(executePeerCommand.mock.calls[2][0]).toContain("commit")
		expect(executePeerCommand.mock.calls.flat().join(" ")).not.toContain(" chaincode package ")
		expect(executePeerCommand.mock.calls.flat().join(" ")).not.toContain(" chaincode install ")
	})

	it("reuses a matching approved and committed definition without submitting transactions", () => {
		executePeerCommand
			.mockReturnValueOnce(JSON.stringify({ sequence: 3, version: "3", init_required: true, approvals: { Org1MSP: true } }))
			.mockReturnValueOnce(
				JSON.stringify({
					sequence: 3,
					version: "3",
					init_required: true,
					source: { Type: { LocalPackage: { package_id: packageId } } },
				})
			)

		const result = deployer.ensureDefinition(
			{
				channelName: "bprn-testnet0",
				name: "stablecoin-tom-TEST-v2",
				version: 3,
				sequence: 3,
				packageId,
				initRequired: true,
			},
			"/crypto/admin/msp"
		)

		expect(result).toMatchObject({
			reused: true,
			approvalSubmitted: false,
			commitSubmitted: false,
		})
		expect(executePeerCommand).toHaveBeenCalledTimes(2)
		expect(executePeerCommand.mock.calls[0][0]).toContain("querycommitted")
		expect(executePeerCommand.mock.calls[1][0]).toContain("queryapproved")
	})

	it("approves and commits a definition that does not exist", () => {
		executePeerCommand
			.mockImplementationOnce(() => {
				throw new Error("query failed with status: 500 - namespace stablecoin-new-NEW-v2 is not defined")
			})
			.mockImplementationOnce(() => {
				throw new Error(
					"query failed with status: 500 - could not fetch approved chaincode definition (name: 'stablecoin-new-NEW-v2', sequence: '1') on channel 'bprn-testnet0'"
				)
			})
			.mockReturnValueOnce("approved")
			.mockReturnValueOnce("ready")
			.mockReturnValueOnce("committed")

		const result = deployer.ensureDefinition(
			{
				channelName: "bprn-testnet0",
				name: "stablecoin-new-NEW-v2",
				version: 1,
				sequence: 1,
				packageId,
				initRequired: true,
			},
			"/crypto/admin/msp"
		)

		expect(result).toMatchObject({
			reused: false,
			approvalSubmitted: true,
			commitSubmitted: true,
			commitResult: "committed",
		})
		expect(executePeerCommand).toHaveBeenCalledTimes(5)
	})

	it("rejects a committed definition conflict before submitting transactions", () => {
		executePeerCommand.mockReturnValueOnce(JSON.stringify({ sequence: 3, version: "2", init_required: true, approvals: { Org1MSP: true } }))

		expect(() =>
			deployer.ensureDefinition(
				{
					channelName: "bprn-testnet0",
					name: "stablecoin-tom-TEST-v2",
					version: 3,
					sequence: 3,
					packageId,
					initRequired: true,
				},
				"/crypto/admin/msp"
			)
		).toThrow("Committed chaincode definition does not match requested definition")
		expect(executePeerCommand).toHaveBeenCalledTimes(1)
	})
})
