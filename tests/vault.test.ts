import { Vault, VaultInterface } from '../src/vault'
import { nanoid } from 'nanoid'
import fs from 'fs-extra'
import aes from '@swiftyapp/aes-256-gcm'

jest.mock('nanoid')
jest.spyOn(fs, 'ensureFileSync')
jest.spyOn(fs, 'writeFileSync')
jest.spyOn(fs, 'readFileSync')
jest.spyOn(aes, 'decrypt')
jest.useFakeTimers().setSystemTime(new Date('2022-01-01').getTime())

const nanoidMock = nanoid as jest.Mock
const writeFileSyncMock = fs.writeFileSync as jest.Mock
const ensureFileSyncMock = fs.ensureFileSync as jest.Mock
const readFileSyncMock = fs.readFileSync as jest.Mock

nanoidMock.mockReturnValue('123')

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
      expect(vault.deleted).toEqual([])
      expect(vault.createdAt).toEqual(1640995200000)
      expect(vault.updatedAt).toEqual(1640995200000)
    })

    it('creates vault file if it does not exist', () => {
      expect(ensureFileSyncMock).toHaveBeenCalledWith(filePath)
    })

    it('saves vault into a file', () => {
      expect(writeFileSyncMock).toHaveBeenCalled()
      const call = writeFileSyncMock.mock.calls[0]

      expect(call[0]).toEqual(filePath)
      expect(call[1] instanceof Buffer).toBeTruthy()
      expect(call[2]).toEqual({ encoding: 'binary' })
    })

    it('serializes to a json string', () => {
      expect(vault.serialize()).toEqual(
        '{"id":"123","name":"Personal","contents":[],"deleted":[],"createdAt":1640995200000,"updatedAt":1640995200000}'
      )
    })
  })

  describe('.load', () => {
    beforeEach(() => {
      vault = Vault.load('.temp', '123', 'password')
    })

    it('loads a vault', () => {
      expect(vault.id).toEqual('123')
      expect(vault.name).toEqual('Personal')
      expect(vault.filePath).toEqual(filePath)
      expect(vault.contents).toEqual([])
      expect(vault.createdAt).toEqual(1640995200000)
      expect(vault.updatedAt).toEqual(1640995200000)
    })

    it('loads vault from a file', () => {
      expect(readFileSyncMock).toHaveBeenCalledWith(filePath)
    })

    it('decrypts vault from a file', () => {
      expect(aes.decrypt).toHaveBeenCalled()
      const call = aes.decrypt.mock.calls[0]

      expect(call[0]).toMatch(/^[0-9a-f]+$/)
      expect(call[1]).toEqual('password')
    })

    it('serializes to a json string', () => {
      expect(vault.serialize()).toEqual(
        '{"id":"123","name":"Personal","contents":[],"deleted":[],"createdAt":1640995200000,"updatedAt":1640995200000}'
      )
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

  describe('#merge', () => {
    let localVault: Vault, remoteVault: Vault

    beforeEach(() => {
      localVault = new Vault(JSON.parse(fs.readFileSync('./tests/fixtures/local.json').toString()))
      remoteVault = JSON.parse(fs.readFileSync('./tests/fixtures/remote.json').toString())
    })

    describe('more recent update', () => {
      it('merges contents of vaults', () => {
        localVault.merge(remoteVault, 'password')

        expect(localVault.contents.length).toEqual(5)
        expect(localVault.contents[0]).toMatchObject({
          id: 'BOX_1',
          type: 'login',
          title: 'Facebook',
          url: 'https://www.facebook.com/',
          username: 'john.doe',
          password: 'facebook_password',
          createdAt: 1641081600000,
          updatedAt: 1641081600000
        })
        expect(localVault.contents[1]).toMatchObject({
          id: 'BOX_2',
          type: 'login',
          title: 'Github Updated',
          url: 'https://github.com/',
          username: 'john.doe',
          password: 'github_password_updated',
          createdAt: 1641081600000,
          updatedAt: 1641081660000
        })
        expect(localVault.contents[2]).toMatchObject({
          id: 'BOX_3',
          type: 'login',
          title: 'Google Updated',
          url: 'https://www.google.com/',
          username: 'john.doe',
          password: 'google_password_updated',
          createdAt: 1641081600000,
          updatedAt: 1641081720000
        })
        expect(localVault.contents[3]).toMatchObject({
          id: 'BOX_4',
          type: 'login',
          title: 'Netflix',
          url: 'https://www.netflix.com/',
          username: 'john.doe',
          password: 'netflix_password',
          createdAt: 1641081600000,
          updatedAt: 1641081600000
        })
        expect(localVault.contents[4]).toMatchObject({
          id: 'BOX_5',
          type: 'login',
          title: 'iCloud',
          url: 'https://icloud.com/',
          username: 'john.doe',
          password: 'icloud_password',
          createdAt: 1641081600000,
          updatedAt: 1641081600000
        })
      })

      it('remembers deleted items', () => {
        localVault.merge(remoteVault, 'password')
        expect(localVault.deleted).toEqual(['BOX_6', 'BOX_7'])
      })
    })
  })
})
