import { DNSResult, IPFamily, toMs } from "@/shared";
import dns from "dns/promises";

export class DNSResolver {
  async resolve(hostname: string): Promise<DNSResult> {
    const start = process.hrtime.bigint();

    try {
      const result = await dns.lookup(hostname);
      const end = process.hrtime.bigint();

      return {
        time: toMs(end - start),
        address: result.address,
        family: this.mapIPFamily(result.family),
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