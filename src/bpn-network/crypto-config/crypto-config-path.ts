import * as Path from "node:path";

export class CryptoConfigPath {
    readonly cryptoConfigPath: string
    readonly ordererOrgPath: string
    readonly peerOrgPath: string

    constructor(
        readonly absoluteCryptoConfigDirPath: string,
    ) {
        this.cryptoConfigPath = this.absoluteCryptoConfigDirPath
        this.ordererOrgPath = Path.join(this.cryptoConfigPath, "ordererOrganizations")
        this.peerOrgPath = Path.join(this.cryptoConfigPath, "peerOrganizations")
    }

    endorserPrivateKeyPath(ordNum: number) {
        return `${this.peerOrgPath}/org${ordNum}.bc/peers/peer0.org${ordNum}.bc/msp/keystore/priv_sk`
    }

    ordererPrivateKeyPath() {
        return `${this.ordererOrgPath}/ordererorg.bc/orderers/orderer0.ordererorg.bc/msp/keystore/priv_sk`
    }

    ordererCertPath() {
        return `${this.ordererOrgPath}/ordererorg.bc/orderers/orderer0.ordererorg.bc/msp/signcerts/cert.pem`
    }

    endorserCertPath(orgNum: number) {
        return `${this.peerOrgPath}/org${orgNum}.bc/peers/peer0.org${orgNum}.bc/msp/signcerts/cert.pem`
    }

    ordererRootCaCertPath() {
        return `${this.ordererOrgPath}/ordererorg.bc/ca/ca.ordererorg.bc-cert.pem`
    }

    peerRootCaCertPath() {
        return `${this.peerOrgPath}/org1.bc/ca/ca.org1.bc-cert.pem`
    }
}