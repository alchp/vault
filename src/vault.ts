import { join } from 'path'
import { ensureFileSync } from 'fs-extra'
import { nanoid } from 'nanoid'

import { BoxInterface, BoxProps, Box } from './box'
import { writeEncryptedFile, readEncryptedFile } from './utils'

const EXTENSION = 'swftx'

interface VaultProps {
  id: string
  name: string
  filePath: string
  contents: Array<BoxInterface>
  createdAt: number
}

export interface VaultInterface extends VaultProps {
  save: (key: string) => boolean
  add: (props: BoxProps, key: string) => BoxInterface
  remove: (id: string, key: string) => void
  serialize: () => string
}

export class Vault implements VaultInterface {
  id: string
  name: string
  filePath: string
  contents: Array<BoxInterface> = []
  createdAt: number

  constructor({ id, filePath, name, createdAt, contents }: VaultProps) {
    this.id = id
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

    const vault = new Vault({ id, name, filePath, contents, createdAt })
    vault.save(key)

    return vault
  }

  static load(path: string, id: string, key: string) {
    const filePath = this.filePath(path, id)
    const serialized = readEncryptedFile(filePath, key)
    const { name, createdAt, contents } = JSON.parse(serialized)
    const items = contents.map((item: BoxProps) => Box.load(item))
    return new Vault({ id, name, filePath, contents: items, createdAt })
  }

  static filePath(path: string, id: string) {
    return join(path, `${id}.${EXTENSION}`)
  }

  add(props: BoxProps, key: string) {
    const box = Box.initialize(props)
    this.contents.push(box)
    this.save(key)
    return box
  }

  remove(id: string, key: string) {
    this.contents = this.contents.filter((box) => box.id !== id)
    this.save(key)
  }

  merge(data: VaultProps, key: string) {
    // Method used to merege synced data with local data
    // TODO: Implement merge logic
    this.save(key)
  }

  save(key: string) {
    return writeEncryptedFile(this.filePath, this.serialize(), key)
  }

  serialize() {
    return JSON.stringify({
      id: this.id,
      name: this.name,
      contents: this.contents.map((box) => box.serialize()),
      createdAt: this.createdAt
    })
  }
}
