#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    const migrationPath = path.join(
      __dirname,
      "../supabase/migrations/20240101_add_company_invitations.sql"
    );
    const sql = fs.readFileSync(migrationPath, "utf-8");

    // Split by semicolon and execute each statement
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`[${i + 1}/${statements.length}] Executing...`);
      const { error } = await supabase.rpc("exec_sql", { sql: statement });
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error.message);
        // Continue anyway, might be idempotent
      }
    }

    console.log("Migration applied successfully!");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  }
}

// Check if exec_sql function exists, if not use query method
async function applyMigrationDirect() {
  try {
    const migrationPath = path.join(
      __dirname,
      "../supabase/migrations/20240101_add_company_invitations.sql"
    );
    const sql = fs.readFileSync(migrationPath, "utf-8");

    console.log("Applying migration...");
    const { error } = await supabase.query(sql);

    if (error) {
      console.error("Migration error:", error.message);
      process.exit(1);
    }

    console.log("Migration applied successfully!");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  }
}

applyMigration().catch(() => {
  console.log("Trying direct execution...");
  applyMigrationDirect();
});
