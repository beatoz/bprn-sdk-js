/** @format */

import { Client, ConnectionProfile } from "./connection-profile"

export class ConnectionProfileValidator {
	public validateConnectionProfile(profile: ConnectionProfile): void {
		const requiredFields = ["name", "version", "clients", "organizations", "peers"]

		for (const field of requiredFields) {
			if (!profile[field as keyof ConnectionProfile]) {
				throw new Error(`Invalid connection profile: missing required field '${field}'`)
			}
		}

		// Validate version format
		if (typeof profile.version !== "string" || !profile.version.match(/^\d+\.\d+(\.\d+)?$/)) {
			throw new Error('Connection profile version must be in semantic version format (e.g., "1.0.0")')
		}

		// Validate organizations structure
		if (typeof profile.organizations !== "object" || Object.keys(profile.organizations).length === 0) {
			throw new Error("Connection profile must contain at least one organization")
		}

		// Validate peers structure
		if (typeof profile.peers !== "object" || Object.keys(profile.peers).length === 0) {
			throw new Error("Connection profile must contain at least one peer")
		}

		if (this.isZeroClientsCount(profile.clients)) {
			throw new Error("Connection profile must contain at least one client")
		}
	}

	private isZeroClientsCount(clients: Client[]): boolean {
		return clients.length == 0
	}
}
