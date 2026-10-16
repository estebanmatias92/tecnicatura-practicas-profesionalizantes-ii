// FR-001/FR-002/FR-003 / UC-001 [Controller] — RegisterUserUseCase.execute()
// es el unico punto de entrada del evento de sistema (UI solo delega).
// TDD Slice 1 (RED): debe FALLAR hasta implementar el usecase.
import { RegisterUserUseCase } from './register-user.usecase';
import { DomainError } from './errors';
import { Role } from '../entities/role';
import type { UserRepository, PasswordHasher, TokenSigner, ValidatorPort } from './ports';

const fakeValidator: ValidatorPort = {
  validateEmail: jest.fn(),
  validatePassword: jest.fn(),
  validateMetadata: jest.fn(),
  validateFile: jest.fn(),
    normalizeFileName: jest.fn(),
};

function setup(existing: { email: string } | null = null) {
  const repo: UserRepository = {
    findByEmail: jest.fn().mockResolvedValue(existing),
    findById: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn().mockImplementation((u: unknown) => Promise.resolve({ ...(u as object), id: 1 })),
    deleteCascade: jest.fn(),
    findCascadeKeys: jest.fn(),
  };
  const hasher: PasswordHasher = {
    hash: jest.fn().mockResolvedValue('hashed-cost10'),
    compare: jest.fn(),
  };
  const signer: TokenSigner = {
    sign: jest.fn().mockReturnValue('jwt-token'),
    verify: jest.fn(),
  };
  return { uc: new RegisterUserUseCase(repo, hasher, signer, fakeValidator), repo, hasher, signer };
}

beforeEach(() => jest.clearAllMocks());

describe('RegisterUserUseCase (FR-001 / UC-001)', () => {
  it('auto-registro Student valido -> 201 con JWT y sin password en respuesta', async () => {
    const { uc } = setup(null);
    const out = await uc.execute({ email: 'alu@biblio.tech', password: 'secreta99' });
    expect(out.token).toBe('jwt-token');
    expect(out).not.toHaveProperty('password');
    expect(out).not.toHaveProperty('passwordHash');
  });

  it('email duplicado -> 409 CONFLICT', async () => {
    const { uc } = setup({ email: 'alu@biblio.tech' });
    await expect(uc.execute({ email: 'alu@biblio.tech', password: 'secreta99' })).rejects.toMatchObject({
      code: 'CONFLICT',
    } satisfies Partial<DomainError>);
  });

  it('email/password invalidos -> 400 (mensaje del Validator, nada persistido)', async () => {
    (fakeValidator.validateEmail as jest.Mock).mockImplementationOnce(() => {
      throw new DomainError('BAD_REQUEST', 'email invalido');
    });
    const { uc, repo } = setup(null);
    await expect(uc.execute({ email: 'mal', password: 'secreta99' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('no-Admin que pide role=Admin queda Student (UC-001: rol solo si lo crea Admin)', async () => {
    const { uc, repo } = setup(null);
    await uc.execute({ email: 'x@biblio.tech', password: 'secreta99', requestedRole: Role.Admin });
    expect((repo.save as jest.Mock).mock.calls[0][0].role).toBe(Role.Student);
  });

  it('Admin que crea con role=Professor respeta el rol pedido', async () => {
    const { uc, repo } = setup(null);
    await uc.execute({
      email: 'p@biblio.tech',
      password: 'secreta99',
      requestedRole: Role.Professor,
      requesterRole: Role.Admin,
    });
    expect((repo.save as jest.Mock).mock.calls[0][0].role).toBe(Role.Professor);
  });
});
