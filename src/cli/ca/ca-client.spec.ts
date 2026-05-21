import path from "node:path"
import { CaClient } from "./ca-client"
import { CaClientConfig } from "./ca-client-config"

describe("ca-client", () => {
	const caNetworkDir = path.join(process.cwd(), "config", "bprn", "ca-server")
	const binDir = path.join(caNetworkDir, "bin")

	const rootCaConfig: CaClientConfig = {
		caName: "root-ca",
		caUrl: "root-ca:7050",
		adminUser: "admin",
		adminPassword: "adminpw",
		binDir,
		tlsEnabled: true,
	}

	test.skip("Register intermediate CA (orderer-ca) on Root CA", async () => {
		const client = new CaClient(rootCaConfig)

		// Root CA에 intermediate CA용 ID 등록
		const result = await client.registerIntermediateCA("orderer-ca", "orderercapw")

		expect(result.success).toBe(true)
		expect(result.password).toBe("orderercapw")
	})

	test.skip("Register intermediate CA using register method", async () => {
		const client = new CaClient(rootCaConfig)

		// register 메서드로 직접 등록 (hf.IntermediateCA 속성 명시)
		const result = await client.register({
			name: "peer-ca",
			secret: "peercapw",
			type: "client",
			attrs: { "hf.IntermediateCA": true },
		})

		expect(result.success).toBe(true)
	})
})