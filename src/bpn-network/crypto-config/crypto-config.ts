import {CryptoConfigPath} from "./crypto-config-path";
import { CertReader } from "../../common"

export class CryptoConfig {
    readonly certReader = new CertReader()
    readonly cryptoConfigPath: CryptoConfigPath

    constructor(absoluteCryptoConfigDirPath: string) {
        this.cryptoConfigPath = new CryptoConfigPath(absoluteCryptoConfigDirPath)
    }

    endorserPrivateKey(ordNum: number) {
        return this.certReader.readPrivateKey(this.cryptoConfigPath.endorserPrivateKeyPath(ordNum));
    }

    ordererPrivateKey() {
        return this.certReader.readPrivateKey(this.cryptoConfigPath.ordererPrivateKeyPath());
    }

    ordererCert() {
        return this.certReader.readDerHex(this.cryptoConfigPath.ordererCertPath());
    }

    endorserCert(orgNum: number) {
        return this.certReader.readDerHex(this.cryptoConfigPath.endorserCertPath(orgNum));
    }

    ordererRootCaCert() {
        return this.certReader.readDerHex(this.cryptoConfigPath.ordererRootCaCertPath());
    }

    peerRootCaCert() {
        return this.certReader.readDerHex(this.cryptoConfigPath.peerRootCaCertPath());
    }
}