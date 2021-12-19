import { writeFileSync, readFileSync } from 'fs-extra'
import { encrypt, decrypt } from '@swiftyapp/aes-256-gcm'

export const writeEncryptedFile = (file: string, message: string, key: string): boolean => {
  const data = encrypt(message, key)
  writeFileSync(file, Buffer.from(data, 'hex'))
  return true
}

export const readEncryptedFile = (file: string, key: string): string | null => {
  const message = readFileSync(file).toString('hex')
  return decrypt(message, key)
}
