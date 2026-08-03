const fs = require('fs');
const path = require('path');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fp);
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      let c = fs.readFileSync(fp, 'utf8');
      let changed = false;

      // Fix 1: Mongoose pre-save hook with next parameter (Mongoose v9 breaking change)
      if (c.includes('.pre("save", async function (next)') || c.includes(".pre('save', async function (next)")) {
        c = c.replace(/\.pre\(["']save["'],\s*async function\s*\(next\)\s*\{/g, '.pre("save", async function () {');
        c = c.replace(/if \(!this\.isModified\(["']password["']\)\) return next\(\);/g, 'if (!this.isModified("password")) return;');
        c = c.replace(/^\s*next\(\);\s*$/gm, '');
        c = c.replace(/^\s*next\(error as Error\);\s*$/gm, '// error re-thrown');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fp, c);
        console.log('Fixed:', path.relative(process.cwd(), fp));
      }
    }
  }
}

walk(path.join(__dirname, 'src', 'lib', 'db'));
console.log('All Mongoose hook fixes done.');
