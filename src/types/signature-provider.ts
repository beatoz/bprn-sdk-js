/** @format */

export interface SignatureProvider<Request> {
	sign(request: Request): Promise<string>
}

export interface SignerIdentity {
	address: string
}

export type AddressedSignatureProvider<Request> = SignatureProvider<Request> & SignerIdentity
