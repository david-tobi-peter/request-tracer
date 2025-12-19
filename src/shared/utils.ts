import { TimingMs } from "./types";

export function toMs(delta: bigint): TimingMs {
  return Number(delta) / 1_000_000;
}