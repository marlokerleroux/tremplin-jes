import { Megaphone } from "lucide-react"

export function AnnouncementBanner({ text, url }: { text: string; url: string }) {
  const content = (
    <span className="inline-flex items-center gap-2">
      <Megaphone className="h-4 w-4 shrink-0" />
      <span>{text}</span>
    </span>
  )
  return (
    <div className="bg-secondary text-foreground text-sm font-bold text-center px-4 py-2" role="status">
      {url ? (
        <a href={url} target={url.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer" className="underline underline-offset-4 hover:no-underline">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  )
}
