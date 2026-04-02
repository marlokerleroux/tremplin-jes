import type { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 bg-gradient-to-br from-blue-50 via-white to-pink-50 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <Button asChild variant="ghost" className="mb-6">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-primary">Politique de confidentialité</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
              </p>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">1. Responsable du traitement</h2>
                <p className="text-muted-foreground leading-relaxed">
                  L'Association Pass'Musique, représentée par Magali QUENAON, est responsable du traitement de vos
                  données personnelles collectées via ce site.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-2">
                  Contact RGPD :{" "}
                  <a href="mailto:marlo@tremplin-jeunes-en-scene.fr" className="text-primary hover:underline">
                    marlo@tremplin-jeunes-en-scene.fr
                  </a>
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">2. Données collectées</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Dans le cadre de votre inscription et candidature au Tremplin Jeunes en Scène, nous collectons les
                  données suivantes :
                </p>
                <ul className="list-disc list-inside text-muted-foreground leading-relaxed space-y-1 mt-2">
                  <li>Informations d'identification : nom, prénom, email, téléphone, adresse postale</li>
                  <li>Date de naissance (pour les artistes et membres du groupe)</li>
                  <li>Informations artistiques : nom de scène, biographie, style musical, compte Instagram</li>
                  <li>Expérience scénique et préférences de date d'audition</li>
                  <li>Documents : fiche technique, autorisations parentales (pour les mineurs)</li>
                  <li>
                    Consentements : règlement du tremplin, autorisation de diffusion, politique de confidentialité
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. Finalités du traitement</h2>
                <p className="text-muted-foreground leading-relaxed">Vos données sont utilisées pour :</p>
                <ul className="list-disc list-inside text-muted-foreground leading-relaxed space-y-1 mt-2">
                  <li>Gérer votre inscription et votre candidature au tremplin</li>
                  <li>Organiser les auditions et communiquer avec vous</li>
                  <li>Évaluer votre candidature par le jury</li>
                  <li>Respecter nos obligations légales</li>
                  <li>Améliorer notre site web (via Vercel Analytics)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. Base légale</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Le traitement de vos données repose sur votre consentement explicite, donné lors de votre inscription
                  et de l'acceptation de cette politique de confidentialité.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. Destinataires des données</h2>
                <p className="text-muted-foreground leading-relaxed">Vos données sont accessibles à :</p>
                <ul className="list-disc list-inside text-muted-foreground leading-relaxed space-y-1 mt-2">
                  <li>
                    <strong>Les organisateurs du tremplin</strong> : accès complet à toutes vos données pour la gestion
                    administrative et logistique
                  </li>
                  <li>
                    <strong>Le jury</strong> : accès uniquement aux informations artistiques (nom de scène, biographie,
                    style musical, expérience scénique) nécessaires à l'évaluation de votre candidature
                  </li>
                  <li>
                    <strong>Prestataires techniques</strong> : Vercel (hébergement), Supabase (base de données), Vercel
                    Blob (stockage de fichiers)
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. Durée de conservation</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Vos données personnelles sont conservées pendant une durée de <strong>2 ans</strong> à compter de
                  votre dernière interaction avec notre service. Passé ce délai, vos données seront supprimées, sauf
                  obligation légale de conservation.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Vos droits</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Conformément au RGPD, vous disposez des droits suivants :
                </p>
                <ul className="list-disc list-inside text-muted-foreground leading-relaxed space-y-1 mt-2">
                  <li>
                    <strong>Droit d'accès</strong> : obtenir une copie de vos données personnelles
                  </li>
                  <li>
                    <strong>Droit de rectification</strong> : corriger vos données inexactes ou incomplètes
                  </li>
                  <li>
                    <strong>Droit à l'effacement</strong> : demander la suppression de vos données
                  </li>
                  <li>
                    <strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré
                  </li>
                  <li>
                    <strong>Droit d'opposition</strong> : vous opposer au traitement de vos données
                  </li>
                  <li>
                    <strong>Droit de limitation</strong> : demander la limitation du traitement
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Pour exercer ces droits, contactez-nous à :{" "}
                  <a href="mailto:marlo@tremplin-jeunes-en-scene.fr" className="text-primary hover:underline">
                    marlo@tremplin-jeunes-en-scene.fr
                  </a>
                </p>
                <p className="text-muted-foreground leading-relaxed mt-2">
                  Vous disposez également du droit d'introduire une réclamation auprès de la CNIL (Commission Nationale
                  de l'Informatique et des Libertés) si vous estimez que vos droits ne sont pas respectés.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">8. Cookies et technologies similaires</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Ce site utilise <strong>Vercel Analytics</strong> pour analyser le trafic et améliorer votre
                  expérience. Ces cookies collectent des données anonymisées sur votre navigation (pages visitées, durée
                  de visite, etc.).
                </p>
                <p className="text-muted-foreground leading-relaxed mt-2">
                  Vous pouvez accepter ou refuser ces cookies via la bannière de consentement affichée lors de votre
                  première visite. Votre choix est enregistré localement dans votre navigateur.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">9. Sécurité des données</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos
                  données contre tout accès non autorisé, perte, destruction ou divulgation. Les données sont stockées
                  de manière sécurisée sur les serveurs de Supabase et Vercel, qui respectent les normes de sécurité
                  internationales.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">10. Modifications</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Toute
                  modification sera publiée sur cette page avec une nouvelle date de mise à jour. Nous vous encourageons
                  à consulter régulièrement cette page.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">11. Contact</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Pour toute question concernant cette politique de confidentialité ou le traitement de vos données,
                  contactez-nous :
                  <br />
                  Email :{" "}
                  <a href="mailto:marlo@tremplin-jeunes-en-scene.fr" className="text-primary hover:underline">
                    marlo@tremplin-jeunes-en-scene.fr
                  </a>
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}
