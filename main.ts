// Hand-in program for the household budget site entry (Node 22, standard library only).
// It copies the static site in app/ and the captures in screenshots/ into the output
// directory and writes dossier.json there with the vendored make.fun library.
// The grader runs this with /output as the target; locally MAKEFUN_OUTPUT_DIR
// stands in for it:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

if (!existsSync(join(repoRoot, 'app', 'index.html'))) {
  throw new Error('app/index.html is missing: the site must have its page at app/index.html');
}

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log('hand-in written to ' + outputDir + ' (dossier.json ' + dossier.length + ' bytes)');
