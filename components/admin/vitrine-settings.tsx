"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { ArrowDown, ArrowUp, Download, ExternalLink, Globe, Plus, Save, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiJson } from "@/lib/admin-client"
import type { SeasonConfigDTO } from "@/lib/season-config"
import type { PartnerDTO, VitrineConfigDTO, VitrineEditionDTO } from "@/lib/vitrine/site"
import { extractYoutubeId, VITRINE_MODE_LABELS, VITRINE_MODES, type FinalistEntry, type TourDate, type VitrineMode } from "@/lib/vitrine/modes"
import { formatDateTimeFr, getRegistrationStatus } from "@/lib/season"
import { ImageUploadField } from "./image-upload-field"

interface VitrineAdminResponse {
  config: VitrineConfigDTO
  season: SeasonConfigDTO
  edition: VitrineEditionDTO
  editions: Array<{ edition: number; jury_winner: string; public_winner: string; finalists: number }>
  partners: PartnerDTO[]
}

function toLocalInput(iso: string | null): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function move<T>(items: T[], index: number, delta: number): T[] {
  const target = index + delta
  if (target < 0 || target >= items.length) return items
  const next = [...items]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

export function VitrineSettings({ currentEdition }: { currentEdition: number }) {
  const [data, setData] = useState<VitrineAdminResponse | null>(null)
  const load = useCallback(async (edition?: number) => {
    try {
      setData(await apiJson<VitrineAdminResponse>(`/api/admin/vitrine${edition ? `?edition=${edition}` : ""}`))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de charger les réglages du site vitrine")
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, currentEdition])

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">Chargement des réglages du site vitrine...</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <GeneralSettings data={data} onSaved={(config) => setData({ ...data, config })} />
      <EditionSettings data={data} onLoadEdition={(edition) => load(edition)} onSaved={(edition) => setData({ ...data, edition })} />
      <PartnersSettings partners={data.partners} onSaved={(partners) => setData({ ...data, partners })} />
    </div>
  )
}

function GeneralSettings({ data, onSaved }: { data: VitrineAdminResponse; onSaved: (config: VitrineConfigDTO) => void }) {
  const [form, setForm] = useState<VitrineConfigDTO>(data.config)
  const [isSaving, setIsSaving] = useState(false)
  useEffect(() => setForm(data.config), [data.config])

  const season = data.season
  const registration = getRegistrationStatus(season)
  const hint =
    form.mode !== "auditions" && registration === "open"
      ? "Les inscriptions sont ouvertes : le mode « Auditions » affiche le bouton « Je candidate »."
      : form.mode === "auditions" && registration === "not_yet_open" && season.registration_opens_at
        ? `Les inscriptions ouvriront le ${formatDateTimeFr(season.registration_opens_at)} : le site le dira automatiquement.`
        : null

  const save = async () => {
    setIsSaving(true)
    try {
      const result = await apiJson<{ config: VitrineConfigDTO }>("/api/admin/vitrine", { method: "PUT", body: JSON.stringify(form) })
      onSaved(result.config)
      toast.success("Site vitrine mis à jour", { description: `Mode « ${VITRINE_MODE_LABELS[result.config.mode].label} » en ligne.` })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'enregistrement")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Site vitrine · mode d&#39;affichage
        </CardTitle>
        <CardDescription>
          Le site public s&#39;adapte au moment de la saison. Les dates d&#39;inscription et d&#39;audition viennent des paramètres de la saison.
          En ligne actuellement : <Badge variant="outline">{VITRINE_MODE_LABELS[data.config.mode].label}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={form.mode} onValueChange={(value) => setForm({ ...form, mode: value as VitrineMode })} className="grid gap-3 sm:grid-cols-2">
          {VITRINE_MODES.map((mode) => (
            <label key={mode} htmlFor={`mode-${mode}`} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${form.mode === mode ? "border-primary bg-primary/5" : ""}`}>
              <RadioGroupItem value={mode} id={`mode-${mode}`} className="mt-1" />
              <span>
                <span className="font-medium">{VITRINE_MODE_LABELS[mode].label}</span>
                <span className="block text-xs text-muted-foreground leading-relaxed">{VITRINE_MODE_LABELS[mode].description}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="displayed-edition">Édition affichée (modes finale et après la finale)</Label>
            <Select value={form.edition ? String(form.edition) : "season"} onValueChange={(value) => setForm({ ...form, edition: value === "season" ? null : Number(value) })}>
              <SelectTrigger id="displayed-edition">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="season">Saison en cours ({season.edition})</SelectItem>
                {Array.from(new Set([season.edition, season.edition + 1, ...data.editions.map((e) => e.edition)]))
                  .sort((a, b) => b - a)
                  .map((edition) => (
                    <SelectItem key={edition} value={String(edition)}>
                      Édition {edition}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Permet de garder la finale précédente en ligne après l&#39;ouverture de la saison suivante.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="preseason-text">Accroche avant-ouverture</Label>
            <Textarea id="preseason-text" rows={3} maxLength={1000} value={form.preseason_text} onChange={(e) => setForm({ ...form, preseason_text: e.target.value })} placeholder="Texte par défaut si vide." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auditions-intro">Introduction de la page « Candidater » (mode auditions)</Label>
            <Textarea id="auditions-intro" rows={3} maxLength={2000} value={form.auditions_intro} onChange={(e) => setForm({ ...form, auditions_intro: e.target.value })} placeholder="Texte par défaut si vide." />
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox id="banner-enabled" checked={form.banner_enabled} onCheckedChange={(c) => setForm({ ...form, banner_enabled: c === true })} />
            <Label htmlFor="banner-enabled" className="font-medium">
              Bandeau d&#39;annonce en haut du site
            </Label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="banner-text">Texte</Label>
              <Input id="banner-text" maxLength={300} value={form.banner_text} onChange={(e) => setForm({ ...form, banner_text: e.target.value })} placeholder="Ex. Live Instagram des résultats samedi à 20h !" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banner-url">Lien (facultatif)</Label>
              <Input id="banner-url" maxLength={500} value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} placeholder="https://..." />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={save} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Enregistrement..." : "Enregistrer et publier"}
          </Button>
          <Button asChild variant="outline">
            <a href={`/admin/vitrine-preview?mode=${form.mode}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Aperçu du mode « {VITRINE_MODE_LABELS[form.mode].label} »
            </a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">L&#39;aperçu utilise les réglages enregistrés (édition, finalistes, partenaires) avec le mode sélectionné, sans le publier.</p>
      </CardContent>
    </Card>
  )
}

function EditionSettings({
  data,
  onLoadEdition,
  onSaved,
}: {
  data: VitrineAdminResponse
  onLoadEdition: (edition: number) => Promise<void>
  onSaved: (edition: VitrineEditionDTO) => void
}) {
  const [form, setForm] = useState<VitrineEditionDTO>(data.edition)
  const [finalDate, setFinalDate] = useState(toLocalInput(data.edition.final_date))
  const [isSaving, setIsSaving] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  useEffect(() => {
    setForm(data.edition)
    setFinalDate(toLocalInput(data.edition.final_date))
  }, [data.edition])

  const editionOptions = Array.from(new Set([data.season.edition, data.season.edition + 1, ...data.editions.map((e) => e.edition)])).sort((a, b) => b - a)
  const set = <K extends keyof VitrineEditionDTO>(key: K, value: VitrineEditionDTO[K]) => setForm((f) => ({ ...f, [key]: value }))
  const updateFinalist = (index: number, patch: Partial<FinalistEntry>) =>
    set(
      "finalists",
      form.finalists.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    )
  const updateTour = (index: number, patch: Partial<TourDate>) =>
    set(
      "tour_dates",
      form.tour_dates.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    )

  const importFinalists = async () => {
    setIsImporting(true)
    try {
      const { finalists } = await apiJson<{ finalists: FinalistEntry[] }>("/api/admin/vitrine/edition/import-finalists", {
        method: "POST",
        body: JSON.stringify({ edition: form.edition }),
      })
      if (finalists.length === 0) {
        toast.info("Aucun finaliste coché dans l'onglet Résultats pour cette édition")
        return
      }
      const existingNames = new Set(form.finalists.map((f) => f.name.toLowerCase()))
      const added = finalists.filter((f) => !existingNames.has(f.name.toLowerCase()))
      set("finalists", [...form.finalists, ...added])
      toast.success(`${added.length} finaliste(s) ajouté(s)`, { description: "Complétez la photo, la description et la vidéo, puis enregistrez." })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'import")
    } finally {
      setIsImporting(false)
    }
  }

  const save = async () => {
    setIsSaving(true)
    try {
      const payload = { ...form, final_date: finalDate ? new Date(finalDate).toISOString() : null }
      const result = await apiJson<{ edition: VitrineEditionDTO }>("/api/admin/vitrine/edition", { method: "PUT", body: JSON.stringify(payload) })
      onSaved(result.edition)
      toast.success(`Édition ${result.edition.edition} enregistrée et publiée`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'enregistrement de l'édition")
    } finally {
      setIsSaving(false)
    }
  }

  const finalistNames = form.finalists.map((f) => f.name).filter(Boolean)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Finale, lauréats et après-finale</CardTitle>
            <CardDescription>Contenu de l&#39;édition affichée sur le site. Les éditions passées forment le palmarès.</CardDescription>
          </div>
          <div className="w-40">
            <Label htmlFor="vitrine-edition" className="sr-only">
              Édition
            </Label>
            <Select value={String(form.edition)} onValueChange={(value) => onLoadEdition(Number(value))}>
              <SelectTrigger id="vitrine-edition">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {editionOptions.map((edition) => (
                  <SelectItem key={edition} value={String(edition)}>
                    Édition {edition}
                    {edition === data.season.edition ? " (en cours)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <section className="space-y-4">
          <h3 className="font-semibold">La finale</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="final-date">Date et heure</Label>
              <Input id="final-date" type="datetime-local" value={finalDate} onChange={(e) => setFinalDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="final-venue">Salle</Label>
              <Input id="final-venue" maxLength={150} value={form.final_venue} onChange={(e) => set("final_venue", e.target.value)} placeholder="Le Vauban" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="final-city">Ville</Label>
              <Input id="final-city" maxLength={100} value={form.final_city} onChange={(e) => set("final_city", e.target.value)} placeholder="Brest" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="final-address">Adresse</Label>
              <Input id="final-address" maxLength={200} value={form.final_address} onChange={(e) => set("final_address", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-url">Billetterie (lien)</Label>
              <Input id="ticket-url" maxLength={500} value={form.ticket_url} onChange={(e) => set("ticket_url", e.target.value)} placeholder="https://www.billetweb.fr/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pass-culture-url">Pass Culture (lien)</Label>
              <Input id="pass-culture-url" maxLength={500} value={form.pass_culture_url} onChange={(e) => set("pass_culture_url", e.target.value)} placeholder="https://passculture.app/offre/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-label">Prix d&#39;appel</Label>
              <Input id="price-label" maxLength={60} value={form.price_label} onChange={(e) => set("price_label", e.target.value)} placeholder="à partir de 7 €" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anniversary-label">Étiquette (facultatif)</Label>
              <Input id="anniversary-label" maxLength={100} value={form.anniversary_label} onChange={(e) => set("anniversary_label", e.target.value)} placeholder="10 ans du Tremplin" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jury-prize">Prix du jury (texte)</Label>
              <Textarea id="jury-prize" rows={3} maxLength={1000} value={form.jury_prize_text} onChange={(e) => set("jury_prize_text", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="public-prize">Prix du public (texte)</Label>
              <Textarea id="public-prize" rows={3} maxLength={1000} value={form.public_prize_text} onChange={(e) => set("public_prize_text", e.target.value)} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Les finalistes ({form.finalists.length})</h3>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={importFinalists} disabled={isImporting}>
                <Download className="h-4 w-4 mr-2" />
                {isImporting ? "Import..." : "Importer depuis Résultats"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => set("finalists", [...form.finalists, { id: `finaliste-${Date.now()}`, name: "", genre: "", description: "", image: "", youtubeId: "" }])}
                disabled={form.finalists.length >= 12}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>
          {form.finalists.length === 0 && <p className="text-sm text-muted-foreground">Aucun finaliste. Importez-les depuis l&#39;onglet Résultats ou ajoutez-les à la main.</p>}
          <div className="space-y-4">
            {form.finalists.map((finalist, index) => (
              <div key={finalist.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Finaliste {index + 1}</span>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="sm" aria-label="Monter" onClick={() => set("finalists", move(form.finalists, index, -1))} disabled={index === 0}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" aria-label="Descendre" onClick={() => set("finalists", move(form.finalists, index, 1))} disabled={index === form.finalists.length - 1}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" aria-label="Retirer" onClick={() => set("finalists", form.finalists.filter((_, i) => i !== index))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label htmlFor={`finalist-name-${index}`}>Nom</Label>
                    <Input id={`finalist-name-${index}`} maxLength={100} value={finalist.name} onChange={(e) => updateFinalist(index, { name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`finalist-genre-${index}`}>Style</Label>
                    <Input id={`finalist-genre-${index}`} maxLength={100} value={finalist.genre} onChange={(e) => updateFinalist(index, { genre: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`finalist-video-${index}`}>Vidéo YouTube (lien ou identifiant)</Label>
                    <Input
                      id={`finalist-video-${index}`}
                      value={finalist.youtubeId}
                      onChange={(e) => updateFinalist(index, { youtubeId: e.target.value })}
                      onBlur={(e) => updateFinalist(index, { youtubeId: extractYoutubeId(e.target.value) })}
                      placeholder="https://youtu.be/..."
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`finalist-description-${index}`}>Description</Label>
                  <Textarea id={`finalist-description-${index}`} rows={3} maxLength={1500} value={finalist.description} onChange={(e) => updateFinalist(index, { description: e.target.value })} />
                </div>
                <ImageUploadField label="Photo (carrée de préférence)" value={finalist.image} onChange={(url) => updateFinalist(index, { image: url })} square />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-semibold">Lauréats et après-finale</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jury-winner">Prix du jury</Label>
              <Input id="jury-winner" list="finalist-names" maxLength={100} value={form.jury_winner} onChange={(e) => set("jury_winner", e.target.value)} placeholder="Nom du finaliste" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="public-winner">Prix du public</Label>
              <Input id="public-winner" list="finalist-names" maxLength={100} value={form.public_winner} onChange={(e) => set("public_winner", e.target.value)} placeholder="Nom du finaliste" />
            </div>
            <datalist id="finalist-names">
              {finalistNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label htmlFor="aftermath-text">Texte de remerciement (mode après la finale)</Label>
            <Textarea id="aftermath-text" rows={4} maxLength={3000} value={form.aftermath_text} onChange={(e) => set("aftermath_text", e.target.value)} placeholder="Merci au public, aux partenaires, aux bénévoles..." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="aftermath-video">Vidéo de la finale (lien YouTube ou autre)</Label>
              <Input id="aftermath-video" maxLength={500} value={form.aftermath_video_url} onChange={(e) => set("aftermath_video_url", e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aftermath-photos">Album photos (lien)</Label>
              <Input id="aftermath-photos" maxLength={500} value={form.aftermath_photos_url} onChange={(e) => set("aftermath_photos_url", e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <h4 className="font-medium">Tournée des festivals ({form.tour_dates.length})</h4>
            <Button type="button" variant="outline" size="sm" onClick={() => set("tour_dates", [...form.tour_dates, { date: "", name: "", city: "", url: "" }])} disabled={form.tour_dates.length >= 30}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une date
            </Button>
          </div>
          <div className="space-y-2">
            {form.tour_dates.map((tour, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[150px_1fr_1fr_1fr_auto] items-end rounded-lg border p-3">
                <div className="space-y-1">
                  <Label htmlFor={`tour-date-${index}`}>Date</Label>
                  <Input id={`tour-date-${index}`} type="date" value={tour.date} onChange={(e) => updateTour(index, { date: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`tour-name-${index}`}>Festival</Label>
                  <Input id={`tour-name-${index}`} maxLength={150} value={tour.name} onChange={(e) => updateTour(index, { name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`tour-city-${index}`}>Ville</Label>
                  <Input id={`tour-city-${index}`} maxLength={100} value={tour.city} onChange={(e) => updateTour(index, { city: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`tour-url-${index}`}>Lien</Label>
                  <Input id={`tour-url-${index}`} maxLength={500} value={tour.url} onChange={(e) => updateTour(index, { url: e.target.value })} placeholder="https://..." />
                </div>
                <Button type="button" variant="ghost" size="sm" className="text-destructive" aria-label="Retirer la date" onClick={() => set("tour_dates", form.tour_dates.filter((_, i) => i !== index))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        <Button onClick={save} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Enregistrement..." : `Enregistrer l'édition ${form.edition}`}
        </Button>
      </CardContent>
    </Card>
  )
}

function PartnersSettings({ partners, onSaved }: { partners: PartnerDTO[]; onSaved: (partners: PartnerDTO[]) => void }) {
  const [list, setList] = useState<PartnerDTO[]>(partners)
  const [isSaving, setIsSaving] = useState(false)
  useEffect(() => setList(partners), [partners])

  const update = (index: number, patch: Partial<PartnerDTO>) => setList((l) => l.map((p, i) => (i === index ? { ...p, ...patch } : p)))

  const save = async () => {
    setIsSaving(true)
    try {
      const result = await apiJson<{ partners: PartnerDTO[] }>("/api/admin/vitrine/partners", {
        method: "PUT",
        body: JSON.stringify({ partners: list.map((p) => ({ id: p.id.startsWith("new-") ? null : p.id, name: p.name, logo_url: p.logo_url, url: p.url, is_active: p.is_active })) }),
      })
      onSaved(result.partners)
      toast.success("Partenaires enregistrés et publiés")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'enregistrement des partenaires")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Partenaires ({list.filter((p) => p.is_active).length} affichés)</CardTitle>
            <CardDescription>Logos affichés en bas du site, dans l&#39;ordre de la liste. Un partenaire désactivé est conservé sans être affiché.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setList([...list, { id: `new-${Date.now()}`, name: "", logo_url: "", url: "", position: list.length, is_active: true }])} disabled={list.length >= 60}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {list.map((partner, index) => (
          <div key={partner.id} className="rounded-lg border p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox id={`partner-active-${partner.id}`} checked={partner.is_active} onCheckedChange={(c) => update(index, { is_active: c === true })} />
                <Label htmlFor={`partner-active-${partner.id}`} className="font-normal">
                  Affiché
                </Label>
              </div>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="sm" aria-label="Monter" onClick={() => setList(move(list, index, -1))} disabled={index === 0}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" aria-label="Descendre" onClick={() => setList(move(list, index, 1))} disabled={index === list.length - 1}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="text-destructive" aria-label="Retirer" onClick={() => setList(list.filter((_, i) => i !== index))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor={`partner-name-${partner.id}`}>Nom</Label>
                <Input id={`partner-name-${partner.id}`} maxLength={100} value={partner.name} onChange={(e) => update(index, { name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`partner-url-${partner.id}`}>Site (lien)</Label>
                <Input id={`partner-url-${partner.id}`} maxLength={500} value={partner.url} onChange={(e) => update(index, { url: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <ImageUploadField label="Logo" value={partner.logo_url} onChange={(url) => update(index, { logo_url: url })} />
          </div>
        ))}
        <Button onClick={save} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Enregistrement..." : "Enregistrer les partenaires"}
        </Button>
      </CardContent>
    </Card>
  )
}
