import net from "node:net"

/** Serveur SMTP minimal (sans TLS) qui mémorise les messages reçus. */
export function startSmtpCatcher(port = 2525) {
  const messages = []
  const server = net.createServer((socket) => {
    let buffer = ""
    let inData = false
    let current = { from: null, to: [], raw: "" }
    socket.write("220 catcher ESMTP\r\n")
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8")
      while (true) {
        if (inData) {
          const end = buffer.indexOf("\r\n.\r\n")
          if (end === -1) return
          current.raw = buffer.slice(0, end)
          buffer = buffer.slice(end + 5)
          messages.push(parse(current))
          current = { from: null, to: [], raw: "" }
          inData = false
          socket.write("250 OK queued\r\n")
          continue
        }
        const nl = buffer.indexOf("\r\n")
        if (nl === -1) return
        const line = buffer.slice(0, nl)
        buffer = buffer.slice(nl + 2)
        const upper = line.toUpperCase()
        if (upper.startsWith("EHLO") || upper.startsWith("HELO")) socket.write("250-catcher\r\n250-AUTH PLAIN LOGIN\r\n250 8BITMIME\r\n")
        else if (upper.startsWith("AUTH PLAIN")) socket.write("235 ok\r\n")
        else if (upper.startsWith("AUTH LOGIN")) socket.write("334 VXNlcm5hbWU6\r\n")
        else if (upper.startsWith("MAIL FROM")) { current.from = line.slice(10).trim(); socket.write("250 OK\r\n") }
        else if (upper.startsWith("RCPT TO")) { current.to.push(line.slice(8).trim().replace(/[<>]/g, "")); socket.write("250 OK\r\n") }
        else if (upper.startsWith("DATA")) { inData = true; socket.write("354 go\r\n") }
        else if (upper.startsWith("QUIT")) { socket.write("221 bye\r\n"); socket.end() }
        else if (upper.startsWith("RSET") || upper.startsWith("NOOP")) socket.write("250 OK\r\n")
        else socket.write(/^[A-Za-z0-9+/=]+$/.test(line) ? "235 ok\r\n" : "250 OK\r\n")
      }
    })
  })
  server.listen(port, "127.0.0.1")
  return { messages, close: () => server.close() }
}

function decodeSubject(raw) {
  const m = /^Subject:\s*(.*(?:\r\n[ \t].*)*)/im.exec(raw)
  if (!m) return ""
  const value = m[1].replace(/\r\n[ \t]/g, "")
  return value.replace(/\?=\s+=\?/g, "?==?").replace(/=\?utf-8\?([BQ])\?([^?]+)\?=/gi, (_, enc, text) =>
    enc.toUpperCase() === "B" ? Buffer.from(text, "base64").toString("utf8") : decodeQp(text.replace(/_/g, " ")),
  )
}

function decodeQp(text) {
  const bytes = []
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "=" && /^[0-9A-F]{2}$/i.test(text.slice(i + 1, i + 3))) {
      bytes.push(parseInt(text.slice(i + 1, i + 3), 16))
      i += 2
    } else {
      bytes.push(...Buffer.from(text[i], "utf8"))
    }
  }
  return Buffer.from(bytes).toString("utf8")
}

function decodeBody(raw) {
  // Concatène les parties décodées (base64 ou quoted-printable) pour une recherche de texte simple.
  const parts = raw.split(/\r\n--[^\r\n]+\r\n/)
  return parts
    .map((part) => {
      const [headers, ...rest] = part.split("\r\n\r\n")
      const body = rest.join("\r\n\r\n")
      if (/Content-Transfer-Encoding:\s*base64/i.test(headers)) return Buffer.from(body.replace(/\s+/g, ""), "base64").toString("utf8")
      if (/Content-Transfer-Encoding:\s*quoted-printable/i.test(headers)) return decodeQp(body.replace(/=\r\n/g, ""))
      return body
    })
    .join("\n")
}

function parse(msg) {
  return { from: msg.from, to: msg.to, subject: decodeSubject(msg.raw), raw: msg.raw, text: decodeBody(msg.raw) }
}
