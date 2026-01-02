import { IDNSResult, IPFamilyType } from "../shared/types.js";
import { measureTime } from "../shared/utils.js";
import dns from "dns/promises";

export class DNSResolver {
  async resolve(hostname: string): Promise<IDNSResult> {
    try {
      const { result: lookupAddress, timeMs } = await measureTime(() => dns.lookup(hostname));

      return {
        time: timeMs,
        address: lookupAddress.address,
        family: this.mapIPFamilyType(lookupAddress.family),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`DNS resolution failed: ${message}`);
    }
  }

  private mapIPFamilyType(family: number): IPFamilyType {
    switch (family) {
      case 4: {
        return "ipv4";
      }

      case 6: {
        return "ipv6";
      }

      default: {
        throw new Error(`Unknown IP family: ${family}`);
      }
    }
  }
}