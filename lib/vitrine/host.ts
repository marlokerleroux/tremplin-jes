const PUBLIC_HOSTS = new Set(["tremplin-jeunes-en-scene.fr", "www.tremplin-jeunes-en-scene.fr"])
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1"])

/** Local opt-in keeps the usual candidate routing unchanged for other hosts. */
export function isVitrineHost(hostname: string, localMode?: string): boolean {
  return PUBLIC_HOSTS.has(hostname) || (localMode === "vitrine" && LOOPBACK_HOSTS.has(hostname))
}
