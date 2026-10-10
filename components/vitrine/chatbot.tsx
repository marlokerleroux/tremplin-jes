import Script from "next/script"

/** Optional external widget. The OpenRouter key stays on the chatbot backend. */
export function VitrineChatbot() {
  const chatbotUrl = process.env.NEXT_PUBLIC_CHATBOT_URL
  if (!chatbotUrl) return null

  let origin: URL
  try {
    origin = new URL(chatbotUrl)
  } catch {
    return null
  }

  const isLocal = ["localhost", "127.0.0.1"].includes(origin.hostname)
  if (origin.protocol !== "https:" && !(isLocal && origin.protocol === "http:")) return null

  return <Script id="tremplin-chatbot" src={`${origin.origin}/widget.js`} strategy="afterInteractive" />
}
