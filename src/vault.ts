import { join } from 'path'
import { ensureFileSync } from 'fs-extra'
import { nanoid } from 'nanoid'
import { encrypt, decrypt } from '@swiftyapp/aes-256-gcm'

import { BoxInterface, BoxProps, BoxRequiredProps, Box } from './box'
import { writeEncryptedFile, readEncryptedFile } from './utils'

const EXTENSION = 'swftx'

interface VaultProps {
  id: string
  tag: string
  name: string
  filePath: string
  contents: Array<BoxInterface>
  createdAt: number
}

export interface VaultInterface extends VaultProps {
  save: (key: string) => boolean
  add: (props: BoxRequiredProps, key: string) => BoxInterface
  update: (id: string, props: object, key: string) => BoxInterface
  remove: (id: string, key: string) => void
  serialize: () => string
}

export class Vault implements VaultInterface {
  id: string
  tag: string
  name: string
  filePath: string
  contents: Array<BoxInterface> = []
  createdAt: number

  constructor({ id, filePath, name, createdAt, contents, tag }: VaultProps) {
    this.id = id
    this.tag = tag
    this.name = name
    this.filePath = filePath
    this.contents = contents
    this.createdAt = createdAt
  }

  static initialize(path: string, name: string, key: string): Vault {
    const id = nanoid()
    const filePath = this.filePath(path, id)
    const createdAt = new Date().getTime()
    const contents = []

    ensureFileSync(filePath)

    const tag = this.generateTag(id, key)

    const vault = new Vault({ id, name, filePath, contents, createdAt, tag })
    vault.save(key)

    return vault
  }

  static load(path: string, id: string, key: string): Vault {
    const filePath = this.filePath(path, id)
    const serialized = readEncryptedFile(filePath, key)
    const { name, createdAt, contents } = JSON.parse(serialized)
    const items = contents.map((item: BoxProps) => Box.load(item))

    const tag = this.generateTag(id, key)

    return new Vault({ id, name, filePath, contents: items, createdAt, tag })
  }

  static filePath(path: string, id: string): string {
    return join(path, `${id}.${EXTENSION}`)
  }

  static generateTag(id: string, key: string): string {
    return encrypt(`${id}.${new Date().getTime()}`, key)
  }

  add(props: BoxRequiredProps, key: string): BoxInterface {
    this.authenticateKey(key)

    const box = Box.initialize(props)
    this.contents.push(box)
    this.save(key)
    return box
  }

  update(id: string, props: object, key: string): BoxInterface {
    this.authenticateKey(key)

    const box = this.contents.find((box) => box.id === id)
    Object.keys(props).forEach((key) => {
      box[key] = props[key]
    })
    box.updatedAt = new Date().getTime()
    this.save(key)
    return box
  }

  remove(id: string, key: string): void {
    this.authenticateKey(key)

    this.contents = this.contents.filter((box) => box.id !== id)
    this.save(key)
  }

  merge(data: VaultProps, key: string): void {
    this.authenticateKey(key)

    // Method used to merege synced data with local data
    // TODO: Implement merge logic
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
      createdAt: this.createdAt
    })
  }

  private authenticateKey(key: string): boolean {
    return decrypt(this.tag, key).match(new RegExp(`${this.id}\\.\\d+`))
  }
}
