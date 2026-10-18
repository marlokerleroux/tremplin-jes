import Script from "next/script"

/** Widget and API deploy with the site. Secrets stay server-side. */
export function VitrineChatbot() {
  return <Script id="tremplin-chatbot" src="/chatbot/widget.js" data-chat-path="index.html" strategy="afterInteractive" />
}
