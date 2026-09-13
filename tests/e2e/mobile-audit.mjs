import { createRequire } from "node:module"
import { execFileSync } from "node:child_process"
const require = createRequire(import.meta.url)
const { chromium } = require(`${process.env.NPM_GLOBAL_ROOT}/playwright`)
const BASE = "http://localhost:3000"
const OUT = process.argv[2]
const sql = (q) => execFileSync("psql", ["-h", process.env.E2E_PG_HOST ?? "/tmp", "-p", process.env.E2E_PG_PORT ?? "5433", "-U", process.env.E2E_PG_USER ?? "postgres", "-d", "tremplin_e2e", "-tAc", q], { encoding: "utf8" }).trim()
const LONG = "supercalifragilisticexpialidocious".repeat(4)
const LONG_EMAIL = `${"candidat.avec.une.adresse.tres.longue".repeat(2)}@sous-domaine-interminable.example.fr`
const results = []
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, locale: "fr-FR" })
const page = await ctx.newPage()
page.setDefaultTimeout(20000)

async function measure(name) {
  await page.waitForTimeout(400)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  const dialogOverflow = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]')
    return d ? Math.max(0, d.scrollWidth - d.clientWidth) : 0
  })
  results.push({ name, overflow: overflow + dialogOverflow })
  console.log(`${overflow + dialogOverflow === 0 ? "OK  " : "FAIL"} ${name} (${overflow}px page, ${dialogOverflow}px dialogue)`)
  await page.screenshot({ path: `${OUT}/audit-${name.replace(/[^a-z0-9]+/gi, "-")}.png`, fullPage: true })
}
async function login(email, password) {
  await ctx.clearCookies()
  await page.goto(`${BASE}/auth/login`)
  await page.evaluate(() => localStorage.setItem("cookie-consent", "accepted"))
  await page.reload()
  await page.fill("#email", email)
  await page.fill("#password", password)
  await page.click('button[type="submit"]')
  await page.waitForURL((u) => /\/(admin|dashboard)/.test(u.pathname))
}

// --- Data: open season, long-named candidate (minor, unverified first), second candidate with a group
sql("UPDATE schedule_config SET edition=2027, registration_closes_at='2026-12-31', audition_dates=ARRAY['2026-10-10'], age_reference_date='2026-10-10', venue='Espace Léo Ferré, Brest'")
const ADMIN = { email: "admin@tremplin-jeunes-en-scene.fr", password: "AdminTremplin2027!" }
const C = { email: LONG_EMAIL.toLowerCase(), password: "MotDePasse123!" }
await page.request.post(`${BASE}/api/auth/signup`, { data: { email: C.email, password: C.password, firstName: LONG.slice(0, 60), lastName: LONG.slice(0, 60), streetAddress: LONG, city: LONG.slice(0, 50), postalCode: "29200", phone: "0600000000", acceptedPrivacyPolicy: true } })

// Public pages
await page.goto(`${BASE}/`); await page.evaluate(() => localStorage.setItem("cookie-consent", "accepted")); await page.reload(); await measure("accueil")
await page.goto(`${BASE}/auth/login`); await measure("connexion")
await page.goto(`${BASE}/auth/signup`); await measure("inscription")
await page.goto(`${BASE}/auth/forgot-password`); await measure("mot de passe oublié")
await page.goto(`${BASE}/auth/verify-email?token=abc`); await measure("vérification email")

// Candidate: unverified dashboard + banner with long email, then verified
await login(C.email, C.password)
await measure("dashboard non vérifié")
await page.goto(`${BASE}/apply`); await measure("apply non vérifié")
sql(`UPDATE profiles SET email_verified_at=now() WHERE email='${C.email}'`)
await page.goto(`${BASE}/apply`); await page.locator("#stageName").waitFor()
await page.fill("#stageName", LONG); await page.fill("#musicalStyle", LONG); await page.fill("#biography", LONG.repeat(2))
await page.click("#group"); await page.fill("#firstName-0", LONG.slice(0, 80))
await measure("formulaire candidature (groupe)")
const r = await page.request.post(`${BASE}/api/application/create`, { data: { application_type: "group", stage_name: LONG.slice(0, 100), group_members: [{ firstName: LONG.slice(0, 60), lastName: LONG.slice(0, 60), birthDate: "2011-05-10" }, { firstName: "Ana", lastName: "Bis", birthDate: "2006-04-04" }], biography: LONG.repeat(3), musical_style: LONG.slice(0, 100), instagram: LONG.slice(0, 100), has_stage_experience: true, stage_experience_details: LONG.repeat(2), preferred_audition_date: "2026-10-10", accepted_rules: true } })
console.log("candidature:", r.status())
await page.goto(`${BASE}/dashboard`); await measure("dashboard avec candidature")
await page.goto(`${BASE}/technical-sheet`)
await page.setInputFiles('input[type="file"]', { name: `${LONG}-fiche-technique-version-finale-definitive-2027.pdf`, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 test") })
await measure("fiche technique avec fichier long")
await page.goto(`${BASE}/parental-authorization?memberIndex=0`)
await page.setInputFiles('input[type="file"]', { name: `${LONG}-autorisation.pdf`, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 test") })
await measure("autorisation parentale avec fichier long")

// Admin: validate + slot so every tab has content
await login(ADMIN.email, ADMIN.password)
const apps = await (await page.request.get(`${BASE}/api/admin/applications?edition=2027`)).json()
const app = apps[0]
await page.request.post(`${BASE}/api/admin/time-slots`, { data: { date: "2026-10-10", startTime: "10:00", endTime: "10:30", durationMinutes: 10 } })
const slots = await (await page.request.get(`${BASE}/api/admin/time-slots?edition=2027`)).json()
await page.request.post(`${BASE}/api/admin/time-slots/assign`, { data: { applicationId: app.id, timeSlotId: slots[0].id } })
await page.request.put(`${BASE}/api/admin/applications/status`, { data: { applicationId: app.id, status: "validated" } })
await page.request.post(`${BASE}/api/admin/season/validate`)
await page.request.put(`${BASE}/api/admin/results`, { data: { applicationId: app.id, isFinalist: true } })
await page.request.put(`${BASE}/api/admin/email-templates`, { data: { key: "reminder_j7", subject: LONG, body: `${LONG}\n\n${LONG_EMAIL}` } })
await page.goto(`${BASE}/admin`); await measure("admin candidatures")
await page.getByRole("button", { name: "Détails" }).first().click(); await measure("admin détails candidature"); await page.keyboard.press("Escape")
await page.getByRole("button", { name: "Éditer" }).first().click(); await measure("admin édition candidature"); await page.keyboard.press("Escape")
await page.getByRole("tab", { name: "Créneaux" }).click(); await measure("admin créneaux")
await page.getByRole("tab", { name: "Mode Auditions" }).click(); await measure("admin mode auditions")
await page.getByRole("tab", { name: "Résultats" }).click(); await measure("admin résultats")
await page.getByRole("tab", { name: "Paramètres" }).click(); await page.locator("#template-subject").waitFor()
await page.locator("#template-key").click(); await page.getByRole("option", { name: /Rappel une semaine/ }).click(); await page.waitForTimeout(300)
await measure("admin paramètres")
await page.request.put(`${BASE}/api/admin/vitrine/edition`, { data: { edition: 2027, final_venue: LONG.slice(0, 80), ticket_url: "https://example.org/" + "x".repeat(80), price_label: "à partir de 7 €", jury_winner: LONG.slice(0, 60), public_winner: "Ana", aftermath_text: LONG.repeat(2), finalists: [{ id: "a", name: LONG.slice(0, 60), genre: LONG.slice(0, 50), description: LONG.repeat(2) }, { id: "b", name: "Ana", genre: "Pop" }], tour_dates: [{ date: "2027-07-05", name: LONG.slice(0, 80), city: LONG.slice(0, 40), url: "https://example.org" }] } })
await page.goto(`${BASE}/admin`); await page.getByRole("tab", { name: "Site vitrine" }).click(); await page.locator("#final-venue").waitFor(); await measure("admin site vitrine")
for (const mode of ["preseason", "auditions", "finale", "aftermath"]) {
  await page.goto(`${BASE}/admin/vitrine-preview?mode=${mode}`); await measure(`vitrine ${mode}`)
}
await page.goto(`${BASE}/admin/print/candidates?status=validated`); await measure("impression fiches jury")
await page.goto(`${BASE}/admin/print/day?date=2026-10-10`); await measure("impression ordre de passage")
await page.goto(`${BASE}/dashboard`); await measure("dashboard admin redirigé")

await browser.close()
const failed = results.filter((r) => r.overflow > 0)
console.log(`\n${results.length - failed.length}/${results.length} pages sans débordement`)
process.exit(failed.length ? 1 : 0)
