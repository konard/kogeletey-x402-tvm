import { ExactTvmScheme } from './scheme'

/**
 * Create an ExactTvmScheme instance for server-side operations
 *
 * @returns ExactTvmScheme server instance
 *
 * @example
 * ```ts
 * import { createExactTvmServerScheme } from "@x402/tvm/exact/server";
 *
 * const serverScheme = createExactTvmServerScheme();
 *
 * // Parse a price
 * const assetAmount = await serverScheme.parsePrice("$0.10", "tvm:5e994fcf4d425c0a6ce6a792594b7173");
 * ```
 */
export function createExactTvmServerScheme(): ExactTvmScheme {
  return new ExactTvmScheme()
}
