import { Vault, VaultInterface } from '../src/vault'
import { nanoid } from 'nanoid'
import { writeFileSync, ensureFileSync, readFileSync } from 'fs-extra'
import { encrypt, decrypt } from '@swiftyapp/aes-256-gcm'

jest.mock('nanoid')
jest.mock('fs-extra')
jest.mock('@swiftyapp/aes-256-gcm')
jest.useFakeTimers().setSystemTime(new Date('2022-01-01').getTime())

describe('Vault', () => {
  let vault: VaultInterface
  const filePath = '../temp/123.swftx'
  const encrypted =
    '6fdfb2295e99f848524d0c90c33da348eb7750439d4db1f77b4575f99191d40099e55c374bbce1159d1077c9221241185a5de169d8d4ae9b9ce9e554acf10e4c7a28891551f5fdfda97e4c5c9b6424b7292437fd5d32fa45f48e133d0406ad2fddadbdc6fb39f8e159909367be24c6f7deb9'

  describe('.initialize', () => {
    beforeEach(() => {
      nanoid.mockReturnValue('123')
      encrypt.mockReturnValue(encrypted)
      vault = Vault.initialize('../temp', 'Personal', 'password')
    })

    it('creates a new vault', () => {
      expect(vault.id).toEqual('123')
      expect(vault.name).toEqual('Personal')
      expect(vault.filePath).toEqual(filePath)
      expect(vault.contents).toEqual([])
      expect(vault.createdAt).toEqual(1640995200000)
    })

    it('creates vault file if it does not exist', () => {
      expect(ensureFileSync).toHaveBeenCalledWith(filePath)
    })

    it('saves vault into a file', () => {
      expect(writeFileSync).toHaveBeenCalledWith(filePath, Buffer.from(encrypted, 'hex'), { encoding: 'binary' })
    })

    it('serializes to a json string', () => {
      expect(vault.serialize()).toEqual('{"id":"123","name":"Personal","contents":[],"createdAt":1640995200000}')
    })
  })

  describe('.load', () => {
    beforeEach(() => {
      nanoid.mockReturnValue('123')
      readFileSync.mockReturnValue(encrypted)
      decrypt.mockReturnValue('{"id":"123","name":"Personal","contents":[],"createdAt":1640995200000}')
      vault = Vault.load('../temp', '123', 'password')
    })

    it('loads a vault', () => {
      expect(vault.id).toEqual('123')
      expect(vault.name).toEqual('Personal')
      expect(vault.filePath).toEqual(filePath)
      expect(vault.contents).toEqual([])
      expect(vault.createdAt).toEqual(1640995200000)
    })

    it('loads vault from a file', () => {
      expect(readFileSync).toHaveBeenCalledWith(filePath)
    })

    it('decrypts vault from a file', () => {
      expect(decrypt).toHaveBeenCalledWith(encrypted, 'password')
    })

    it('serializes to a json string', () => {
      expect(vault.serialize()).toEqual('{"id":"123","name":"Personal","contents":[],"createdAt":1640995200000}')
    })
  })
})
