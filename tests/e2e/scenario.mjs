import { createRequire } from "node:module"
import { execFileSync } from "node:child_process"
import { startSmtpCatcher } from "./smtp-catcher.mjs"
const require = createRequire(import.meta.url)
const { chromium } = require(`${process.env.NPM_GLOBAL_ROOT}/playwright`)

const BASE = process.env.BASE_URL || "http://localhost:3000"
const CRON_SECRET = process.env.CRON_SECRET
const ADMIN = { email: "admin@tremplin-jeunes-en-scene.fr", password: "AdminTremplin2027!" }
const C1 = { email: "lea.test@example.fr", password: "MotDePasse123!", first: "Léa", last: "Test", stage: "Léa Solo" }
const C2 = { email: "tom.test@example.fr", password: "MotDePasse123!", first: "Tom", last: "Groupe", stage: "Les Embruns" }
const results = []
function check(name, ok, detail = "") {
  results.push({ name, ok, detail })
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`)
}
function sql(query) {
  return execFileSync("psql", ["-h", process.env.E2E_PG_HOST ?? "/tmp", "-p", process.env.E2E_PG_PORT ?? "5433", "-U", process.env.E2E_PG_USER ?? "postgres", "-d", "tremplin_e2e", "-tAc", query], { encoding: "utf8" }).trim()
}
function isoPlusDays(days) {
  const d = new Date()
  const paris = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d)
  const [y, m, dd] = paris.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, dd + days)).toISOString().slice(0, 10)
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
async function waitForMail(catcher, predicate, timeout = 15000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const found = catcher.messages.find(predicate)
    if (found) return found
    await wait(200)
  }
  return null
}

const catcher = startSmtpCatcher(2525)
const browser = await chromium.launch()
const ctx = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris" })
const page = await ctx.newPage()
page.setDefaultTimeout(20000)
const pageErrors = []
page.on("pageerror", (e) => pageErrors.push(e.message))

async function login(email, password) {
  await page.goto(`${BASE}/auth/login`)
  await page.fill("#email", email)
  await page.fill("#password", password)
  await page.click('button[type="submit"]')
  await page.waitForURL((u) => /\/(admin|dashboard)/.test(u.pathname), { timeout: 20000 })
}
async function logout() {
  await ctx.clearCookies()
}
async function signup(c) {
  await page.goto(`${BASE}/auth/signup`)
  await page.evaluate(() => localStorage.setItem("cookie-consent", "accepted"))
  await page.reload()
  await page.fill("#firstName", c.first)
  await page.fill("#lastName", c.last)
  await page.fill("#email", c.email)
  await page.fill("#streetAddress", "12 rue de Siam")
  await page.fill("#postalCode", "29200")
  await page.fill("#city", "Brest")
  await page.fill("#phone", "06 12 34 56 78")
  await page.fill("#password", c.password)
  await page.fill("#confirmPassword", c.password)
  await page.click("#acceptedPrivacyPolicy")
  await page.click('button[type="submit"]')
  await page.waitForURL((u) => u.pathname === "/dashboard", { timeout: 30000 })
}

try {
  // --- Cron protection
  const rCron1 = await page.request.get(`${BASE}/api/cron/reminders`)
  check("cron sans jeton → 401", rCron1.status() === 401, String(rCron1.status()))
  const rCron2 = await page.request.get(`${BASE}/api/cron/reminders`, { headers: { authorization: `Bearer ${CRON_SECRET}` } })
  const cronBody = await rCron2.json()
  check("cron avec jeton → 200 (planning non validé)", rCron2.status() === 200 && cronBody.reminders?.scheduleValidated === false, `${rCron2.status()} ${JSON.stringify(cronBody)}`)

  // --- Admin: open season 2027 and slots
  await login(ADMIN.email, ADMIN.password)
  await page.getByRole("tab", { name: "Paramètres" }).click()
  await page.fill("#new-edition", "2027")
  await page.getByRole("button", { name: /Ouvrir la saison 2027/ }).click()
  await page.getByRole("button", { name: "Ouvrir la saison" }).click()
  await page.getByText(/Saison 2027 ouverte/).waitFor()
  await page.fill("#season-closes", "2026-12-31T23:59")
  await page.fill("#season-venue", "Espace Léo Ferré, Brest")
  await page.getByRole("button", { name: /Enregistrer la saison/ }).click()
  await page.getByText(/Paramètres de la saison enregistrés/).waitFor()
  await page.fill("#slot-date", "2027-01-30")
  await page.fill("#slot-start", "10:00")
  await page.fill("#slot-end", "11:00")
  await page.fill("#slot-duration", "10")
  await page.getByRole("button", { name: /Générer les créneaux/ }).click()
  await page.getByText(/6 créneau\(x\) créé\(s\)/).waitFor()
  check("saison 2027 ouverte avec 6 créneaux", true)

  // --- Email templates panel (UI) + API
  await page.getByText("Modèles d'emails", { exact: true }).waitFor()
  await page.locator("#template-subject").waitFor()
  const tplList = await (await page.request.get(`${BASE}/api/admin/email-templates`)).json()
  check("7 modèles d'emails listés", tplList.templates?.length === 7, String(tplList.templates?.length))
  const rPut = await page.request.put(`${BASE}/api/admin/email-templates`, {
    data: { key: "results_selected", subject: "Bravo {{nom_scene}} !", body: "Bonjour {{prenom}},\n\n<b>Finaliste</b> édition {{edition}}. Voir {{lien_espace}}" },
  })
  check("modèle personnalisé enregistré", rPut.status() === 200 && (await rPut.json()).template?.isCustomized === true, String(rPut.status()))
  const rPrev = await page.request.post(`${BASE}/api/admin/email-templates/preview`, {
    data: { key: "results_selected", subject: "Bravo {{nom_scene}} !", body: "Bonjour {{prenom}},\n\n<b>Finaliste</b> édition {{edition}}. Voir {{lien_espace}}" },
  })
  const prev = await rPrev.json()
  check("aperçu : variables remplacées et HTML échappé", prev.subject === "Bravo Les Embruns !" && prev.html.includes("&lt;b&gt;Finaliste&lt;/b&gt;") && prev.html.includes('<a href="https://candidat.tremplin-jeunes-en-scene.fr/dashboard"'), prev.subject)
  await page.locator("#template-key").click()
  await page.getByRole("option", { name: /Résultats : finaliste/ }).click()
  await page.fill("#template-subject", "Bravo {{nom_scene}} !")
  await page.getByRole("button", { name: "Aperçu", exact: true }).click()
  await page.getByText(/Aperçu : Bravo Les Embruns !/).waitFor()
  check("aperçu UI ouvert avec le modèle personnalisé", true)
  await page.keyboard.press("Escape")
  const rTest = await page.request.post(`${BASE}/api/admin/email-templates/test`, { data: { key: "reminder_j1", subject: "Test {{prenom}}", body: "Corps {{date_audition}}" } })
  check("email de test envoyé à l'admin", rTest.status() === 200, String(rTest.status()))
  const testMail = await waitForMail(catcher, (m) => m.subject.includes("[Test] Test Léa"))
  check("email de test reçu par SMTP", Boolean(testMail) && testMail.to.includes(ADMIN.email) && testMail.text.includes("samedi 30 janvier 2027"), testMail?.subject)
  const rReset = await page.request.delete(`${BASE}/api/admin/email-templates`, { data: { key: "results_selected" } })
  check("modèle réinitialisé", rReset.status() === 200 && (await rReset.json()).template?.isCustomized === false, String(rReset.status()))

  // --- Règlement modifiable (Paramètres) publié en PDF
  await page.getByText("Règlement du tremplin", { exact: true }).waitFor()
  const rules = await (await page.request.get(`${BASE}/api/admin/reglement`)).json()
  const datesVar = rules.variables?.find((v) => v.key === "dates_auditions")
  check("règlement par défaut et variables de saison", rules.rules?.isCustomized === false && /samedi 30 janvier 2027/.test(datesVar?.value ?? ""), datesVar?.value)
  const pdfDefault = await page.request.get(`${BASE}/pdf/reglement.pdf`)
  const pdfDefaultBody = await pdfDefault.body()
  check("PDF du règlement généré", pdfDefault.status() === 200 && pdfDefault.headers()["content-type"] === "application/pdf" && pdfDefaultBody.subarray(0, 5).toString() === "%PDF-", String(pdfDefault.status()))
  const rRulesPut = await page.request.put(`${BASE}/api/admin/reglement`, { data: { title: "Règlement {{saison}}", body: "# Article unique\n\n- Inscriptions avant le **{{date_cloture}}**." } })
  check("règlement personnalisé enregistré", rRulesPut.status() === 200 && (await rRulesPut.json()).rules?.isCustomized === true, String(rRulesPut.status()))
  const pdfCustom = await (await page.request.get(`${BASE}/pdf/reglement.pdf`)).body()
  check("PDF publié mis à jour immédiatement", pdfCustom.length > 0 && pdfCustom.length < pdfDefaultBody.length, `${pdfDefaultBody.length} -> ${pdfCustom.length}`)
  const rRulesPreview = await page.request.post(`${BASE}/api/admin/reglement/preview`, { data: { title: "Aperçu", body: "Texte" } })
  check("aperçu PDF du règlement", rRulesPreview.status() === 200 && rRulesPreview.headers()["content-type"] === "application/pdf", String(rRulesPreview.status()))
  const rRulesEmpty = await page.request.put(`${BASE}/api/admin/reglement`, { data: { title: "Règlement", body: "  " } })
  check("règlement vide refusé", rRulesEmpty.status() === 400, String(rRulesEmpty.status()))
  const rRulesReset = await page.request.delete(`${BASE}/api/admin/reglement`)
  check("règlement réinitialisé", rRulesReset.status() === 200 && (await rRulesReset.json()).rules?.isCustomized === false, String(rRulesReset.status()))
  await logout()
  const rRulesAnon = await page.request.put(`${BASE}/api/admin/reglement`, { data: { title: "x", body: "x" } })
  check("modification du règlement réservée aux admins", rRulesAnon.status() === 401 || rRulesAnon.status() === 403, String(rRulesAnon.status()))
  const pdfAnon = await page.request.get(`${BASE}/pdf/reglement.pdf`)
  check("PDF du règlement public", pdfAnon.status() === 200, String(pdfAnon.status()))

  // --- Candidate 1: signup, verification gate
  catcher.messages.length = 0
  await signup(C1)
  const dash = await page.textContent("body")
  check("dashboard après inscription : bandeau de vérification", /Confirmez votre adresse email/.test(dash) && /Adresse email à confirmer/.test(dash))
  const welcome = await waitForMail(catcher, (m) => m.to.includes(C1.email) && /Bienvenue/.test(m.subject))
  const verifyLink = welcome && /https?:\/\/[^\s"<>]+\/auth\/verify-email\?token=[a-f0-9]{64}/.exec(welcome.text)?.[0]
  check("email de bienvenue avec lien de vérification", Boolean(verifyLink), welcome?.subject)
  const rCreateBlocked = await page.request.post(`${BASE}/api/application/create`, {
    data: { application_type: "solo", stage_name: "X", group_members: [{ firstName: "", lastName: "", birthDate: "2008-01-01" }], biography: "b".repeat(120), musical_style: "Rock", accepted_rules: true },
  })
  check("création refusée tant que l'email n'est pas vérifié → 403", rCreateBlocked.status() === 403, String(rCreateBlocked.status()))
  await page.goto(`${BASE}/apply`)
  check("page /apply : bandeau au lieu du formulaire", /Confirmez votre adresse email/.test(await page.textContent("body")) && (await page.locator("#stageName").count()) === 0)
  // Resend + change email flow
  const rResend = await page.request.post(`${BASE}/api/auth/resend-verification`, { data: { email: "LEA.new@example.fr" } })
  const resendBody = await rResend.json()
  check("correction d'adresse + renvoi → 200", rResend.status() === 200 && resendBody.email === "lea.new@example.fr", `${rResend.status()} ${JSON.stringify(resendBody)}`)
  const resent = await waitForMail(catcher, (m) => m.to.includes("lea.new@example.fr"))
  const verifyLink2 = resent && /https?:\/\/[^\s"<>]+\/auth\/verify-email\?token=[a-f0-9]{64}/.exec(resent.text)?.[0]
  check("nouveau lien reçu sur la nouvelle adresse", Boolean(verifyLink2))
  const rResendFast = await page.request.post(`${BASE}/api/auth/resend-verification`, { data: {} })
  check("renvoi immédiat limité → 429", rResendFast.status() === 429, String(rResendFast.status()))
  await page.goto(verifyLink.replace(/^https?:\/\/[^/]+/, BASE))
  check("ancien lien invalidé", /Lien invalide/.test(await page.textContent("body")))
  await page.goto(verifyLink2.replace(/^https?:\/\/[^/]+/, BASE))
  check("nouveau lien : adresse confirmée", /Adresse email confirmée/.test(await page.textContent("body")))
  await page.goto(verifyLink2.replace(/^https?:\/\/[^/]+/, BASE))
  check("lien réutilisé : déjà confirmée ou invalide", /déjà confirmée|invalide/.test(await page.textContent("body")))
  C1.email = "lea.new@example.fr"

  // --- Draft + application
  await page.goto(`${BASE}/apply`)
  await page.locator("#stageName").waitFor()
  await page.fill("#stageName", C1.stage)
  await page.fill("#soloBirthDate", "2010-05-10")
  await page.fill("#biography", "Biographie de test suffisamment longue pour dépasser la limite des cent caractères imposée par le formulaire de candidature.")
  await page.fill("#musicalStyle", "Pop")
  await wait(900)
  await page.reload()
  await page.getByText(/Brouillon restauré/).waitFor()
  check("brouillon restauré après rechargement", (await page.inputValue("#stageName")) === C1.stage && (await page.inputValue("#musicalStyle")) === "Pop")
  await page.click("#acceptedRules")
  await page.click('button[type="submit"]')
  await page.waitForURL((u) => u.pathname === "/dashboard", { timeout: 30000 })
  check("candidature créée", /Léa Solo/.test(await page.textContent("body")))
  const draftLeft = await page.evaluate(() => localStorage.getItem("tremplin:candidature:2027"))
  check("brouillon effacé après envoi", draftLeft === null)
  const adminNotif = await waitForMail(catcher, (m) => m.to.includes(ADMIN.email) && /Nouvelle candidature : Léa Solo/.test(m.subject))
  check("notification admin nouvelle candidature", Boolean(adminNotif) && /Artiste solo/.test(adminNotif.text))
  await logout()

  // --- Candidate 2 via API (group, verified through DB token)
  const rSignup2 = await page.request.post(`${BASE}/api/auth/signup`, {
    data: { email: C2.email, password: C2.password, firstName: C2.first, lastName: C2.last, streetAddress: "1 rue", city: "Brest", postalCode: "29200", phone: "0600000000", acceptedPrivacyPolicy: true },
  })
  check("signup candidat 2 → 200", rSignup2.status() === 200)
  const token2 = sql(`SELECT email_verification_token FROM profiles WHERE email='${C2.email}'`)
  await login(C2.email, C2.password)
  await page.goto(`${BASE}/auth/verify-email?token=${token2}`)
  check("candidat 2 vérifié via jeton", /Adresse email confirmée/.test(await page.textContent("body")))
  const rCreate2 = await page.request.post(`${BASE}/api/application/create`, {
    data: { application_type: "group", stage_name: C2.stage, group_members: [{ firstName: "Tom", lastName: "Groupe", birthDate: "2005-03-03" }, { firstName: "Ana", lastName: "Bis", birthDate: "2006-04-04" }], biography: "b".repeat(120), musical_style: "Folk", accepted_rules: true },
  })
  check("candidature 2 créée", rCreate2.status() === 200, String(rCreate2.status()))
  await logout()

  // --- Admin: validate both, slots, schedule validation → convocation with .ics
  await login(ADMIN.email, ADMIN.password)
  const apps = await (await page.request.get(`${BASE}/api/admin/applications?edition=2027`)).json()
  const app1 = apps.find((a) => a.stage_name === C1.stage)
  const app2 = apps.find((a) => a.stage_name === C2.stage)
  check("2 candidatures visibles en admin", Boolean(app1 && app2))
  const rFinalistPending = await page.request.put(`${BASE}/api/admin/results`, { data: { applicationId: app1.id, isFinalist: true } })
  check("finaliste refusé si non validée → 400", rFinalistPending.status() === 400, String(rFinalistPending.status()))
  catcher.messages.length = 0
  for (const app of [app1, app2]) {
    const r = await page.request.put(`${BASE}/api/admin/applications/status`, { data: { applicationId: app.id, status: "validated" } })
    check(`validation ${app.stage_name} → email envoyé`, r.status() === 200 && (await r.json()).emailSent === true)
  }
  const validatedMail = await waitForMail(catcher, (m) => m.to.includes(C2.email) && /Candidature validée/.test(m.subject))
  check("email de validation avec nom de scène substitué", Boolean(validatedMail) && validatedMail.text.includes("Les Embruns") && validatedMail.subject.includes("2027"), validatedMail?.subject)
  const slots = await (await page.request.get(`${BASE}/api/admin/time-slots?edition=2027`)).json()
  await page.request.post(`${BASE}/api/admin/time-slots/assign`, { data: { applicationId: app1.id, timeSlotId: slots[0].id } })
  await page.request.post(`${BASE}/api/admin/time-slots/assign`, { data: { applicationId: app2.id, timeSlotId: slots[1].id } })
  catcher.messages.length = 0
  const rValidate = await page.request.post(`${BASE}/api/admin/season/validate`)
  const validateBody = await rValidate.json()
  check("planning validé : 2 convocations", rValidate.status() === 200 && validateBody.emails?.sent === 2, JSON.stringify(validateBody.emails))
  const convocation = await waitForMail(catcher, (m) => m.to.includes(C1.email) && /convocation/i.test(m.subject))
  check("convocation avec pièce jointe .ics", Boolean(convocation) && /text\/calendar/.test(convocation.raw) && /BEGIN:VCALENDAR/.test(convocation.text) && /DTSTART:20270130T090000Z/.test(convocation.text) && /samedi 30 janvier 2027/.test(convocation.text), convocation?.subject)

  // --- Reminders (move slots to J+7 then J+1)
  const rRun0 = await page.request.post(`${BASE}/api/admin/reminders/run`)
  const run0 = (await rRun0.json()).result
  check("rappels : rien à envoyer (audition lointaine)", run0.sent.j7 === 0 && run0.sent.j1 === 0 && run0.candidates === 2, JSON.stringify(run0))
  sql(`UPDATE time_slots SET date='${isoPlusDays(7)}' WHERE edition=2027`)
  catcher.messages.length = 0
  const run7 = (await (await page.request.post(`${BASE}/api/admin/reminders/run`)).json()).result
  check("rappels J-7 envoyés à 2 candidats", run7.sent.j7 === 2 && run7.sent.j1 === 0, JSON.stringify(run7))
  const j7mail = await waitForMail(catcher, (m) => m.to.includes(C2.email) && /approche/.test(m.subject))
  check("email J-7 reçu avec heure de passage", Boolean(j7mail) && /10:10/.test(j7mail.text))
  const run7b = (await (await page.request.post(`${BASE}/api/admin/reminders/run`)).json()).result
  check("rappels J-7 idempotents", run7b.sent.j7 === 0 && run7b.sent.j1 === 0, JSON.stringify(run7b))
  sql(`UPDATE time_slots SET date='${isoPlusDays(1)}' WHERE edition=2027`)
  const rCron3 = await page.request.get(`${BASE}/api/cron/reminders`, { headers: { authorization: `Bearer ${CRON_SECRET}` } })
  const cron3 = await rCron3.json()
  check("cron : rappels J-1 envoyés", rCron3.status() === 200 && cron3.reminders?.sent?.j1 === 2, JSON.stringify(cron3))
  const j1mail = await waitForMail(catcher, (m) => m.to.includes(C1.email) && /demain/.test(m.subject))
  check("email J-1 reçu", Boolean(j1mail))
  sql(`UPDATE time_slots SET date='2027-01-30' WHERE edition=2027`)

  // --- Print pages
  const rPrint = await page.request.get(`${BASE}/admin/print/candidates?status=validated`)
  const printHtml = await rPrint.text()
  check("fiches jury imprimables (2 fiches, grille jury)", rPrint.status() === 200 && printHtml.includes("Léa Solo") && printHtml.includes("Les Embruns") && printHtml.includes("Évaluation du jury"), String(rPrint.status()))
  const rPrint1 = await page.request.get(`${BASE}/admin/print/candidates?id=${app2.id}`)
  const print1 = await rPrint1.text()
  check("fiche individuelle", print1.includes("Les Embruns") && !print1.includes("Léa Solo") && /Ana Bis/.test(print1))
  const rDay = await page.request.get(`${BASE}/admin/print/day?date=2027-01-30`)
  const dayHtml = await rDay.text()
  check("ordre de passage du 30/01/2027", rDay.status() === 200 && dayHtml.includes("Ordre de passage") && dayHtml.indexOf("Léa Solo") < dayHtml.indexOf("Les Embruns"))
  await page.goto(`${BASE}/admin`)
  await page.getByRole("tab", { name: "Mode Auditions" }).click()
  await page.getByRole("link", { name: /Ordre de passage/ }).first().waitFor()
  check("liens d'impression dans Mode Auditions", true)

  // --- Results tab
  await page.getByRole("tab", { name: "Résultats" }).click()
  await page.getByText(/Annonce des résultats/).waitFor()
  await page.getByLabel(`Finaliste : ${C1.stage}`).click()
  await page.getByText("Finaliste", { exact: true }).waitFor()
  check("finaliste coché dans l'onglet Résultats", true)
  catcher.messages.length = 0
  await page.getByRole("button", { name: /Envoyer les résultats \(2\)/ }).click()
  await page.getByRole("button", { name: "Envoyer", exact: true }).click()
  await page.getByText(/Résultats envoyés/).first().waitFor()
  const selectedMail = await waitForMail(catcher, (m) => m.to.includes(C1.email) && /finaliste/i.test(m.subject))
  const notSelectedMail = await waitForMail(catcher, (m) => m.to.includes(C2.email) && /Résultats des auditions/.test(m.subject))
  check("emails de résultats : finaliste + non retenu", Boolean(selectedMail && notSelectedMail) && /Les Embruns/.test(notSelectedMail.text))
  await page.getByText(/Envoyé le/).first().waitFor()
  const rSendAgain = await page.request.post(`${BASE}/api/admin/results/send`, { data: {} })
  const again = (await rSendAgain.json()).report
  check("second envoi : déjà informés ignorés", again.skipped === 2 && again.selected === 0, JSON.stringify(again))
  const exportRows = await (await page.request.get(`${BASE}/api/applications/export?edition=2027`)).json()
  check("export : colonne Finaliste", exportRows.some((r) => r["Nom de scène"] === C1.stage && r.Finaliste === "Oui") && exportRows.some((r) => r["Nom de scène"] === C2.stage && r.Finaliste === "Non"))

  // --- Rejection email
  catcher.messages.length = 0
  const rReject = await page.request.put(`${BASE}/api/admin/applications/status`, { data: { applicationId: app2.id, status: "rejected" } })
  check("refus → email envoyé", rReject.status() === 200 && (await rReject.json()).emailSent === true)
  const rejectMail = await waitForMail(catcher, (m) => m.to.includes(C2.email) && /Votre candidature/.test(m.subject))
  check("email de refus reçu", Boolean(rejectMail) && /ne pouvons pas la retenir/.test(rejectMail.text))
  await logout()

  // --- Candidate 1 sees finalist banner
  await login(C1.email, C1.password)
  const dashFinal = await page.textContent("body")
  check("candidat : bannière finaliste", /Vous êtes finaliste/.test(dashFinal) && !/Confirmez votre adresse/.test(dashFinal))
  await logout()
} catch (error) {
  console.error("E2E ERROR:", error)
  await page.screenshot({ path: "/tmp/e2e-failure.png", fullPage: true }).catch(() => {})
  results.push({ name: "exception", ok: false, detail: String(error) })
} finally {
  await browser.close()
  catcher.close()
}

if (pageErrors.length) console.log("PAGE ERRORS:", pageErrors)
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
