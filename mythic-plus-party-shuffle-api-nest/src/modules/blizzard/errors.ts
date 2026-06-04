import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Thrown when the federated token exchange fails because the user has not
 * linked their Battle.net account in Auth0 (no token in the Token Vault).
 * The controller surfaces this as a 409 with a stable code so the UI can show
 * a "Link Battle.net" call-to-action instead of a generic error.
 */
export class BattlenetNotLinkedException extends HttpException {
  static readonly CODE = 'BATTLENET_NOT_LINKED';

  constructor() {
    super(
      { code: BattlenetNotLinkedException.CODE, message: 'Battle.net account not linked' },
      HttpStatus.CONFLICT,
    );
  }
}
