// FR-001/FR-011 / UC-001/UC-004 [Information Expert] — Role: el vocabulario
// de roles vive junto a quienes lo usan (User, guards). Sin sinonimos.
export enum Role {
  Admin = 'Admin',
  Professor = 'Professor',
  Student = 'Student',
}

export function isRole(value: unknown): value is Role {
  return value === Role.Admin || value === Role.Professor || value === Role.Student;
}
