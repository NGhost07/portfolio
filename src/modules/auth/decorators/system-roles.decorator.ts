import { SetMetadata } from '@nestjs/common'
import { SystemRole } from '../../users/enums'

export const ROLES_KEY = 'roles'

export const SystemRoles = (...roles: SystemRole[]) =>
  SetMetadata(ROLES_KEY, roles)
