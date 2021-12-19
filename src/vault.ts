import { join } from 'path'
import { ensureFileSync } from 'fs-extra'
import { nanoid } from 'nanoid'
import { BoxInterface, BoxProps, Box } from './box'
import { writeEncryptedFile, readEncryptedFile } from './utils'

const EXTENSION = 'swftx'

interface VaultProps {
  id: string
  key: string
  name: string
  filePath: string
  contents: Array<BoxInterface>
  createdAt: number
}

interface VaultInterface extends VaultProps {
  save: () => boolean
  serialize: () => string
}

export class Vault implements VaultInterface {
  id: string
  key: string
  name: string
  filePath: string
  contents: Array<BoxInterface> = []
  createdAt: number

  constructor({ id, filePath, name, key, createdAt, contents }: VaultProps) {
    this.id = id
    this.key = key
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

    const vault = new Vault({ id, name, key, filePath, contents, createdAt })
    vault.save()

    return vault
  }

  static load(path: string, id: string, key: string) {
    const filePath = this.filePath(path, id)
    const serialized = readEncryptedFile(filePath, key)
    const { name, createdAt, contents } = JSON.parse(serialized)
    const items = contents.map((item: BoxProps) => new Box(item))
    return new Vault({ id, key, name, filePath, contents: items, createdAt })
  }

  static filePath(path: string, id: string) {
    return join(path, `${id}.${EXTENSION}`)
  }

  add(props: BoxProps) {
    const box = new Box(props)
    this.contents.push(box)
    this.save()
    return box
  }

  save() {
    return writeEncryptedFile(this.filePath, this.serialize(), this.key)
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
