// FR-002 / UC-001 [Controller] — LoginUseCase.execute() unico punto de entrada.
// TDD Slice 1 (RED): debe FALLAR hasta implementar el usecase.
import { LoginUseCase } from './login.usecase';
import type { UserRepository, PasswordHasher, TokenSigner, ValidatorPort } from './ports';

const validator: ValidatorPort = {
  validateEmail: jest.fn(),
  validatePassword: jest.fn(),
  validateMetadata: jest.fn(),
  validateFile: jest.fn(),
    normalizeFileName: jest.fn(),
};

function setup(user: { passwordHash: string } | null, compareResult: boolean) {
  const repo: UserRepository = {
    findByEmail: jest.fn().mockResolvedValue(user ? { id: 5, email: 'a@b.c', role: 'Student', ...user } : null),
    findById: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
    deleteCascade: jest.fn(),
  };
  const hasher: PasswordHasher = {
    hash: jest.fn(),
    compare: jest.fn().mockResolvedValue(compareResult),
  };
  const signer: TokenSigner = {
    sign: jest.fn().mockReturnValue('jwt-token'),
    verify: jest.fn(),
  };
  return new LoginUseCase(repo, hasher, signer, validator);
}

beforeEach(() => jest.clearAllMocks());

describe('LoginUseCase (FR-002 / UC-001)', () => {
  it('credencial valida -> 200 con JWT (userId + role), sin password', async () => {
    const uc = setup({ passwordHash: 'h' }, true);
    const out = await uc.execute({ email: 'a@b.c', password: 'ok123456' });
    expect(out.token).toBe('jwt-token');
    expect(out).not.toHaveProperty('password');
  });

  it('password incorrecta -> 401 sin distinguir si el email existe', async () => {
    const uc = setup({ passwordHash: 'h' }, false);
    await expect(uc.execute({ email: 'a@b.c', password: 'mala1234' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('email inexistente -> 401 identico (no enumera usuarios)', async () => {
    const uc = setup(null, false);
    await expect(uc.execute({ email: 'nadie@b.c', password: 'x1234567' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });
});
