// FR-002 / UC-001 [Information Expert] — AuthSession conoce token/userId/
// expiracion y decide isExpired; toPublic nunca expone el token (NFR-004).
export class AuthSession {
  constructor(
    public readonly token: string,
    public readonly userId: number,
    public readonly role: string,
    public readonly expiresAt: Date,
  ) {}

  isExpired(now: Date = new Date()): boolean {
    return now.getTime() >= this.expiresAt.getTime();
  }

  toPublic(): { userId: number; role: string } {
    return { userId: this.userId, role: this.role };
  }
}
