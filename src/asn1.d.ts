/** @format */
declare module 'asn1.js' {
  export interface EncoderConstructor {
    new (): Encoder;
  }

  export interface Encoder {
    encode(data: any, reporter?: string): Buffer;
    decode(data: Buffer, reporter?: string): any;
  }

  export interface EntityNode {
    seq(): this;
    seqof(type: any): this;
    set(): this;
    setof(type: any): this;
    obj(...args: any[]): this;
    key(name: string): this;
    optional(): this;
    explicit(tag: number): this;
    implicit(tag: number): this;
    use(entity: any): this;
    choice(obj: any): this;
    any(): this;
    bool(): this;
    int(): this;
    bitstr(): this;
    octstr(): this;
    null_(): this;
    objid(): this;
    gentime(): this;
    utctime(): this;
  }

  export function define(name: string, body: (this: EntityNode) => void): Encoder;

  export const bignum: any;
  export const base: any;
  export const constants: any;
  export const decoders: any;
  export const encoders: any;
}
