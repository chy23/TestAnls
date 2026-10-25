const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../release');
const destDir = path.join(
  process.env.HOME,
  'Library/Mobile Documents/com~apple~CloudDocs/【Home & School】 Cloud/Antigrivity Apps'
);

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir);
for (const f of files) {
  if (f.endsWith('.dmg') || f.endsWith('-mac.zip')) {
    const src = path.join(srcDir, f);
    const dest = path.join(destDir, f);
    console.log(`Copying ${f} to iCloud...`);
    fs.copyFileSync(src, dest);
    console.log(`✅ ${f} copied successfully!`);
  }
}
console.log('🎉 All files synced to iCloud [Antigrivity Apps]!');
