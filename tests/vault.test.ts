import { Vault, VaultInterface } from '../src/vault'
import { nanoid } from 'nanoid'
import fs from 'fs-extra'
import aes from '@swiftyapp/aes-256-gcm'

jest.mock('nanoid')
nanoid.mockReturnValue('123')

jest.spyOn(fs, 'ensureFileSync')
jest.spyOn(fs, 'writeFileSync')
jest.spyOn(fs, 'readFileSync')
jest.spyOn(aes, 'decrypt')

jest.useFakeTimers().setSystemTime(new Date('2022-01-01').getTime())

describe('Vault', () => {
  let vault: VaultInterface
  const filePath = '.temp/123.swftx'

  describe('.initialize', () => {
    beforeEach(() => {
      vault = Vault.initialize('.temp', 'Personal', 'password')
    })

    it('creates a new vault', () => {
      expect(vault.id).toEqual('123')
      expect(vault.name).toEqual('Personal')
      expect(vault.filePath).toEqual(filePath)
      expect(vault.contents).toEqual([])
      expect(vault.createdAt).toEqual(1640995200000)
    })

    it('creates vault file if it does not exist', () => {
      expect(fs.ensureFileSync).toHaveBeenCalledWith(filePath)
    })

    it('saves vault into a file', () => {
      expect(fs.writeFileSync).toHaveBeenCalled()
      const call = fs.writeFileSync.mock.calls[0]

      expect(call[0]).toEqual(filePath)
      expect(call[1] instanceof Buffer).toBeTruthy()
      expect(call[2]).toEqual({ encoding: 'binary' })
    })

    it('serializes to a json string', () => {
      expect(vault.serialize()).toEqual('{"id":"123","name":"Personal","contents":[],"createdAt":1640995200000}')
    })
  })

  describe('.load', () => {
    beforeEach(() => {
      vault = Vault.load('./.temp', '123', 'password')
    })

    it('loads a vault', () => {
      expect(vault.id).toEqual('123')
      expect(vault.name).toEqual('Personal')
      expect(vault.filePath).toEqual(filePath)
      expect(vault.contents).toEqual([])
      expect(vault.createdAt).toEqual(1640995200000)
    })

    it('loads vault from a file', () => {
      expect(fs.readFileSync).toHaveBeenCalledWith(filePath)
    })

    it('decrypts vault from a file', () => {
      expect(aes.decrypt).toHaveBeenCalled()
      const call = aes.decrypt.mock.calls[0]

      expect(call[0]).toMatch(/^[0-9a-f]+$/)
      expect(call[1]).toEqual('password')
    })

    it('serializes to a json string', () => {
      expect(vault.serialize()).toEqual('{"id":"123","name":"Personal","contents":[],"createdAt":1640995200000}')
    })
  })

  describe('#add', () => {
    beforeEach(() => {
      vault = Vault.initialize('.temp', 'Personal', 'password')
    })

    it('adds a box to the vault', () => {
      vault.add({ type: 'note', title: 'Secret' }, 'password')
      const box = vault.contents[0]

      expect(vault.contents.length).toEqual(1)
      expect(box.title).toEqual('Secret')
      expect(box.type).toEqual('note')
      expect(box.createdAt).toEqual(1640995200000)
      expect(box.updatedAt).toEqual(1640995200000)
    })
  })

  describe('#update', () => {
    beforeEach(() => {
      vault = Vault.load('.temp', '123', 'password')
      jest.useFakeTimers().setSystemTime(new Date('2022-01-02').getTime())
    })

    it('updates a box in the vault', () => {
      const updatedBox = vault.update('123', { title: 'Updated' }, 'password')

      expect(vault.contents.length).toEqual(1)
      expect(updatedBox.title).toEqual('Updated')
      expect(updatedBox.type).toEqual('note')
      expect(updatedBox.createdAt).toEqual(1640995200000)
      expect(updatedBox.updatedAt).toEqual(1641081600000)
    })
  })

  describe('#remove', () => {
    beforeEach(() => {
      vault = Vault.load('.temp', '123', 'password')
    })

    it('removes a box from the vault', () => {
      vault.remove('123', 'password')

      expect(vault.contents.length).toEqual(0)
    })
  })

  describe('#merge', () => {})
})
