/**
 * Applique les politiques RLS sur la base Neon
 * Exécution : npx tsx scripts/apply-rls.ts
 */
import { config } from "dotenv"
import { readFileSync } from "fs"
import { join } from "path"
import postgres from "postgres"

config({ path: ".env.local" })
config({ path: ".env" })

const dbUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
if (!dbUrl) {
  console.error("❌ DATABASE_URL_UNPOOLED manquant dans .env.local")
  process.exit(1)
}

function parseSqlStatements(raw: string): string[] {
  // Supprime les blocs de commentaires (-- jusqu'à fin de ligne)
  const withoutComments = raw
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")

  return withoutComments
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

async function main() {
  console.log("Connexion à :", dbUrl!.replace(/:[^@]+@/, ":***@"))
  console.log("Application des politiques RLS...\n")

  const sql = postgres(dbUrl!, { ssl: "require" })
  const sqlFile = readFileSync(join(process.cwd(), "prisma/rls-policies.sql"), "utf-8")
  const statements = parseSqlStatements(sqlFile)

  console.log(`${statements.length} instructions SQL à exécuter\n`)

  for (const statement of statements) {
    const preview = statement.replace(/\s+/g, " ").slice(0, 80)
    console.log(`  > ${preview}`)
    try {
      await sql.unsafe(statement)
      console.log("    ✓")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes("already exists")) {
        console.log("    ↳ déjà existant, ignoré")
      } else {
        console.error("    ✗", msg)
        await sql.end()
        process.exit(1)
      }
    }
  }

  await sql.end()
  console.log("\n✅ Politiques RLS appliquées avec succès !")
}

main().catch((e) => {
  console.error("❌ Erreur :", e.message)
  process.exit(1)
})
