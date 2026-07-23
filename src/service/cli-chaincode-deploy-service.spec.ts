/** @format */

import { UserInfo } from "../bpn-network"
import { CliChaincodeDeployer, PackagingMode } from "../cli"
import { CliChaincodeDeployService } from "./cli-chaincode-deploy-service"

describe("CliChaincodeDeployService shared package API", () => {
	it("creates one named package artifact independently of logical chaincode names", () => {
		const packageChaincode = jest.fn()
		const calculatePackageId = jest.fn().mockReturnValue("btip34-v3:abcdef")
		const deployer = {
			package: packageChaincode,
			calculatePackageId,
		} as unknown as CliChaincodeDeployer
		const user = new UserInfo("Admin", "org1.example.com", "/crypto/admin/msp", "/crypto/admin/tls")
		const service = new CliChaincodeDeployService(deployer, user, "/chaincodes/btip34", "/runtime/packages")

		const result = service.createPackage({ packageLabel: "btip34-v3" })

		expect(result).toEqual({
			packageFile: "/runtime/packages/btip34-v3.tar.gz",
			packageId: "btip34-v3:abcdef",
			label: "btip34-v3",
		})
		expect(packageChaincode.mock.calls[0][0]).toMatchObject({
			name: "btip34-v3",
			label: "btip34-v3",
			packageFilePath: "/runtime/packages/btip34-v3.tar.gz",
			chaincodeSourceDir: "/chaincodes/btip34",
		})
		expect(packageChaincode).toHaveBeenCalledWith(expect.anything(), PackagingMode.PeerCli)
		expect(calculatePackageId).toHaveBeenCalledWith("/runtime/packages/btip34-v3.tar.gz")
	})

	it("passes an installed package ID to a new logical definition", () => {
		const deployDefinition = jest.fn().mockReturnValue({ commitResult: "committed" })
		const deployer = { deployDefinition } as unknown as CliChaincodeDeployer
		const user = new UserInfo("Admin", "org1.example.com", "/crypto/admin/msp", "/crypto/admin/tls")
		const service = new CliChaincodeDeployService(deployer, user, "/chaincodes/btip34", "/packages")

		const result = service.deployDefinition({
			channelName: "bprn-testnet0",
			chaincodeName: "stablecoin-luna-LUNA-v2",
			packageId: "btip34-v3:abcdef",
			version: 3,
			sequence: 3,
			initRequired: true,
		})

		expect(result).toEqual({ commitResult: "committed" })
		expect(deployDefinition).toHaveBeenCalledWith(
			{
				channelName: "bprn-testnet0",
				name: "stablecoin-luna-LUNA-v2",
				packageId: "btip34-v3:abcdef",
				version: 3,
				sequence: 3,
				initRequired: true,
			},
			"/crypto/admin/msp"
		)
	})
})
