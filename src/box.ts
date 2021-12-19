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
  serialize: () => string
}

export class Box implements BoxInterface {
  id: string
  type: string
  title: string
  createdAt: number

  constructor({ id, createdAt }: BoxProps) {
    this.id = id
    this.createdAt = createdAt
  }

  serialize() {
    return ''
  }
}

export { BoxInterface, BoxProps }
