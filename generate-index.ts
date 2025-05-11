// generate-index.ts
import fs from 'fs';
import path from 'path';

const srcDir = path.join(__dirname, 'src');
const indexFile = path.join(srcDir, 'index.ts');

function getExportPaths(dir: string, baseDir = dir): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      return getExportPaths(fullPath, baseDir);
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.ts') &&
      !entry.name.endsWith('.test.ts') &&
      entry.name !== 'index.ts'
    ) {
      const noExt = relPath.replace(/\.ts$/, '');
      return [`export * from './${noExt}';`];
    }
    return [];
  });
}

const exportLines = getExportPaths(srcDir);
fs.writeFileSync(indexFile, exportLines.join('\n') + '\n');

console.log(`Generated ${exportLines.length} exports to src/index.ts`);

