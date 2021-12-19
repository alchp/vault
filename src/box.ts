import { nanoid } from 'nanoid'

interface BoxProps {
  id: string
  type: string
  title: string
  createdAt: number
  website?: string
  username?: string
  password?: string
  email?: string
  node?: string
  otp?: string
  number?: string
  name?: string
  year?: string
  month?: string
  cvc?: string
  pin?: string
}

interface BoxInterface extends BoxProps {
  serialize: () => BoxProps | object
}

export class Box implements BoxInterface {
  id: string
  type: string
  title: string
  createdAt: number
  propsKeys: string[]

  constructor(props: BoxProps) {
    this.propsKeys = Object.keys(props)
    this.propsKeys.forEach((key) => (this[key] = props[key]))
  }

  static initialize({ type, title, ...rest }: BoxProps) {
    const id = nanoid()
    const createdAt = new Date().getTime()
    return new Box({ id, createdAt, type, title, ...rest })
  }

  static load(props: BoxProps) {
    return new Box(props)
  }

  serialize() {
    return this.propsKeys.reduce((acc, key) => {
      acc[key] = this[key]
      return acc
    }, {})
  }
}

export { BoxInterface, BoxProps }
