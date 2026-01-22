/** @format */

import { UserInfo } from "./user-info"

export class UserInfoRepository {
	private readonly usersByOrg: Map<string, UserInfo[]>
	private readonly usersById: Map<string, UserInfo>

	constructor(users: UserInfo[]) {
		this.usersByOrg = new Map()
		this.usersById = new Map()

		for (const user of users) {
			if (!this.usersByOrg.has(user.organizationDomainName)) {
				this.usersByOrg.set(user.organizationDomainName, [])
			}
			this.usersByOrg.get(user.organizationDomainName)!.push(user)
			this.usersById.set(user.userId, user)
		}
	}

	getUsersByOrganization(organization: string): UserInfo[] {
		return this.usersByOrg.get(organization) || []
	}

	getUserById(userId: string): UserInfo | undefined {
		return this.usersById.get(userId)
	}

	getAllUserIds(): string[] {
		return Array.from(this.usersById.keys())
	}

	getAdminByOrganization(organization: string): UserInfo {
		const users = this.getUsersByOrganization(organization)
		const adminInfo = users.find((user) => user.userId.startsWith("Admin@"))
		if (!adminInfo) {
			throw new Error(`No admin found for organization ${organization}`)
		}
		return adminInfo
	}

	getRegularUsersByOrganization(organization: string): UserInfo[] {
		const users = this.getUsersByOrganization(organization)
		return users.filter((user) => user.userId.startsWith("User"))
	}
}
