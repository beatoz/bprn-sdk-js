/** @format */

export function stringToUint256(s: string): bigint {
	const encoder = new TextEncoder()
	const b = encoder.encode(s)

	if (b.length > 32) {
		throw new Error(`string too long: ${b.length} bytes (max 32)`)
	}

	const buf = new Uint8Array(32)
	buf.set(b, 32 - b.length) // 오른쪽 정렬

	// Convert bytes to bigint (big-endian)
	let result = BigInt(0)
	for (let i = 0; i < buf.length; i++) {
		result = (result << BigInt(8)) | BigInt(buf[i])
	}

	return result
}

export function uint256ToString(n: bigint): string {
	// Convert bigint to 32-byte array (big-endian)
	const buf = new Uint8Array(32)
	let value = n

	for (let i = 31; i >= 0; i--) {
		buf[i] = Number(value & BigInt(0xff))
		value = value >> BigInt(8)
	}

	// Find first non-zero byte (remove left padding)
	let start = 0
	while (start < buf.length && buf[start] === 0) {
		start++
	}

	// Extract the actual data (right-aligned part)
	const data = buf.slice(start)

	// Decode UTF-8 bytes to string
	const decoder = new TextDecoder()
	return decoder.decode(data)
}
