export function hexStringToBigInt(hexString: string): bigint {
	return BigInt(`0x${hexString}`);
}
