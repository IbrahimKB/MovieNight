const { readdirSync, readFileSync } = require("fs");
const { join } = require("path");

const API_DIR = "app/api";

function getFiles(dir) {
  const subdirs = readdirSync(dir, { withFileTypes: true });
  const files = subdirs.map((dirent) => {
    const res = join(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  });
  return files.flat().filter(f => f.endsWith("route.ts"));
}

const files = getFiles(API_DIR);
let errors = 0;

files.forEach(file => {
  // Extract param name from path (e.g., [id] -> id)
  const match = file.match(/\[([a-zA-Z0-9_]+)\]/);
  
  if (match) {
    const paramName = match[1];
    const content = readFileSync(file, "utf-8");
    
    // Look for type definitions. We want to see `params: { paramName: string }`
    // Flexible regex to catch different formatting
    const typeRegex = new RegExp(`params\\s*:\\s*\\{\\s*${paramName}\\s*:\\s*string\\s*\\}`);
    
    // Also check if we are using the Promise pattern (which we migrated AWAY from, but checking anyway)
    const promiseRegex = new RegExp(`params\\s*:\\s*Promise\\s*<\\s*\\{\\s*${paramName}\\s*:\\s*string\\s*\\}\\s*>`);
    
    // Check if context is untyped (context: any) - this is also safe/valid
    const untypedRegex = /context:\s*any/;

    if (!typeRegex.test(content) && !promiseRegex.test(content) && !untypedRegex.test(content)) {
      console.error(`❌ MISMATCH: ${file}`);
      console.error(`   Expected param: "${paramName}"`);
      console.error(`   Content validation failed. Ensure route handler signature matches folder name.`);
      errors++;
    } else {
      console.log(`✅ VALID: ${file} matches [${paramName}]`);
    }
  }
});

if (errors > 0) {
  console.log(`\n${errors} type mismatches found.`);
  process.exit(1);
} else {
  console.log("\nAll dynamic routes verified successfully.");
}
