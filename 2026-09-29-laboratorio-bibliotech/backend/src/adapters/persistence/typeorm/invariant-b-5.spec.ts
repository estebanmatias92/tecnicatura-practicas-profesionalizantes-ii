// invariant:B-5 (ADR-0006) — FULLTEXT(title,author,subject) + BTREE(year,created_at).
import * as fs from 'fs';
import * as path from 'path';

describe('invariant:B-5', () => {
  it('MaterialOrm tiene FULLTEXT y BTREE indices', () => {
    const filePath = path.resolve(__dirname, 'orm-entities.ts');
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain("FULLTEXT_idx");
    expect(content).toContain("BTREE_year");
    expect(content).toContain("BTREE_created_at");
  });
});
