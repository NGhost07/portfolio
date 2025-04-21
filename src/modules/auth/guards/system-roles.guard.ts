import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { SystemRole } from '../../users/enums'
import { ROLES_KEY } from '../decorators'

@Injectable()
export class SystemRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<SystemRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const { user } = context.switchToHttp().getRequest()

    if (!user) throw new ForbiddenException('Unauthorized access')

    const hasRequiredRole = requiredRoles.some(
      (role) => user.roles && user.roles.includes(role),
    )

    if (!hasRequiredRole)
      throw new ForbiddenException('Insufficient permissions')

    return true
  }
}
