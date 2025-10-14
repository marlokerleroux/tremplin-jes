import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LegalPage() {
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
              <CardTitle className="text-3xl font-bold text-primary">Mentions légales</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">Éditeur du site</h2>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Association Pass'Musique</strong>
                  <br />
                  Tremplin Jeunes en Scène
                  <br />
                  Responsable de la publication : Marlo KERLEROUX
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">Hébergement</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Ce site est hébergé par :
                  <br />
                  <strong>Vercel Inc.</strong>
                  <br />
                  340 S Lemon Ave #4133
                  <br />
                  Walnut, CA 91789, USA
                  <br />
                  Site web :{" "}
                  <a
                    href="https://vercel.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    vercel.com
                  </a>
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">Propriété intellectuelle</h2>
                <p className="text-muted-foreground leading-relaxed">
                  L'ensemble du contenu de ce site (textes, images, logos, vidéos) est la propriété de l'Association
                  Pass'Musique, sauf mention contraire. Toute reproduction, distribution ou utilisation sans
                  autorisation préalable est interdite.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">Données personnelles</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Pour toute question concernant vos données personnelles et l'exercice de vos droits RGPD (accès,
                  rectification, suppression, portabilité), vous pouvez nous contacter à l'adresse suivante :
                  <br />
                  <a href="mailto:marlo@tremplin-jeunes-en-scene.fr" className="text-primary hover:underline">
                    marlo@tremplin-jeunes-en-scene.fr
                  </a>
                </p>
                <p className="text-muted-foreground leading-relaxed mt-2">
                  Pour plus d'informations sur le traitement de vos données, consultez notre{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Politique de confidentialité
                  </Link>
                  .
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">Cookies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Ce site utilise des cookies pour améliorer votre expérience de navigation. Pour en savoir plus,
                  consultez notre{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Politique de confidentialité
                  </Link>
                  .
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">Crédits</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Site web développé avec Next.js et hébergé sur Vercel.
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
