import { getSiteUrl } from "@/lib/site-url"
import { LOGO_CID } from "./logo"

/** Échappe les valeurs interpolées dans le HTML des emails. */
export function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export interface EmailAttachment {
  filename: string
  content: string | Buffer
  contentType: string
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
  attachments?: EmailAttachment[]
}

interface BaseEmailData {
  firstName: string
  lastName: string
}

// Charte graphique du tremplin : bandeau sombre avec le logo (blocs rose / bleu / jaune),
// Montserrat, titres en capitales, bouton rose à angles droits comme sur le site vitrine.
export const BRAND = {
  blue: "#246BDC",
  pink: "#E62785",
  yellow: "#FFD00F",
  dark: "#1B0B3B",
  text: "#1F1235",
  muted: "#6B6480",
  background: "#F3F1F8",
} as const

const FONT_STACK = "'Montserrat', 'Helvetica Neue', Helvetica, Arial, sans-serif"

/** Bouton d'action principal (styles en ligne pour les messageries qui ignorent les feuilles de style). */
export function ctaButton(url: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0;">
      <tr>
        <td style="background: ${BRAND.pink}; box-shadow: 4px 4px 0 ${BRAND.yellow};">
          <a href="${escapeHtml(url)}" style="display: inline-block; padding: 14px 28px; font-family: ${FONT_STACK}; font-size: 14px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #ffffff; text-decoration: none;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`
}

/** Encadré d'information (bordure bleue, fond clair). */
export function infoBox(content: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
      <tr>
        <td style="background: #EEF3FC; border-left: 5px solid ${BRAND.blue}; padding: 16px 18px; font-family: ${FONT_STACK}; font-size: 15px; line-height: 1.6; color: ${BRAND.text};">${content}</td>
      </tr>
    </table>`
}

// Template de base avec la charte du site
export function getEmailLayout(content: string): string {
  const siteUrl = getSiteUrl()
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>Tremplin Jeunes en Scène</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap');
    body { margin: 0; padding: 0; background: ${BRAND.background}; }
    .content h2 { font-family: ${FONT_STACK}; font-size: 24px; line-height: 1.2; font-weight: 800; text-transform: uppercase; color: ${BRAND.blue}; margin: 0 0 18px 0; }
    .content p { margin: 0 0 16px 0; }
    .content ol, .content ul { margin: 0 0 16px 0; padding-left: 22px; }
    .content li { margin-bottom: 6px; }
    .content a { color: ${BRAND.blue}; }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; }
      .content-cell { padding: 28px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background: ${BRAND.background};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${BRAND.background};">
    <tr>
      <td align="center" style="padding: 32px 12px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 600px; max-width: 100%; background: #ffffff;">
          <tr>
            <td align="center" style="background: ${BRAND.dark}; padding: 32px 24px 28px 24px;">
              <a href="${siteUrl}" style="text-decoration: none;">
                <img src="cid:${LOGO_CID}" alt="Tremplin Jeunes en Scène" width="260" height="107" style="display: block; width: 260px; max-width: 100%; height: auto; border: 0;">
              </a>
            </td>
          </tr>
          <tr>
            <td style="background: ${BRAND.yellow}; height: 6px; line-height: 6px; font-size: 6px;">&nbsp;</td>
          </tr>
          <tr>
            <td class="content-cell content" style="padding: 36px 40px; font-family: ${FONT_STACK}; font-size: 16px; line-height: 1.6; color: ${BRAND.text};">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background: ${BRAND.dark}; padding: 24px 40px; font-family: ${FONT_STACK}; font-size: 13px; line-height: 1.6; color: #C9C2DD;">
              <p style="margin: 0 0 4px 0; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #ffffff;">Tremplin Jeunes en Scène</p>
              <p style="margin: 0 0 12px 0; color: ${BRAND.yellow}; font-weight: 700;">Organisé par Pass'Musique</p>
              <p style="margin: 0;">
                <a href="${siteUrl}" style="color: #ffffff; text-decoration: underline;">Espace candidat</a>
                &nbsp;·&nbsp;
                <a href="https://www.tremplin-jeunes-en-scene.fr" style="color: #ffffff; text-decoration: underline;">Site du tremplin</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

// 1. Email de bienvenue après création du compte (avec lien de vérification de l'adresse)
export function getWelcomeEmail(data: BaseEmailData & { verifyUrl: string }): EmailTemplate {
  const content = `
    <h2>Bienvenue ${escapeHtml(data.firstName)} !</h2>
    <p>Votre compte a été créé avec succès. Nous sommes ravis de vous accueillir pour le Tremplin Jeunes en Scène !</p>

    ${infoBox(`
      <strong>Dernière étape : confirmez votre adresse email</strong><br>
      Cliquez sur le bouton ci-dessous pour vérifier votre adresse. C'est indispensable pour déposer votre candidature
      et recevoir votre convocation.
    `)}

    ${ctaButton(data.verifyUrl, "Confirmer mon adresse email")}

    <p style="color: #666; font-size: 14px;">
      Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
      <a href="${escapeHtml(data.verifyUrl)}" style="color: #246BDC;">${escapeHtml(data.verifyUrl)}</a>
    </p>

    <p style="margin-top: 30px;"><strong>Ensuite :</strong></p>
    <ol style="margin: 10px 0; padding-left: 20px;">
      <li>Complétez votre candidature en ligne</li>
      <li>Envoyez votre fiche technique (et l'autorisation parentale pour les mineurs)</li>
      <li>Attendez la validation de votre dossier</li>
    </ol>

    <p style="margin-top: 30px; color: #666; font-size: 14px;">
      Si vous avez des questions, n'hésitez pas à nous contacter.
    </p>
  `

  return {
    subject: "Bienvenue ! Confirmez votre adresse email - Tremplin Jeunes en Scène",
    html: getEmailLayout(content),
    text: `Bienvenue ${data.firstName} !\n\nVotre compte a été créé avec succès. Confirmez votre adresse email pour pouvoir déposer votre candidature : ${data.verifyUrl}\n\nTremplin Jeunes en Scène - Organisé par Pass'Musique`,
  }
}

// 1 bis. Renvoi du lien de vérification de l'adresse email
export function getVerificationEmail(data: BaseEmailData & { verifyUrl: string }): EmailTemplate {
  const content = `
    <h2>Confirmez votre adresse email</h2>
    <p>Bonjour ${escapeHtml(data.firstName)},</p>
    <p>Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et accéder au dépôt de candidature.</p>

    ${ctaButton(data.verifyUrl, "Confirmer mon adresse email")}

    <p style="color: #666; font-size: 14px;">
      Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
      <a href="${escapeHtml(data.verifyUrl)}" style="color: #246BDC;">${escapeHtml(data.verifyUrl)}</a>
    </p>

    ${infoBox(`
      Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.
    `)}
  `

  return {
    subject: "Confirmez votre adresse email - Tremplin Jeunes en Scène",
    html: getEmailLayout(content),
    text: `Bonjour ${data.firstName},\n\nConfirmez votre adresse email en ouvrant ce lien : ${data.verifyUrl}\n\nTremplin Jeunes en Scène - Organisé par Pass'Musique`,
  }
}

// 1 ter. Notification interne à l'administration
export function getAdminNotificationEmail(data: { title: string; lines: string[]; adminUrl: string }): EmailTemplate {
  const content = `
    <h2>${escapeHtml(data.title)}</h2>
    ${infoBox(`
      ${data.lines.map((line) => `<p style="margin: 4px 0;">${escapeHtml(line)}</p>`).join("\n")}
    `)}
    ${ctaButton(data.adminUrl, "Ouvrir l'administration")}
  `

  return {
    subject: `[Admin] ${data.title}`,
    html: getEmailLayout(content),
    text: `${data.title}\n\n${data.lines.join("\n")}\n\n${data.adminUrl}`,
  }
}

// 2. Email de confirmation d'envoi de candidature
export function getApplicationSubmittedEmail(data: BaseEmailData & { applicationType: string }): EmailTemplate {
  const content = `
    <h2>Candidature reçue !</h2>
    <p>Bonjour ${escapeHtml(data.firstName)},</p>
    <p>Nous avons bien reçu votre candidature ${data.applicationType === "solo" ? "en tant qu'<strong>artiste solo</strong>" : "en tant que <strong>groupe</strong>"}.</p>
    
    ${infoBox(`
      <strong>Votre dossier est en cours de traitement</strong><br>
      Notre équipe va examiner votre candidature. Vous recevrez une notification dès que votre dossier sera validé.
    `)}
    
    <p><strong>N'oubliez pas :</strong> Vous devez encore envoyer votre fiche technique pour finaliser votre candidature.</p>
    
    ${ctaButton(`${getSiteUrl()}/technical-sheet`, "Envoyer ma fiche technique")}
    
    <p style="margin-top: 30px; color: #666; font-size: 14px;">
      Vous pouvez suivre l'avancement de votre candidature depuis votre espace personnel.
    </p>
  `

  return {
    subject: "Candidature reçue - Tremplin Jeunes en Scène",
    html: getEmailLayout(content),
    text: `Bonjour ${data.firstName},\n\nNous avons bien reçu votre candidature. N'oubliez pas d'envoyer votre fiche technique pour finaliser votre dossier.\n\nTremplin Jeunes en Scène - Organisé par Pass'Musique`,
  }
}

// 3. Email de confirmation d'envoi de fiche technique
export function getTechnicalSheetSubmittedEmail(data: BaseEmailData): EmailTemplate {
  const content = `
    <h2>Fiche technique reçue !</h2>
    <p>Bonjour ${escapeHtml(data.firstName)},</p>
    <p>Nous avons bien reçu votre fiche technique.</p>
    
    ${infoBox(`
      <strong>Merci !</strong><br>
      Notre équipe va examiner votre fiche technique. Vérifiez sur votre espace candidat que tous les documents
      demandés (par exemple une autorisation parentale pour les mineurs) sont bien fournis : vous recevrez une
      notification dès que votre candidature sera validée.
    `)}
    
    <p>Vous pouvez consulter l'état de votre candidature à tout moment depuis votre espace personnel.</p>
    
    ${ctaButton(`${getSiteUrl()}/dashboard`, "Voir mon dossier")}
  `

  return {
    subject: "Fiche technique reçue - Tremplin Jeunes en Scène",
    html: getEmailLayout(content),
    text: `Bonjour ${data.firstName},\n\nNous avons bien reçu votre fiche technique. Vérifiez sur votre espace candidat que tous les documents demandés sont bien fournis.\n\nTremplin Jeunes en Scène - Organisé par Pass'Musique`,
  }
}

// 6. Email de réinitialisation de mot de passe
export function getPasswordResetEmail(
  data: BaseEmailData & { resetUrl: string },
): EmailTemplate {
  const content = `
    <h2>Réinitialisation de votre mot de passe</h2>
    <p>Bonjour ${escapeHtml(data.firstName)},</p>
    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>

    ${infoBox(`
      <strong>Ce lien est valable 1 heure.</strong><br>
      Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
    `)}

    ${ctaButton(data.resetUrl, "Réinitialiser mon mot de passe")}

    <p style="margin-top: 30px; color: #666; font-size: 14px;">
      Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
      <a href="${escapeHtml(data.resetUrl)}" style="color: #246BDC;">${escapeHtml(data.resetUrl)}</a>
    </p>
  `

  return {
    subject: "Réinitialisation de votre mot de passe - Tremplin Jeunes en Scène",
    html: getEmailLayout(content),
    text: `Bonjour ${data.firstName},\n\nVous avez demandé la réinitialisation de votre mot de passe.\n\nCliquez sur ce lien pour réinitialiser votre mot de passe : ${data.resetUrl}\n\nCe lien est valable 1 heure.\n\nTremplin Jeunes en Scène - Organisé par Pass'Musique`,
  }
}
