import { describe, it, expect } from 'vitest'
import { isPrivateIp, isSafeUrl } from '@/app/api/admin/prospect-enrich-team-from-website/route'

describe('isPrivateIp', () => {
  it('rejects loopback 127.0.0.0/8', () => {
    expect(isPrivateIp('127.0.0.1')).toBe(true)
    expect(isPrivateIp('127.255.255.254')).toBe(true)
  })

  it('rejects RFC1918 ranges', () => {
    expect(isPrivateIp('10.0.0.1')).toBe(true)
    expect(isPrivateIp('10.255.255.255')).toBe(true)
    expect(isPrivateIp('172.16.0.1')).toBe(true)
    expect(isPrivateIp('172.31.255.255')).toBe(true)
    expect(isPrivateIp('192.168.1.1')).toBe(true)
  })

  it('allows the 172.x neighbours outside /12', () => {
    expect(isPrivateIp('172.15.0.1')).toBe(false)
    expect(isPrivateIp('172.32.0.1')).toBe(false)
  })

  it('rejects link-local / cloud metadata 169.254.0.0/16', () => {
    expect(isPrivateIp('169.254.169.254')).toBe(true)
    expect(isPrivateIp('169.254.0.1')).toBe(true)
  })

  it('rejects 0.0.0.0/8', () => {
    expect(isPrivateIp('0.0.0.0')).toBe(true)
  })

  it('allows public IPv4', () => {
    expect(isPrivateIp('1.1.1.1')).toBe(false)
    expect(isPrivateIp('8.8.8.8')).toBe(false)
    expect(isPrivateIp('203.0.113.10')).toBe(false)
  })

  it('rejects IPv6 loopback / unspecified', () => {
    expect(isPrivateIp('::1')).toBe(true)
    expect(isPrivateIp('::')).toBe(true)
  })

  it('rejects IPv6 ULA fc00::/7 and link-local fe80::/10', () => {
    expect(isPrivateIp('fc00::1')).toBe(true)
    expect(isPrivateIp('fd12:3456:789a::1')).toBe(true)
    expect(isPrivateIp('fe80::1')).toBe(true)
  })

  it('rejects IPv4-mapped IPv6 wrapping private ranges', () => {
    expect(isPrivateIp('::ffff:10.0.0.1')).toBe(true)
    expect(isPrivateIp('::ffff:127.0.0.1')).toBe(true)
    expect(isPrivateIp('::ffff:192.168.0.1')).toBe(true)
  })

  it('allows public IPv6', () => {
    expect(isPrivateIp('2606:4700:4700::1111')).toBe(false)
  })

  it('rejects garbage input', () => {
    expect(isPrivateIp('not-an-ip')).toBe(true)
    expect(isPrivateIp('')).toBe(true)
  })
})

describe('isSafeUrl', () => {
  it('rejects non-http(s) schemes', async () => {
    expect(await isSafeUrl(new URL('ftp://example.com/'))).toBe(false)
    expect(await isSafeUrl(new URL('file:///etc/passwd'))).toBe(false)
    expect(await isSafeUrl(new URL('gopher://example.com/'))).toBe(false)
  })

  it('rejects IP-literal hosts in private ranges (no DNS needed)', async () => {
    expect(await isSafeUrl(new URL('http://127.0.0.1/team'))).toBe(false)
    expect(await isSafeUrl(new URL('http://169.254.169.254/latest/meta-data/'))).toBe(false)
    expect(await isSafeUrl(new URL('http://10.0.0.5/'))).toBe(false)
    expect(await isSafeUrl(new URL('http://[::1]/'))).toBe(false)
  })

  it('allows public IP-literal hosts', async () => {
    expect(await isSafeUrl(new URL('https://1.1.1.1/'))).toBe(true)
  })
})
