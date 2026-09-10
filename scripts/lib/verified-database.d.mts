export function withVerifiedRows<T extends { name: string; rows: Record<string, string>[] }>(source: T, verified: unknown): T;
