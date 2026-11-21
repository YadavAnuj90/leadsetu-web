const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

function patchRecursiveDelete(relPath, isEsm) {
  const filePath = path.join(projectRoot, relPath);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('/* leadsetu-onedrive-readlink-fix */')) return;

  if (!isEsm) {
    const target = [
      '        if (isSymlink) {',
      '            const linkPath = await _fs.promises.readlink(absolutePath);',
      '            try {',
      '                const stats = await _fs.promises.stat((0, _path.isAbsolute)(linkPath) ? linkPath : (0, _path.join)((0, _path.dirname)(absolutePath), linkPath));',
      '                isDirectory = stats.isDirectory();',
      '            } catch  {}',
      '        }',
    ].join('\n');

    const replacement = [
      '        if (isSymlink) {',
      '            /* leadsetu-onedrive-readlink-fix */',
      '            try {',
      '                const linkPath = await _fs.promises.readlink(absolutePath);',
      '                const stats = await _fs.promises.stat((0, _path.isAbsolute)(linkPath) ? linkPath : (0, _path.join)((0, _path.dirname)(absolutePath), linkPath));',
      '                isDirectory = stats.isDirectory();',
      '            } catch {',
      '                try {',
      '                    isDirectory = (await _fs.promises.lstat(absolutePath)).isDirectory();',
      '                } catch {}',
      '            }',
      '        }',
    ].join('\n');

    if (content.includes(target)) {
      fs.writeFileSync(filePath, content.replace(target, replacement), 'utf8');
    }
  } else {
    const target = [
      '        if (isSymlink) {',
      '            const linkPath = await promises.readlink(absolutePath);',
      '            try {',
      '                const stats = await promises.stat(isAbsolute(linkPath) ? linkPath : join(dirname(absolutePath), linkPath));',
      '                isDirectory = stats.isDirectory();',
      '            } catch  {}',
      '        }',
    ].join('\n');

    const replacement = [
      '        if (isSymlink) {',
      '            /* leadsetu-onedrive-readlink-fix */',
      '            try {',
      '                const linkPath = await promises.readlink(absolutePath);',
      '                const stats = await promises.stat(isAbsolute(linkPath) ? linkPath : join(dirname(absolutePath), linkPath));',
      '                isDirectory = stats.isDirectory();',
      '            } catch {',
      '                try {',
      '                    isDirectory = (await promises.lstat(absolutePath)).isDirectory();',
      '                } catch {}',
      '            }',
      '        }',
    ].join('\n');

    if (content.includes(target)) {
      fs.writeFileSync(filePath, content.replace(target, replacement), 'utf8');
    }
  }
}

function ensureLocalNextCacheDir() {
  const dotNext = path.join(projectRoot, '.next');
  const staleAppDataNext = process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, 'leadsetu-web-next')
    : '';
  if (staleAppDataNext && fs.existsSync(staleAppDataNext)) {
    fs.rmSync(staleAppDataNext, { recursive: true, force: true });
  }
  // Remove any stale .next directory (or old junction) so Node module resolution stays under projectRoot/node_modules.
  try {
    const lst = fs.lstatSync(dotNext);
    if (lst.isSymbolicLink()) {
      fs.unlinkSync(dotNext);
      fs.mkdirSync(dotNext, { recursive: true });
      return;
    }
  } catch {
    // Does not exist
  }
  fs.rmSync(dotNext, { recursive: true, force: true });
  fs.mkdirSync(dotNext, { recursive: true });
}

patchRecursiveDelete('node_modules/next/dist/lib/recursive-delete.js', false);
patchRecursiveDelete('node_modules/next/dist/esm/lib/recursive-delete.js', true);

const mode = process.argv[2] || 'clean';
if (mode !== 'patch-only') {
  ensureLocalNextCacheDir();
}
