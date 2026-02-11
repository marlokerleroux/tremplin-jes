"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2 } from "lucide-react"

interface Instrument {
  name: string
  quantity: number
}

interface TechnicalSheetFormProps {
  applicationId: string
  existingSheet: any | null
}

export function TechnicalSheetForm({ applicationId, existingSheet }: TechnicalSheetFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [numberOfPerformers, setNumberOfPerformers] = useState(existingSheet?.number_of_performers || 1)
  const [instruments, setInstruments] = useState<Instrument[]>(
    existingSheet?.instruments || [{ name: "", quantity: 1 }],
  )
  const [needsBackline, setNeedsBackline] = useState(existingSheet?.needs_backline || false)
  const [backlineDetails, setBacklineDetails] = useState(existingSheet?.backline_details || "")
  const [needsSoundEngineer, setNeedsSoundEngineer] = useState(existingSheet?.needs_sound_engineer || false)
  const [technicalRequirements, setTechnicalRequirements] = useState(existingSheet?.technical_requirements || "")
  const [setupTime, setSetupTime] = useState(existingSheet?.setup_time || "")
  const [performanceDuration, setPerformanceDuration] = useState(existingSheet?.performance_duration || "")
  const [specialNeeds, setSpecialNeeds] = useState(existingSheet?.special_needs || "")

  const addInstrument = () => {
    setInstruments([...instruments, { name: "", quantity: 1 }])
  }

  const removeInstrument = (index: number) => {
    if (instruments.length > 1) {
      setInstruments(instruments.filter((_, i) => i !== index))
    }
  }

  const updateInstrument = (index: number, field: keyof Instrument, value: string | number) => {
    const updated = [...instruments]
    updated[index][field] = value as any
    setInstruments(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const sheetData = {
        application_id: applicationId,
        number_of_performers: numberOfPerformers,
        instruments: instruments.filter((inst) => inst.name.trim() !== ""),
        needs_backline: needsBackline,
        backline_details: needsBackline ? backlineDetails : null,
        needs_sound_engineer: needsSoundEngineer,
        technical_requirements: technicalRequirements || null,
        setup_time: setupTime || null,
        performance_duration: performanceDuration || null,
        special_needs: specialNeeds || null,
      }

      const res = await fetch("/api/technical-sheet/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sheetData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erreur lors de l'enregistrement")
      }

      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Configuration scénique</CardTitle>
          <CardDescription>Nombre d'artistes et instruments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Number of Performers */}
          <div className="space-y-2">
            <Label htmlFor="numberOfPerformers">Nombre d'artistes sur scène *</Label>
            <Input
              id="numberOfPerformers"
              type="number"
              min="1"
              max="20"
              required
              value={numberOfPerformers}
              onChange={(e) => setNumberOfPerformers(Number.parseInt(e.target.value) || 1)}
            />
          </div>

          {/* Instruments */}
          <div className="space-y-4">
            <Label>Instruments utilisés *</Label>
            {instruments.map((instrument, index) => (
              <div key={index} className="flex gap-3 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`instrument-name-${index}`} className="text-sm">
                    Instrument
                  </Label>
                  <Input
                    id={`instrument-name-${index}`}
                    placeholder="Ex: Guitare électrique, Batterie, Synthétiseur..."
                    required
                    value={instrument.name}
                    onChange={(e) => updateInstrument(index, "name", e.target.value)}
                  />
                </div>
                <div className="w-24 space-y-2">
                  <Label htmlFor={`instrument-quantity-${index}`} className="text-sm">
                    Quantité
                  </Label>
                  <Input
                    id={`instrument-quantity-${index}`}
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={instrument.quantity}
                    onChange={(e) => updateInstrument(index, "quantity", Number.parseInt(e.target.value) || 1)}
                  />
                </div>
                {instruments.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeInstrument(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addInstrument} className="w-full bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un instrument
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backline */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Backline</CardTitle>
          <CardDescription>Matériel fourni par l'organisation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="needsBackline"
              checked={needsBackline}
              onCheckedChange={(checked) => setNeedsBackline(checked as boolean)}
            />
            <Label htmlFor="needsBackline" className="font-normal cursor-pointer">
              J'ai besoin de matériel backline
            </Label>
          </div>

          {needsBackline && (
            <div className="space-y-2 ml-6">
              <Label htmlFor="backlineDetails">Détails du matériel nécessaire *</Label>
              <Textarea
                id="backlineDetails"
                placeholder="Précisez le matériel dont vous avez besoin (amplis, enceintes, micros, pieds, câbles...)"
                required={needsBackline}
                rows={4}
                value={backlineDetails}
                onChange={(e) => setBacklineDetails(e.target.value)}
                className="resize-none"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sound Engineer */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Ingénieur du son</CardTitle>
          <CardDescription>Besoin d'un technicien son personnel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="needsSoundEngineer"
              checked={needsSoundEngineer}
              onCheckedChange={(checked) => setNeedsSoundEngineer(checked as boolean)}
            />
            <Label htmlFor="needsSoundEngineer" className="font-normal cursor-pointer">
              Je viendrai avec mon propre ingénieur du son
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Technical Requirements */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Exigences techniques</CardTitle>
          <CardDescription>Besoins spécifiques pour votre prestation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="technicalRequirements">Besoins techniques particuliers</Label>
            <Textarea
              id="technicalRequirements"
              placeholder="Éclairage spécifique, effets, configuration particulière..."
              rows={4}
              value={technicalRequirements}
              onChange={(e) => setTechnicalRequirements(e.target.value)}
              className="resize-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="setupTime">Temps d'installation estimé</Label>
              <Input
                id="setupTime"
                placeholder="Ex: 30 minutes"
                value={setupTime}
                onChange={(e) => setSetupTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="performanceDuration">Durée de la prestation</Label>
              <Input
                id="performanceDuration"
                placeholder="Ex: 20 minutes"
                value={performanceDuration}
                onChange={(e) => setPerformanceDuration(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialNeeds">Besoins spéciaux</Label>
            <Textarea
              id="specialNeeds"
              placeholder="Accessibilité, contraintes particulières, allergies..."
              rows={3}
              value={specialNeeds}
              onChange={(e) => setSpecialNeeds(e.target.value)}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="mt-8 space-y-4">
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard")} className="flex-1">
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? "Enregistrement..." : existingSheet ? "Mettre à jour" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </form>
  )
}
