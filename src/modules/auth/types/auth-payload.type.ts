import { SystemRole } from '../../users/enums'

export type AuthPayload = {
  sub: string
  fullName: string
  roles?: SystemRole[]
  jti?: string
}
