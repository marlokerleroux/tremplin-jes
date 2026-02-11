export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface BaseEmailData {
  firstName: string
  lastName: string
}

// Template de base avec le style du site
function getEmailLayout(content: string): string {
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

// 1. Email de bienvenue après création du compte
export function getWelcomeEmail(data: BaseEmailData): EmailTemplate {
  const content = `
    <h2>Bienvenue ${data.firstName} !</h2>
    <p>Votre compte a été créé avec succès. Nous sommes ravis de vous accueillir pour le Tremplin Jeunes en Scène !</p>
    
    <div class="info-box">
      <strong>Prochaines étapes :</strong>
      <ol style="margin: 10px 0; padding-left: 20px;">
        <li>Complétez votre candidature en ligne</li>
        <li>Envoyez votre fiche technique</li>
        <li>Attendez la validation de votre dossier</li>
      </ol>
    </div>
    
    <p>Vous pouvez dès maintenant accéder à votre espace candidat et commencer à remplir votre dossier.</p>
    
    <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://tremplin.pass-musique.fr"}/dashboard" class="button">
      Accéder à mon espace
    </a>
    
    <p style="margin-top: 30px; color: #666; font-size: 14px;">
      Si vous avez des questions, n'hésitez pas à nous contacter.
    </p>
  `

  return {
    subject: "Bienvenue sur le Tremplin Jeunes en Scène !",
    html: getEmailLayout(content),
    text: `Bienvenue ${data.firstName} !\n\nVotre compte a été créé avec succès. Vous pouvez dès maintenant accéder à votre espace candidat et commencer à remplir votre dossier.\n\nTremplin Jeunes en Scène - Organisé par Pass'Musique`,
  }
}

// 2. Email de confirmation d'envoi de candidature
export function getApplicationSubmittedEmail(data: BaseEmailData & { applicationType: string }): EmailTemplate {
  const content = `
    <h2>Candidature reçue !</h2>
    <p>Bonjour ${data.firstName},</p>
    <p>Nous avons bien reçu votre candidature en tant qu'<strong>${data.applicationType === "solo" ? "artiste solo" : "groupe"}</strong>.</p>
    
    <div class="info-box">
      <strong>Votre dossier est en cours de traitement</strong><br>
      Notre équipe va examiner votre candidature. Vous recevrez une notification dès que votre dossier sera validé.
    </div>
    
    <p><strong>N'oubliez pas :</strong> Vous devez encore envoyer votre fiche technique pour finaliser votre candidature.</p>
    
    <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://tremplin.pass-musique.fr"}/technical-sheet" class="button">
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
    <p>Bonjour ${data.firstName},</p>
    <p>Nous avons bien reçu votre fiche technique.</p>
    
    <div class="info-box">
      <strong>Votre dossier est maintenant complet !</strong><br>
      Notre équipe va examiner votre fiche technique. Vous recevrez une notification dès qu'elle sera validée.
    </div>
    
    <p>Vous pouvez consulter l'état de votre candidature à tout moment depuis votre espace personnel.</p>
    
    <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://tremplin.pass-musique.fr"}/dashboard" class="button">
      Voir mon dossier
    </a>
  `

  return {
    subject: "Fiche technique reçue - Tremplin Jeunes en Scène",
    html: getEmailLayout(content),
    text: `Bonjour ${data.firstName},\n\nNous avons bien reçu votre fiche technique. Votre dossier est maintenant complet !\n\nTremplin Jeunes en Scène - Organisé par Pass'Musique`,
  }
}

// 4. Email de validation de candidature
export function getApplicationValidatedEmail(data: BaseEmailData): EmailTemplate {
  const content = `
    <h2>🎉 Candidature validée !</h2>
    <p>Bonjour ${data.firstName},</p>
    <p>Excellente nouvelle ! Votre candidature a été validée par notre équipe.</p>
    
    <div class="info-box">
      <strong>Félicitations !</strong><br>
      Votre dossier est complet et conforme. Vous allez bientôt recevoir votre créneau d'audition.
    </div>
    
    <p>Nous vous informerons dès que votre horaire de passage sera défini.</p>
    
    <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://tremplin.pass-musique.fr"}/dashboard" class="button">
      Voir mon dossier
    </a>
    
    <p style="margin-top: 30px; color: #666; font-size: 14px;">
      Préparez-vous bien pour votre audition ! Nous avons hâte de vous voir sur scène.
    </p>
  `

  return {
    subject: "🎉 Candidature validée - Tremplin Jeunes en Scène",
    html: getEmailLayout(content),
    text: `Bonjour ${data.firstName},\n\nExcellente nouvelle ! Votre candidature a été validée. Vous allez bientôt recevoir votre créneau d'audition.\n\nTremplin Jeunes en Scène - Organisé par Pass'Musique`,
  }
}

// 5. Email d'attribution de créneau d'audition
export function getTimeSlotAssignedEmail(
  data: BaseEmailData & { date: string; time: string; venue: string },
): EmailTemplate {
  const content = `
    <h2>🎵 Votre créneau d'audition</h2>
    <p>Bonjour ${data.firstName},</p>
    <p>Votre créneau d'audition a été défini !</p>
    
    <div class="info-box">
      <strong>Informations de votre audition :</strong><br>
      <p style="margin: 10px 0;">
        📅 <strong>Date :</strong> ${data.date}<br>
        🕐 <strong>Heure :</strong> ${data.time}<br>
        📍 <strong>Lieu :</strong> ${data.venue}
      </p>
    </div>
    
    <p><strong>Important :</strong></p>
    <ul style="margin: 10px 0; padding-left: 20px;">
      <li>Présentez-vous 30 minutes avant votre créneau</li>
      <li>Préparez votre matériel selon votre fiche technique</li>
    </ul>
    
    <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://tremplin.pass-musique.fr"}/dashboard" class="button">
      Voir les détails
    </a>
    
    <p style="margin-top: 30px; color: #666; font-size: 14px;">
      Nous avons hâte de vous voir sur scène ! Bonne chance pour votre audition.
    </p>
  `

  return {
    subject: "🎵 Votre créneau d'audition - Tremplin Jeunes en Scène",
    html: getEmailLayout(content),
    text: `Bonjour ${data.firstName},\n\nVotre créneau d'audition a été défini :\nDate : ${data.date}\nHeure : ${data.time}\nLieu : ${data.venue}\n\nPrésentez-vous 15 minutes avant votre créneau.\n\nTremplin Jeunes en Scène - Organisé par Pass'Musique`,
  }
}

// 6. Email de réinitialisation de mot de passe
export function getPasswordResetEmail(
  data: BaseEmailData & { resetUrl: string },
): EmailTemplate {
  const content = `
    <h2>Réinitialisation de votre mot de passe</h2>
    <p>Bonjour ${data.firstName},</p>
    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>

    <div class="info-box">
      <strong>Ce lien est valable 1 heure.</strong><br>
      Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
    </div>

    <a href="${data.resetUrl}" class="button">
      Réinitialiser mon mot de passe
    </a>

    <p style="margin-top: 30px; color: #666; font-size: 14px;">
      Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
      <a href="${data.resetUrl}" style="color: #246BDC;">${data.resetUrl}</a>
    </p>
  `

  return {
    subject: "Réinitialisation de votre mot de passe - Tremplin Jeunes en Scène",
    html: getEmailLayout(content),
    text: `Bonjour ${data.firstName},\n\nVous avez demandé la réinitialisation de votre mot de passe.\n\nCliquez sur ce lien pour réinitialiser votre mot de passe : ${data.resetUrl}\n\nCe lien est valable 1 heure.\n\nTremplin Jeunes en Scène - Organisé par Pass'Musique`,
  }
}
