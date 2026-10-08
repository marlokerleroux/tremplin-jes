import { describe, expect, it } from "vitest"
import { isVitrineHost } from "./host"

describe("vitrine host routing", () => {
  it("recognizes only the two official public hosts by default", () => {
    expect(isVitrineHost("tremplin-jeunes-en-scene.fr")).toBe(true)
    expect(isVitrineHost("www.tremplin-jeunes-en-scene.fr")).toBe(true)
    expect(isVitrineHost("candidat.tremplin-jeunes-en-scene.fr")).toBe(false)
    expect(isVitrineHost("localhost")).toBe(false)
  })
  it("enables the public local preview only on loopback with explicit opt-in", () => {
    expect(isVitrineHost("127.0.0.1", "vitrine")).toBe(true)
    expect(isVitrineHost("localhost", "vitrine")).toBe(true)
    expect(isVitrineHost("localhost", "candidat")).toBe(false)
    expect(isVitrineHost("candidat.tremplin-jeunes-en-scene.fr", "vitrine")).toBe(false)
    expect(isVitrineHost("example.com", "vitrine")).toBe(false)
  })
})
