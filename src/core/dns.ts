import { DNSResult, IPFamily, measureTime } from "@/shared";
import dns from "dns/promises";

export class DNSResolver {
  async resolve(hostname: string): Promise<DNSResult> {
    try {
      const { result: lookupAddress, timeMs } = await measureTime(() => dns.lookup(hostname));

      return {
        time: timeMs,
        address: lookupAddress.address,
        family: this.mapIPFamily(lookupAddress.family),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`DNS resolution failed: ${message}`);
    }
  }

  private mapIPFamily(family: number): IPFamily {
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