import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Association Pass'Musique - Tremplin Jeunes en Scène</p>
          <div className="flex gap-6">
            <Link href="/legal" className="hover:text-foreground transition-colors underline-offset-4 hover:underline">
              Mentions légales
            </Link>
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
