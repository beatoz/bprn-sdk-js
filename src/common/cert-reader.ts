import fs from "fs";
import crypto from "crypto";

export class CertReader {
    readDerHex(certPath: string): string {
        const certPem = fs.readFileSync(certPath, "utf-8");
        return "0x" + Buffer.from(new crypto.X509Certificate(certPem).raw).toString("hex");
    }

    readPrivateKey(keyPath: string) {
        return fs.readFileSync(keyPath, "utf-8");
    }
}