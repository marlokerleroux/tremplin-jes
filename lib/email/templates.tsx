import { getSiteUrl } from "@/lib/site-url"

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

// Template de base avec le style du site
export function getEmailLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tremplin Jeunes en Scène</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, rgba(36, 107, 220, 0.1) 0%, rgba(255, 255, 255, 1) 50%, rgba(230, 39, 133, 0.1) 100%);
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #246BDC 0%, #E62785 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      max-width: 250px;
      height: auto;
      margin-bottom: 20px;
    }
    .header-title {
      color: white;
      font-size: 24px;
      font-weight: bold;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
      color: #000000;
      line-height: 1.6;
    }
    .content h2 {
      color: #246BDC;
      font-size: 20px;
      margin-top: 0;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #246BDC;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      margin: 20px 0;
    }
    .button:hover {
      background: #1d5ab8;
    }
    .info-box {
      background: rgba(36, 107, 220, 0.05);
      border-left: 4px solid #246BDC;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      background: #f5f5f5;
      padding: 30px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    .footer-logo {
      color: #246BDC;
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 10px;
    }
    .footer-org {
      color: #E62785;
      font-weight: 600;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="header-title">Tremplin Jeunes en Scène</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <div class="footer-logo">Tremplin Jeunes en Scène</div>
      <div class="footer-org">Organisé par Pass'Musique</div>
    </div>
  </div>
</body>
</html>
  `
}

// 1. Email de bienvenue après création du compte (avec lien de vérification de l'adresse)
export function getWelcomeEmail(data: BaseEmailData & { verifyUrl: string }): EmailTemplate {
  const content = `
    <h2>Bienvenue ${escapeHtml(data.firstName)} !</h2>
    <p>Votre compte a été créé avec succès. Nous sommes ravis de vous accueillir pour le Tremplin Jeunes en Scène !</p>

    <div class="info-box">
      <strong>Dernière étape : confirmez votre adresse email</strong><br>
      Cliquez sur le bouton ci-dessous pour vérifier votre adresse. C'est indispensable pour déposer votre candidature
      et recevoir votre convocation.
    </div>

    <a href="${escapeHtml(data.verifyUrl)}" class="button">
      Confirmer mon adresse email
    </a>

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

    <a href="${escapeHtml(data.verifyUrl)}" class="button">
      Confirmer mon adresse email
    </a>

    <p style="color: #666; font-size: 14px;">
      Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
      <a href="${escapeHtml(data.verifyUrl)}" style="color: #246BDC;">${escapeHtml(data.verifyUrl)}</a>
    </p>

    <div class="info-box">
      Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.
    </div>
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
    <div class="info-box">
      ${data.lines.map((line) => `<p style="margin: 4px 0;">${escapeHtml(line)}</p>`).join("\n")}
    </div>
    <a href="${escapeHtml(data.adminUrl)}" class="button">
      Ouvrir l'administration
    </a>
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
    
    <div class="info-box">
      <strong>Votre dossier est en cours de traitement</strong><br>
      Notre équipe va examiner votre candidature. Vous recevrez une notification dès que votre dossier sera validé.
    </div>
    
    <p><strong>N'oubliez pas :</strong> Vous devez encore envoyer votre fiche technique pour finaliser votre candidature.</p>
    
    <a href="${getSiteUrl()}/technical-sheet" class="button">
      Envoyer ma fiche technique
    </a>
    
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
    
    <div class="info-box">
      <strong>Merci !</strong><br>
      Notre équipe va examiner votre fiche technique. Vérifiez sur votre espace candidat que tous les documents
      demandés (par exemple une autorisation parentale pour les mineurs) sont bien fournis : vous recevrez une
      notification dès que votre candidature sera validée.
    </div>
    
    <p>Vous pouvez consulter l'état de votre candidature à tout moment depuis votre espace personnel.</p>
    
    <a href="${getSiteUrl()}/dashboard" class="button">
      Voir mon dossier
    </a>
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

    <div class="info-box">
      <strong>Ce lien est valable 1 heure.</strong><br>
      Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
    </div>

    <a href="${escapeHtml(data.resetUrl)}" class="button">
      Réinitialiser mon mot de passe
    </a>

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
