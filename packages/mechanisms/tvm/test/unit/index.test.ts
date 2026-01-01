import { describe, it, expect } from 'vitest'
import {
  ExactTvmScheme,
  validateTvmAddress,
  normalizeNetwork,
  getUsdcAddress,
  getUsdtAddress,
  convertToTokenAmount,
  convertFromTokenAmount,
  TVM_ADDRESS_REGEX,
  EVERSCALE_MAINNET_CAIP2,
  EVERSCALE_DEVNET_CAIP2,
  EVERSCALE_FLD_CAIP2,
  USDC_MAINNET_ADDRESS,
  USDC_DEVNET_ADDRESS,
  USDT_MAINNET_ADDRESS,
  isExpired,
  getCurrentTimestamp,
} from '../../src/index'
import { ExactTvmScheme as ServerExactTvmScheme } from '../../src/exact/server/scheme'

describe('@x402/tvm', () => {
  it('should export main classes', () => {
    expect(ExactTvmScheme).toBeDefined()
  })

  describe('validateTvmAddress', () => {
    it('should validate correct Everscale addresses', () => {
      expect(validateTvmAddress(USDC_MAINNET_ADDRESS)).toBe(true)
      expect(validateTvmAddress(USDT_MAINNET_ADDRESS)).toBe(true)
      expect(
        validateTvmAddress('0:a519f99bb5d6d51ef958ed24d337ad75a1c770885dcd42d51d6663f9fcdacfb2'),
      ).toBe(true)
    })

    it('should reject invalid addresses', () => {
      expect(validateTvmAddress('')).toBe(false)
      expect(validateTvmAddress('invalid')).toBe(false)
      expect(validateTvmAddress('0x1234567890abcdef')).toBe(false)
      expect(validateTvmAddress('too-short')).toBe(false)
    })

    it('should reject addresses with wrong format', () => {
      expect(validateTvmAddress('1:abc123')).toBe(false) // Wrong prefix
      expect(validateTvmAddress('0:xyz')).toBe(false) // Too short
      expect(validateTvmAddress('0:12345')).toBe(false) // Not 64 hex chars
    })

    it('should reject addresses with invalid characters', () => {
      expect(
        validateTvmAddress('0:g519f99bb5d6d51ef958ed24d337ad75a1c770885dcd42d51d6663f9fcdacfb2'),
      ).toBe(false) // 'g' not valid hex
      expect(
        validateTvmAddress('0:a519f99bb5d6d51ef958ed24d337ad75a1c770885dcd42d51d6663f9fcdacfb!'),
      ).toBe(false) // '!' not valid
    })
  })

  describe('normalizeNetwork', () => {
    it('should return CAIP-2 format as-is', () => {
      expect(normalizeNetwork(EVERSCALE_MAINNET_CAIP2)).toBe(EVERSCALE_MAINNET_CAIP2)
      expect(normalizeNetwork(EVERSCALE_DEVNET_CAIP2)).toBe(EVERSCALE_DEVNET_CAIP2)
      expect(normalizeNetwork(EVERSCALE_FLD_CAIP2)).toBe(EVERSCALE_FLD_CAIP2)
    })

    it('should convert V1 network names to CAIP-2', () => {
      expect(normalizeNetwork('everscale' as never)).toBe(EVERSCALE_MAINNET_CAIP2)
      expect(normalizeNetwork('everscale-devnet' as never)).toBe(EVERSCALE_DEVNET_CAIP2)
      expect(normalizeNetwork('everscale-fld' as never)).toBe(EVERSCALE_FLD_CAIP2)
    })

    it('should throw for unsupported networks', () => {
      expect(() => normalizeNetwork('tvm:unknown' as never)).toThrow('Unsupported TVM network')
      expect(() => normalizeNetwork('ethereum:1' as never)).toThrow('Unsupported TVM network')
      expect(() => normalizeNetwork('unknown-network' as never)).toThrow('Unsupported TVM network')
    })
  })

  describe('getUsdcAddress', () => {
    it('should return mainnet USDC address', () => {
      expect(getUsdcAddress(EVERSCALE_MAINNET_CAIP2)).toBe(USDC_MAINNET_ADDRESS)
    })

    it('should return devnet USDC address', () => {
      expect(getUsdcAddress(EVERSCALE_DEVNET_CAIP2)).toBe(USDC_DEVNET_ADDRESS)
    })

    it('should throw for unsupported networks', () => {
      expect(() => getUsdcAddress('tvm:unknown' as never)).toThrow('Unsupported TVM network')
    })
  })

  describe('getUsdtAddress', () => {
    it('should return mainnet USDT address', () => {
      expect(getUsdtAddress(EVERSCALE_MAINNET_CAIP2)).toBe(USDT_MAINNET_ADDRESS)
    })

    it('should throw for unsupported networks', () => {
      expect(() => getUsdtAddress('tvm:unknown' as never)).toThrow('Unsupported TVM network')
    })
  })

  describe('convertToTokenAmount', () => {
    it('should convert decimal amounts to token units (6 decimals)', () => {
      expect(convertToTokenAmount('4.02', 6)).toBe('4020000')
      expect(convertToTokenAmount('0.10', 6)).toBe('100000')
      expect(convertToTokenAmount('1.00', 6)).toBe('1000000')
      expect(convertToTokenAmount('0.01', 6)).toBe('10000')
      expect(convertToTokenAmount('123.456789', 6)).toBe('123456789')
    })

    it('should handle whole numbers', () => {
      expect(convertToTokenAmount('1', 6)).toBe('1000000')
      expect(convertToTokenAmount('100', 6)).toBe('100000000')
    })

    it('should handle different decimals', () => {
      expect(convertToTokenAmount('1', 9)).toBe('1000000000') // 9 decimals like EVER
      expect(convertToTokenAmount('1', 2)).toBe('100')
      expect(convertToTokenAmount('1', 0)).toBe('1')
    })

    it('should throw for invalid amounts', () => {
      expect(() => convertToTokenAmount('abc', 6)).toThrow('Invalid amount')
      expect(() => convertToTokenAmount('', 6)).toThrow('Invalid amount')
      expect(() => convertToTokenAmount('NaN', 6)).toThrow('Invalid amount')
    })
  })

  describe('convertFromTokenAmount', () => {
    it('should convert token units to decimal amounts', () => {
      expect(convertFromTokenAmount('4020000', 6)).toBe('4.02')
      expect(convertFromTokenAmount('100000', 6)).toBe('0.1')
      expect(convertFromTokenAmount('1000000', 6)).toBe('1')
      expect(convertFromTokenAmount('10000', 6)).toBe('0.01')
    })

    it('should handle whole numbers', () => {
      expect(convertFromTokenAmount('1000000', 6)).toBe('1')
      expect(convertFromTokenAmount('100000000', 6)).toBe('100')
    })

    it('should handle different decimals', () => {
      expect(convertFromTokenAmount('1000000000', 9)).toBe('1')
      expect(convertFromTokenAmount('100', 2)).toBe('1')
    })
  })

  describe('isExpired', () => {
    it('should return false for future timestamps', () => {
      const futureTimestamp = getCurrentTimestamp() + 3600 // 1 hour from now
      expect(isExpired(futureTimestamp)).toBe(false)
    })

    it('should return true for past timestamps', () => {
      const pastTimestamp = getCurrentTimestamp() - 3600 // 1 hour ago
      expect(isExpired(pastTimestamp)).toBe(true)
    })

    it('should return true for current timestamp', () => {
      const currentTimestamp = getCurrentTimestamp()
      expect(isExpired(currentTimestamp)).toBe(true)
    })
  })

  describe('ExactTvmScheme (Server)', () => {
    const server = new ServerExactTvmScheme()

    describe('parsePrice', () => {
      it('should parse dollar string prices', async () => {
        const result = await server.parsePrice('$0.1', EVERSCALE_MAINNET_CAIP2)
        expect(result.amount).toBe('100000') // 0.1 USDC = 100000 smallest units
        expect(result.asset).toBe(USDC_MAINNET_ADDRESS)
      })

      it('should parse simple number string prices', async () => {
        const result = await server.parsePrice('0.10', EVERSCALE_MAINNET_CAIP2)
        expect(result.amount).toBe('100000')
        expect(result.asset).toBe(USDC_MAINNET_ADDRESS)
      })

      it('should parse number prices', async () => {
        const result = await server.parsePrice(0.1, EVERSCALE_MAINNET_CAIP2)
        expect(result.amount).toBe('100000')
        expect(result.asset).toBe(USDC_MAINNET_ADDRESS)
      })

      it('should use devnet USDC for devnet network', async () => {
        const result = await server.parsePrice('1.00', EVERSCALE_DEVNET_CAIP2)
        expect(result.amount).toBe('1000000')
        expect(result.asset).toBe(USDC_DEVNET_ADDRESS)
      })

      it('should handle pre-parsed price objects', async () => {
        const result = await server.parsePrice(
          { amount: '123456', asset: '0:custom_token_address', extra: {} },
          EVERSCALE_MAINNET_CAIP2,
        )
        expect(result.amount).toBe('123456')
        expect(result.asset).toBe('0:custom_token_address')
      })

      it('should throw for invalid price formats', async () => {
        await expect(
          async () => await server.parsePrice('not-a-price!', EVERSCALE_MAINNET_CAIP2),
        ).rejects.toThrow('Invalid money format')
      })

      it('should throw for price objects without asset', async () => {
        await expect(
          async () =>
            await server.parsePrice({ amount: '123456' } as never, EVERSCALE_MAINNET_CAIP2),
        ).rejects.toThrow('Asset address must be specified')
      })

      it('should avoid floating-point rounding error', async () => {
        const result = await server.parsePrice('$4.02', EVERSCALE_DEVNET_CAIP2)
        expect(result.amount).toBe('4020000') // 4.02 USDC
      })
    })

    describe('enhancePaymentRequirements', () => {
      it('should pass through payment requirements with extra', async () => {
        const requirements = {
          scheme: 'exact',
          network: EVERSCALE_MAINNET_CAIP2,
          asset: USDC_MAINNET_ADDRESS,
          amount: '100000',
          payTo: '0:abc123...',
          maxTimeoutSeconds: 3600,
        }

        const result = await server.enhancePaymentRequirements(
          requirements as never,
          {
            x402Version: 2,
            scheme: 'exact',
            network: EVERSCALE_MAINNET_CAIP2,
            extra: { customData: 'value' },
          },
          [],
        )

        expect(result).toEqual({
          ...requirements,
          extra: { customData: 'value' },
        })
      })
    })

    describe('registerMoneyParser', () => {
      it('should use custom money parser when registered', async () => {
        const customServer = new ServerExactTvmScheme()
        customServer.registerMoneyParser(async (amount, _network) => {
          if (amount === 42) {
            return {
              amount: '42000000',
              asset: '0:custom_token',
              extra: { custom: true },
            }
          }
          return null
        })

        const result = await customServer.parsePrice(42, EVERSCALE_MAINNET_CAIP2)
        expect(result.amount).toBe('42000000')
        expect(result.asset).toBe('0:custom_token')
        expect(result.extra).toEqual({ custom: true })
      })

      it('should fallback to default when custom parser returns null', async () => {
        const customServer = new ServerExactTvmScheme()
        customServer.registerMoneyParser(async () => null)

        const result = await customServer.parsePrice(0.1, EVERSCALE_MAINNET_CAIP2)
        expect(result.amount).toBe('100000')
        expect(result.asset).toBe(USDC_MAINNET_ADDRESS)
      })
    })
  })

  describe('Constants', () => {
    it('should export correct USDC addresses', () => {
      expect(USDC_MAINNET_ADDRESS).toBe(
        '0:c37b3fafca5bf7d3704b081fde7df54f298736ee059bf6d32fac25f5e6085bf6',
      )
    })

    it('should export correct USDT addresses', () => {
      expect(USDT_MAINNET_ADDRESS).toBe(
        '0:a519f99bb5d6d51ef958ed24d337ad75a1c770885dcd42d51d6663f9fcdacfb2',
      )
    })

    it('should have valid address regex', () => {
      expect(TVM_ADDRESS_REGEX).toBeInstanceOf(RegExp)
      expect(TVM_ADDRESS_REGEX.test(USDC_MAINNET_ADDRESS)).toBe(true)
      expect(TVM_ADDRESS_REGEX.test(USDT_MAINNET_ADDRESS)).toBe(true)
    })

    it('should have correct network identifiers', () => {
      expect(EVERSCALE_MAINNET_CAIP2).toBe('tvm:5e994fcf4d425c0a6ce6a792594b7173')
      expect(EVERSCALE_DEVNET_CAIP2).toBe('tvm:45e3c9d78e26bf97a9b6b1ec12acf8a6')
      expect(EVERSCALE_FLD_CAIP2).toBe('tvm:f7a2d8e9b1c3a4f5e6d7c8b9a0f1e2d3')
    })
  })

  // Integration tests would require mocking TonClient and message signing
  describe('Integration (placeholder)', () => {
    it.todo('should create a valid payment payload with ExactTvmScheme')
    it.todo('should verify a valid payment with ExactTvmScheme')
    it.todo('should reject invalid signatures')
    it.todo('should reject insufficient amounts')
    it.todo('should reject wrong recipients')
    it.todo('should reject expired messages')
    it.todo('should settle valid payments')
    it.todo('should handle TIP-3 token transfers')
    it.todo('should derive token wallet addresses correctly')
  })
})
