/** @format */

// import {ethers} from "ethers";
// import {parseEther} from "ethers/src.ts/utils/units";
//
// export class Balance {
//   readonly balance: string
//
//   constructor(fonsBalance: string, readonly decimal: number = 18) {
//     this.balance = fonsBalance
//   }
//
//   static fromBtz(btzBalance: string, decimals: number = 18) {
//     const wei = ethers.parseEther(btzBalance)
//     return new Balance(
//       wei.toString(),
//       decimals
//     );
//   }
//
//   static fromFons(balance: string, decimals: number = 18) {
//     const divisor = BigInt(10) ** BigInt(decimals);
//     const fons = BigInt(balance);
//     const integer = fons / divisor;
//     const remainder = fons % divisor;
//
//     if (remainder === BigInt(0)) {
//       return new Balance(integer.toString());
//     } else {
//       const remainderStr = remainder.toString().padStart(decimals, '0');
//       const trimmed = remainderStr.replace(/0+$/, '');
//       return new Balance(`${integer}.${trimmed}`);
//     }
//   }
//
//   toBtz(decimalPlaces?: number): string {
//     const btz = ethers.formatEther(this.balance);
//     if (decimalPlaces === undefined) {
//       return btz;
//     }
//
//     const [integer, decimal = ''] = btz.split('.');
//
//     if (decimalPlaces === 0) {
//       return integer;
//     }
//
//     const truncated = decimal.slice(0, decimalPlaces).padEnd(decimalPlaces, '0');
//     return `${integer}.${truncated}`;
//   }
//
//   toFons(): string {
//     return this.balance
//   }
// }
//
// function main() {
//   const balance1 = "1000000000000000000"
//   const balance2 = "1234567890000000000"
//
//   const b1 = new Balance(balance2)
//   const b2 = b1.toBtz(4)
//
//   const b3 = Balance.fromBtz(b2)
//   const b4= b3.toBtz(4)
//
//   //const btz1 = ethers.formatUnits(balance2, 'wei')
//   //const btz1 = ethers.formatEther(b2)
//   const btz2 = ethers.parseEther(b2)
//   const btz3 = ethers.formatUnits(b2, 'wei')
//
// }
//
// main()
