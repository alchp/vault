import { join } from 'path'
import { keyBy } from 'lodash'
import { ensureFileSync } from 'fs-extra'
import { nanoid } from 'nanoid'
import { encrypt, decrypt } from '@swiftyapp/aes-256-gcm'

import { BoxInterface, BoxProps, Box } from './box'
import { writeEncryptedFile, readEncryptedFile } from './utils'

const EXTENSION = 'swftx'

interface VaultProps {
  id: string
  tag: string
  name: string
  filePath: string
  contents: Array<BoxInterface>
  deleted: Array<string>
  createdAt: number
  updatedAt: number
}

export interface VaultInterface extends VaultProps {
  save: (key: string) => boolean
  add: (props: BoxProps, key: string) => BoxInterface
  update: (id: string, props: object, key: string) => BoxInterface
  remove: (id: string, key: string) => void
  merge: (data: VaultInterface, key: string) => void
  serialize: () => string
}

export class Vault implements VaultInterface {
  id: string
  tag: string
  name: string
  filePath: string
  contents: Array<BoxInterface> = []
  createdAt: number
  updatedAt: number
  deleted: Array<string> = []

  constructor({ id, filePath, name, createdAt, updatedAt, contents, deleted, tag }: VaultProps) {
    this.id = id
    this.tag = tag
    this.name = name
    this.filePath = filePath
    this.contents = contents.map((item: BoxProps) => Box.load(item))
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.deleted = deleted
  }

  static initialize(path: string, name: string, key: string): Vault {
    const id = nanoid()
    const filePath = this.filePath(path, id)
    const createdAt = new Date().getTime()
    const updatedAt = createdAt
    const contents = []
    const deleted = []

    ensureFileSync(filePath)

    const tag = this.generateTag(id, key)

    const vault = new Vault({ id, name, filePath, contents, createdAt, updatedAt, deleted, tag })
    vault.save(key)

    return vault
  }

  static load(path: string, id: string, key: string): Vault {
    const filePath = this.filePath(path, id)
    const serialized = readEncryptedFile(filePath, key)
    const { name, createdAt, updatedAt, contents, deleted } = JSON.parse(serialized)

    const tag = this.generateTag(id, key)

    return new Vault({ id, name, filePath, contents, createdAt, updatedAt, deleted, tag })
  }

  static filePath(path: string, id: string): string {
    return join(path, `${id}.${EXTENSION}`)
  }

  static generateTag(id: string, key: string): string {
    return encrypt(`${id}.${new Date().getTime()}`, key)
  }

  add(props: BoxProps, key: string): BoxInterface {
    this.authenticateKey(key)

    const box = Box.initialize(props)
    this.contents.push(box)
    this.updatedAt = this.timestamp()
    this.save(key)
    return box
  }

  update(id: string, props: object, key: string): BoxInterface {
    this.authenticateKey(key)

    const box = this.contents.find((box) => box.id === id)
    box.update(props)
    this.updatedAt = this.timestamp()
    this.save(key)

    return box
  }

  remove(id: string, key: string): void {
    this.authenticateKey(key)

    this.contents = this.contents.filter((box) => box.id !== id)
    this.updatedAt = this.timestamp()
    this.deleted.push(id)
    this.save(key)
  }

  merge(data: VaultInterface, key: string): void {
    this.authenticateKey(key)

    this.name = this.updatedAt >= data.updatedAt ? this.name : data.name
    this.contents = this.mergeContents(new Vault(data))
    this.updatedAt = this.timestamp()

    this.save(key)
  }

  save(key: string): boolean {
    return writeEncryptedFile(this.filePath, this.serialize(), key)
  }

  serialize(): string {
    return JSON.stringify({
      id: this.id,
      name: this.name,
      contents: this.contents.map((box) => box.serialize()),
      deleted: this.deleted,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    })
  }

  private mergeContents(data: VaultInterface) {
    const local = keyBy(this.contents, 'id')
    const remote = keyBy(data.contents, 'id')
    this.deleted = [...this.deleted, ...data.deleted]

    for (const key in local) {
      if (remote[key]) {
        if (remote[key].updatedAt > local[key].updatedAt) {
          local[key] = remote[key]
        }
        delete remote[key]
      } else {
        if (this.deleted.includes(key)) delete local[key]
      }
    }

    for (const key in remote) {
      if (this.deleted.includes(key)) continue

      local[key] = remote[key]
    }

    return Object.values(local)
  }

  private timestamp(): number {
    return new Date().getTime()
  }

  private authenticateKey(key: string): boolean {
    return decrypt(this.tag, key).match(new RegExp(`${this.id}\\.\\d+`))
  }
}
