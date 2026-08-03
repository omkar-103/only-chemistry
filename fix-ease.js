const fs = require('fs');
const path = require('path');
function walk(dir) {
  const files = fs.readdirSync(dir, {withFileTypes: true});
  for (const f of files) {
    const fp = path.join(dir, f.name);
    if (f.isDirectory()) walk(fp);
    else if (f.name.endsWith('.tsx') || f.name.endsWith('.ts')) {
      let c = fs.readFileSync(fp, 'utf8');
      // Fix framer-motion ease: "string" -> ease: "string" as any
      const updated = c.replace(/ease: "([^"]+)"/g, (_, v) => `ease: "${v}" as any`);
      if (updated !== c) {
        fs.writeFileSync(fp, updated);
        console.log('Fixed ease in:', path.relative(process.cwd(), fp));
      }
    }
  }
}
walk('src');
console.log('Done fixing ease types');
