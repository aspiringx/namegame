#!/usr/bin/env node

/**
 * Validates that enum constants in src/types.ts match the Prisma schema
 * Prevents builds when enums are out of sync
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const typesPath = path.join(__dirname, '../src/types.ts');

// ANSI color codes for bright/red error messages
const RED = '\x1b[31m';
const BRIGHT = '\x1b[1m';
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';

function parseEnumsFromSchema(schemaContent) {
  const enums = {};
  const enumRegex = /enum\s+(\w+)\s*{([^}]+)}/g;
  
  let match;
  while ((match = enumRegex.exec(schemaContent)) !== null) {
    const enumName = match[1];
    const enumBody = match[2];
    
    // Extract enum values
    const values = enumBody
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'))
      .map(line => line.replace(/,$/, ''));
    
    enums[enumName] = values;
  }
  
  return enums;
}

function parseEnumsFromTypes(typesContent) {
  const enums = {};
  
  // Match: export const EnumName = { value1: 'value1' as const, ... };
  const enumRegex = /export const (\w+) = \{([^}]+)\};/g;
  
  let match;
  while ((match = enumRegex.exec(typesContent)) !== null) {
    const enumName = match[1];
    const enumBody = match[2];
    
    // Extract values from: value1: 'value1' as const, value2: 'value2' as const
    const valueRegex = /(\w+):\s*'([^']+)'/g;
    const values = [];
    
    let valueMatch;
    while ((valueMatch = valueRegex.exec(enumBody)) !== null) {
      values.push(valueMatch[2]); // Use the string value, not the key
    }
    
    enums[enumName] = values;
  }
  
  return enums;
}

function validateEnums() {
  try {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const typesContent = fs.readFileSync(typesPath, 'utf8');
    
    const schemaEnums = parseEnumsFromSchema(schemaContent);
    const typesEnums = parseEnumsFromTypes(typesContent);
    
    let hasErrors = false;
    
    console.log('🔍 Validating enum consistency between schema.prisma and types.ts...\n');
    
    // Check each enum from schema
    for (const [enumName, schemaValues] of Object.entries(schemaEnums)) {
      if (!typesEnums[enumName]) {
        console.error(`${RED}${BRIGHT}❌ ENUM MISSING: ${enumName} exists in schema.prisma but not in types.ts${RESET}`);
        hasErrors = true;
        continue;
      }
      
      const typesValues = typesEnums[enumName];
      
      // Check for missing values
      const missingInTypes = schemaValues.filter(v => !typesValues.includes(v));
      const extraInTypes = typesValues.filter(v => !schemaValues.includes(v));
      
      if (missingInTypes.length > 0) {
        console.error(`${RED}${BRIGHT}❌ ENUM MISMATCH: ${enumName}${RESET}`);
        console.error(`   Missing in types.ts: ${RED}${missingInTypes.join(', ')}${RESET}`);
        hasErrors = true;
      }
      
      if (extraInTypes.length > 0) {
        console.error(`${RED}${BRIGHT}❌ ENUM MISMATCH: ${enumName}${RESET}`);
        console.error(`   Extra in types.ts: ${RED}${extraInTypes.join(', ')}${RESET}`);
        hasErrors = true;
      }
      
      if (missingInTypes.length === 0 && extraInTypes.length === 0) {
        console.log(`${GREEN}✅ ${enumName}: OK${RESET}`);
      }
    }
    
    // Check for extra enums in types.ts
    for (const enumName of Object.keys(typesEnums)) {
      if (!schemaEnums[enumName]) {
        console.error(`${RED}${BRIGHT}❌ EXTRA ENUM: ${enumName} exists in types.ts but not in schema.prisma${RESET}`);
        hasErrors = true;
      }
    }
    
    if (hasErrors) {
      console.error(`\n${RED}${BRIGHT}🚨 ENUM VALIDATION FAILED!${RESET}`);
      console.error(`${RED}${BRIGHT}📝 TO FIX: Update the enum constants in packages/db/src/types.ts to match schema.prisma${RESET}`);
      console.error(`${RED}${BRIGHT}🔄 Then run: pnpm db:generate && pnpm build:all${RESET}\n`);
      process.exit(1);
    }
    
    console.log(`\n${GREEN}${BRIGHT}✅ All enums are in sync! Build can proceed.${RESET}\n`);
    
  } catch (error) {
    console.error(`${RED}${BRIGHT}❌ Error validating enums: ${error.message}${RESET}`);
    process.exit(1);
  }
}

validateEnums();
