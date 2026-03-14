import Link from "next/link"
import Image from "next/image"

export function VitrineFooter() {
  return (
    <footer className="bg-primary text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Image
              src="/images/design-mode/logo_sans_fond.png"
              alt="Tremplin Jeunes en Scène"
              width={180}
              height={54}
              className="h-12 w-auto brightness-0 invert"
            />
            <p className="text-white/60 text-sm">
              Un projet de l&apos;association Pass&apos;Musique
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3 text-sm text-white/60">
            <div className="flex gap-6">
              <Link href="/legal" className="hover:text-white transition-colors">
                Mentions legales
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Politique de confidentialite
              </Link>
            </div>
            <p>&copy; {new Date().getFullYear()} Association Pass&apos;Musique. Tous droits reserves.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
