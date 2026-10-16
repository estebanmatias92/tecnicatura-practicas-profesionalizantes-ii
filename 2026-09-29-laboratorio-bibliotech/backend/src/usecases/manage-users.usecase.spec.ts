// invariant:B-3 — Split ManageUsersUseCase + orden FS-primero pendiente.
import * as fs from 'fs';
import * as path from 'path';

describe('invariant:B-3', () => {
  it('manage-users.usecase existe', () => {
    const filePath = path.resolve(__dirname, 'manage-users.usecase.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('manage-material.usecase no tiene deleteUser', () => {
    const filePath = path.resolve(__dirname, 'manage-material.usecase.ts');
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).not.toContain('deleteUser');
  });
});
