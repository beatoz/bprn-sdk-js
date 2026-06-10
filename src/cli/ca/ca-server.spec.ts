import path from "node:path"
import { CaServer } from "./ca-server"
import { CaServerConfig } from "./ca-server-config"

describe("ca-server", () => {
	const caNetworkDir = path.join(process.cwd(), "config", "bprn", "ca-server")
	const binDir = path.join(caNetworkDir, "bin")
	const logDir = path.join(caNetworkDir, "logs")

	test("CaServer start", async () => {
		const config = new CaServerConfig({
			caNum: 1,
			caServerDir: caNetworkDir,
			binDir,
			logDir,
		})

		const rootCaServer = new CaServer(config)
		const result = await rootCaServer.start()
		console.log(result)
		expect(result).toBe(true)
		rootCaServer.showInfo()

		//
		const config2 = new CaServerConfig({
			caNum: 2,
			caServerDir: caNetworkDir,
			binDir,
			logDir,
		})
		const caServer2 = new CaServer(config2)
		const result2 = await caServer2.start()




	})
})