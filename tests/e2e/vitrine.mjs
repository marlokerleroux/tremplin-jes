import { createRequire } from "node:module"
import { execFileSync } from "node:child_process"
const require = createRequire(import.meta.url)
const { chromium } = require(`${process.env.NPM_GLOBAL_ROOT}/playwright`)

const BASE = process.env.BASE_URL || "http://localhost:3000"
const VITRINE_HOST = "tremplin-jeunes-en-scene.fr"
const ADMIN = { email: "admin@tremplin-jeunes-en-scene.fr", password: "AdminTremplin2027!" }
const results = []
function check(name, ok, detail = "") {
  results.push({ name, ok, detail })
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`)
}
/** Page du site vitrine telle que servie sur son domaine (le middleware route selon l'hôte). */
function vitrine(path = "/") {
  // React insère des commentaires entre les nœuds texte adjacents : on les retire pour comparer le texte visible.
  return execFileSync("curl", ["-s", "-H", `Host: ${VITRINE_HOST}`, `${BASE}${path}`], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }).replace(/<!--.*?-->/g, "")
}
function status(path, host) {
  return execFileSync("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", ...(host ? ["-H", `Host: ${host}`] : []), `${BASE}${path}`], { encoding: "utf8" })
}
const sql = (q) => execFileSync("psql", ["-h", process.env.E2E_PG_HOST ?? "/tmp", "-p", process.env.E2E_PG_PORT ?? "5433", "-U", process.env.E2E_PG_USER ?? "postgres", "-d", "tremplin_e2e", "-tAc", q], { encoding: "utf8" }).trim()

const browser = await chromium.launch()
const ctx = await browser.newContext({ locale: "fr-FR" })
const page = await ctx.newPage()
page.setDefaultTimeout(20000)

try {
  // --- Données reprises par la migration : mode finale, édition 2026
  const home = vitrine("/")
  check("vitrine : mode finale par défaut", /La Finale/.test(home) && /Réserver mes places/.test(home) && /13 mai 2026/.test(home))
  check("vitrine : 6 finalistes 2026 repris", ["Mayti", "Cyel", "Vantage", "Al!ce", "Lilly Jane", "Starfish"].every((n) => home.includes(n)))
  check("vitrine : JSON-LD MusicEvent", /"@type":"MusicEvent"/.test(home) && /billetweb/.test(home))
  check("vitrine : partenaires repris", /Festidreuz/.test(home) && /Seems Fair Studio/.test(home))
  check("vitrine : titre finale 2026", /<title>Tremplin Jeunes en Scène - Finale 2026<\/title>/.test(home))
  check("candidat : /vitrine bloqué", status("/vitrine") === "307", status("/vitrine"))
  check("vitrine : /admin bloqué", status("/admin", VITRINE_HOST) === "307")

  // --- Admin : lecture des réglages
  await page.goto(`${BASE}/auth/login`)
  await page.evaluate(() => localStorage.setItem("cookie-consent", "accepted"))
  await page.reload()
  await page.fill("#email", ADMIN.email)
  await page.fill("#password", ADMIN.password)
  await page.click('button[type="submit"]')
  await page.waitForURL((u) => u.pathname === "/admin")
  const settings = await (await page.request.get(`${BASE}/api/admin/vitrine?edition=2026`)).json()
  check("admin : réglages chargés", settings.config?.mode === "finale" && settings.edition?.finalists?.length === 6 && settings.partners?.length === 16, JSON.stringify({ mode: settings.config?.mode, f: settings.edition?.finalists?.length, p: settings.partners?.length }))
  check("admin : lauréats 2026 initialisés", settings.edition?.jury_winner === "Starfish" && settings.edition?.public_winner === "Cyel")

  // --- Saison 2027 ouverte (dates) puis mode auditions
  sql("UPDATE schedule_config SET edition=2027, registration_opens_at='2026-09-01', registration_closes_at='2026-12-31 23:00', audition_dates=ARRAY['2027-01-30','2027-01-31'], venue='Espace Léo Ferré, Brest'")
  const rBadMode = await page.request.put(`${BASE}/api/admin/vitrine`, { data: { mode: "carnaval" } })
  check("admin : mode inconnu refusé → 400", rBadMode.status() === 400)
  const rAud = await page.request.put(`${BASE}/api/admin/vitrine`, { data: { mode: "auditions", banner_enabled: true, banner_text: "Live des résultats samedi !", banner_url: "https://instagram.com/tremplin", auditions_intro: "Texte d'intro personnalisé." } })
  check("admin : mode auditions enregistré", rAud.status() === 200)
  const aud = vitrine("/")
  check("vitrine auditions : inscriptions ouvertes + bouton candidature", /Inscriptions ouvertes/.test(aud) && /candidat\.tremplin-jeunes-en-scene\.fr\/auth\/signup/.test(aud) && /Je candidate/.test(aud))
  check("vitrine auditions : page d'explication", /Candidater/.test(aud) && /Texte d&#x27;intro personnalisé\.|Texte d'intro personnalisé\./.test(aud) && /Les conditions/.test(aud) && /Comment ça marche/.test(aud))
  check("vitrine auditions : dates d'audition et lieu", /30 janvier 2027/.test(aud) && /Espace Léo Ferré/.test(aud))
  check("vitrine auditions : bandeau d'annonce", /Live des résultats samedi !/.test(aud))
  check("vitrine auditions : palmarès 2026 (Starfish, Cyel)", /Palmarès 2026/.test(aud) && /Starfish/.test(aud) && /Prix du public/.test(aud))
  check("vitrine auditions : titre inscriptions 2027", /<title>Tremplin Jeunes en Scène - Inscriptions 2027<\/title>/.test(aud) && !/MusicEvent/.test(aud))

  // Inscriptions closes → le hero change tout seul
  sql("UPDATE schedule_config SET registration_closes_at='2026-09-01 10:00'")
  await page.request.put(`${BASE}/api/admin/vitrine`, { data: { mode: "auditions", banner_enabled: false } })
  const closed = vitrine("/")
  check("vitrine auditions : inscriptions closes automatiquement", /Inscriptions closes/.test(closed) && !/Je candidate/.test(closed))

  // --- Mode avant-ouverture
  sql("UPDATE schedule_config SET registration_opens_at='2027-10-15 08:00', registration_closes_at='2027-12-31 23:00'")
  await page.request.put(`${BASE}/api/admin/vitrine`, { data: { mode: "preseason", banner_enabled: false, preseason_text: "Accroche 2027." } })
  const pre = vitrine("/")
  check("vitrine avant-ouverture : date d'ouverture + palmarès", /Bientôt de retour/.test(pre) && /15 octobre 2027/.test(pre) && /Palmarès 2026/.test(pre))

  // --- Édition 2027 : validation lauréat, puis après-finale avec tournée
  const rBadWinner = await page.request.put(`${BASE}/api/admin/vitrine/edition`, { data: { edition: 2027, jury_winner: "Inconnu", finalists: [{ id: "a", name: "Les Embruns", genre: "Folk" }] } })
  check("admin : lauréat hors liste refusé → 400", rBadWinner.status() === 400)
  const rEd = await page.request.put(`${BASE}/api/admin/vitrine/edition`, {
    data: {
      edition: 2027,
      final_date: "2027-05-12T18:00:00.000Z",
      final_venue: "Le Vauban",
      final_city: "Brest",
      ticket_url: "https://www.billetweb.fr/finale-2027",
      price_label: "à partir de 8 €",
      jury_winner: "Les Embruns",
      public_winner: "Léa Solo",
      aftermath_text: "Merci à toutes et à tous !",
      aftermath_video_url: "https://www.youtube.com/watch?v=t-jooYuxiWI",
      finalists: [
        { id: "a", name: "Les Embruns", genre: "Folk", description: "Trio folk", youtubeId: "zV89QknrueM" },
        { id: "b", name: "Léa Solo", genre: "Pop" },
      ],
      tour_dates: [
        { date: "2027-08-10", name: "Festidreuz", city: "Fouesnant", url: "https://www.festidreuz.fr" },
        { date: "2027-07-05", name: "Ouestival", city: "Brest" },
      ],
    },
  })
  check("admin : édition 2027 enregistrée", rEd.status() === 200, String(rEd.status()))
  await page.request.put(`${BASE}/api/admin/vitrine`, { data: { mode: "finale", banner_enabled: false } })
  const fin = vitrine("/")
  check("vitrine finale 2027 : date, billetterie, finalistes", /12 mai 2027/.test(fin) && /billetweb\.fr\/finale-2027/.test(fin) && /Les Embruns/.test(fin) && /à partir de 8 €/.test(fin))
  await page.request.put(`${BASE}/api/admin/vitrine`, { data: { mode: "aftermath", banner_enabled: false } })
  const after = vitrine("/")
  check("vitrine après-finale : lauréats et remerciements", /Merci !/.test(after) && /Bravo à Les Embruns/.test(after) && /Merci à toutes et à tous !/.test(after) && /youtube\.com\/embed\/t-jooYuxiWI/.test(after))
  // Le HTML est diffusé en flux (l'ordre des fragments ne suit pas l'ordre visuel) : l'ordre se vérifie dans le DOM de l'aperçu.
  await page.goto(`${BASE}/admin/vitrine-preview?mode=aftermath`)
  const tourItems = await page.locator("#tournee li").allTextContents()
  check("vitrine après-finale : tournée triée par date", /La tournée de l&#x27;été|La tournée de l'été/.test(after) && tourItems.length === 2 && /Ouestival/.test(tourItems[0]) && /Festidreuz/.test(tourItems[1]) && /Fouesnant/.test(tourItems[1]), tourItems.join(" | "))
  check("vitrine après-finale : titre lauréats", /<title>Tremplin Jeunes en Scène - Lauréats 2027<\/title>/.test(after))

  // --- Partenaires : désactivation et réordonnancement
  const partners = settings.partners
  const rPartners = await page.request.put(`${BASE}/api/admin/vitrine/partners`, {
    data: { partners: [...partners.slice(1).map((p) => ({ id: p.id, name: p.name, logo_url: p.logo_url, url: p.url, is_active: p.name !== "Bibus" })), { id: null, name: "Nouveau partenaire", logo_url: partners[0].logo_url, url: "https://example.org", is_active: true }] },
  })
  const saved = await rPartners.json()
  check("admin : partenaires enregistrés (suppression, ajout, désactivation)", rPartners.status() === 200 && saved.partners.length === 16 && !saved.partners.some((p) => p.name === "Festidreuz") && saved.partners.some((p) => p.name === "Nouveau partenaire"), String(rPartners.status()))
  const withPartners = vitrine("/")
  check("vitrine : partenaire désactivé masqué, nouveau affiché, supprimé absent", !/title="Bibus"/.test(withPartners) && /title="Nouveau partenaire"/.test(withPartners) && !/title="Festidreuz"/.test(withPartners))

  // --- Aperçu privé et médias
  await page.goto(`${BASE}/admin/vitrine-preview?mode=preseason`)
  const preview = await page.textContent("body")
  check("aperçu privé : mode forcé sans publication", /Aperçu privé/.test(preview) && /Bientôt de retour/.test(preview))
  await ctx.clearCookies()
  check("aperçu privé : réservé aux admins", status("/admin/vitrine-preview?mode=finale") === "307")
  check("média : identifiant inconnu → 404", status("/api/vitrine/media/00000000-0000-0000-0000-000000000000") === "404")
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await page.goto(`${BASE}/auth/login`)
    await page.fill("#email", ADMIN.email)
    await page.fill("#password", ADMIN.password)
    await page.click('button[type="submit"]')
    await page.waitForURL((u) => u.pathname === "/admin")
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64")
    const rUp = await page.request.post(`${BASE}/api/admin/vitrine/media`, { multipart: { file: { name: "test.png", mimeType: "image/png", buffer: png } } })
    const up = await rUp.json()
    check("média : envoi d'une image → URL publique", rUp.status() === 200 && /^\/api\/vitrine\/media\/[0-9a-f-]{36}$/.test(up.url ?? ""), JSON.stringify(up))
    if (up.url) {
      const served = execFileSync("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code} %{content_type}", `${BASE}${up.url}`], { encoding: "utf8" })
      check("média : image servie publiquement avec cache", served.startsWith("200 image/png"), served)
    }
    const rBad = await page.request.post(`${BASE}/api/admin/vitrine/media`, { multipart: { file: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("not an image") } } })
    check("média : faux PNG refusé → 400", rBad.status() === 400)
  } else {
    console.log("SKIP média : BLOB_READ_WRITE_TOKEN absent")
  }
} catch (error) {
  console.error("E2E ERROR:", error)
  results.push({ name: "exception", ok: false, detail: String(error) })
} finally {
  await browser.close()
}
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
