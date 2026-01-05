/** @format */

import * as fs from "fs"
import * as path from "path"
import { UserInfo } from "./user-info"

import { BpnDirInfo } from "../bpn-dir-info"

export class UserInfoFactory {
	private readonly networkDirInfo: BpnDirInfo

	constructor(networkDirInfo: BpnDirInfo) {
		this.networkDirInfo = networkDirInfo
	}

	public createAllUserInfo(): UserInfo[] {
		const userInfoList: UserInfo[] = []
		const peerOrgsDir = path.join(this.networkDirInfo.cryptoConfigDir(), "peerOrganizations")

		if (!fs.existsSync(peerOrgsDir)) {
			return userInfoList
		}

		const orgDirs = fs
			.readdirSync(peerOrgsDir, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name)

		for (const orgDomain of orgDirs) {
			const usersDir = path.join(peerOrgsDir, orgDomain, "users")
			if (!fs.existsSync(usersDir)) {
				continue
			}

			const userDirs = fs
				.readdirSync(usersDir, { withFileTypes: true })
				.filter((dirent) => dirent.isDirectory())
				.map((dirent) => dirent.name)

			for (const userId of userDirs) {
				const userInfo = this.createUserInfo(orgDomain, userId)
				if (userInfo) {
					userInfoList.push(userInfo)
				}
			}
		}

		return userInfoList
	}

	public createUserInfo(orgDomain: string, userId: string): UserInfo | undefined {
		const userDir = path.join(this.networkDirInfo.cryptoConfigDir(), "peerOrganizations", orgDomain, "users", userId)

		if (!fs.existsSync(userDir)) {
			return undefined
		}

		const mspDir = path.join(userDir, "msp")
		const tlsDir = path.join(userDir, "tls")

		if (!fs.existsSync(mspDir) || !fs.existsSync(tlsDir)) {
			return undefined
		}

		return new UserInfo(userId, orgDomain, mspDir, tlsDir)
	}

	public findUsersByOrganization(orgDomain: string): UserInfo[] {
		const userInfoList: UserInfo[] = []
		const usersDir = path.join(this.networkDirInfo.cryptoConfigDir(), "peerOrganizations", orgDomain, "users")

		if (!fs.existsSync(usersDir)) {
			return userInfoList
		}

		const userDirs = fs
			.readdirSync(usersDir, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name)

		for (const userId of userDirs) {
			const userInfo = this.createUserInfo(orgDomain, userId)
			if (userInfo) {
				userInfoList.push(userInfo)
			}
		}

		return userInfoList
	}

	public findAdminUser(orgDomain: string): UserInfo | undefined {
		const users = this.findUsersByOrganization(orgDomain)
		return users.find((user) => user.userId.startsWith("Admin@"))
	}
}
