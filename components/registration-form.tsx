"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, FileText, Save } from "lucide-react"
import {
  GROUP_AVERAGE_MAX_AGE,
  GROUP_MEMBER_MAX_AGE,
  GROUP_MEMBER_MIN_AGE,
  SOLO_MAX_AGE,
  SOLO_MIN_AGE,
  formatDateFr,
  formatDateShortFr,
  validateEligibility,
  type ApplicationType,
} from "@/lib/season"
import { applicationCreateSchema, BIOGRAPHY_MIN_LENGTH } from "@/lib/validation/application"
import { formatZodError } from "@/lib/validation/common"

interface GroupMember {
  firstName: string
  lastName: string
  birthDate: string
}

interface RegistrationFormProps {
  /** Édition en cours : le brouillon local est propre à chaque édition. */
  edition: number
  /** Date de référence pour le calcul de l'âge (AAAA-MM-JJ). */
  ageReferenceDate: string
  /** Dates d'audition proposées (AAAA-MM-JJ). */
  auditionDates: string[]
  venue: string
}

interface DraftState {
  savedAt: string
  applicationType: ApplicationType
  stageName: string
  soloBirthDate: string
  groupMembers: GroupMember[]
  biography: string
  musicalStyle: string
  instagram: string
  hasOriginalComposition: boolean
  isSacemRegistered: boolean
  allowsBroadcast: boolean
  hasStageExperience: boolean
  stageExperienceDetails: string
  preferredAuditionDate: string
}

function draftKey(edition: number): string {
  return `tremplin:candidature:${edition}`
}

function readDraft(edition: number): DraftState | null {
  try {
    const raw = window.localStorage.getItem(draftKey(edition))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<DraftState>
    if (!parsed || typeof parsed !== "object" || typeof parsed.savedAt !== "string") return null
    return parsed as DraftState
  } catch {
    return null
  }
}

function writeDraft(edition: number, draft: DraftState | null): void {
  try {
    if (draft) window.localStorage.setItem(draftKey(edition), JSON.stringify(draft))
    else window.localStorage.removeItem(draftKey(edition))
  } catch {
    // Stockage indisponible (navigation privée, quota) : le brouillon est simplement désactivé.
  }
}

export function RegistrationForm({ edition, ageReferenceDate, auditionDates, venue }: RegistrationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftRestoredAt, setDraftRestoredAt] = useState<string | null>(null)
  const draftReady = useRef(false)

  // Form state
  const [applicationType, setApplicationType] = useState<ApplicationType>("solo")
  const [stageName, setStageName] = useState("")
  const [soloBirthDate, setSoloBirthDate] = useState("")
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([
    { firstName: "", lastName: "", birthDate: "" },
    { firstName: "", lastName: "", birthDate: "" },
  ])
  const [biography, setBiography] = useState("")
  const [musicalStyle, setMusicalStyle] = useState("")
  const [instagram, setInstagram] = useState("")
  const [hasOriginalComposition, setHasOriginalComposition] = useState(false)
  const [isSacemRegistered, setIsSacemRegistered] = useState(false)
  const [allowsBroadcast, setAllowsBroadcast] = useState(false)
  const [hasStageExperience, setHasStageExperience] = useState(false)
  const [stageExperienceDetails, setStageExperienceDetails] = useState("")
  const [preferredAuditionDate, setPreferredAuditionDate] = useState("")
  const [acceptedRules, setAcceptedRules] = useState(false)

  const refLabel = formatDateShortFr(ageReferenceDate)

  // Brouillon local : restauré au chargement, puis enregistré à chaque modification (le règlement doit être ré-accepté).
  useEffect(() => {
    const draft = readDraft(edition)
    if (draft) {
      setApplicationType(draft.applicationType === "group" ? "group" : "solo")
      setStageName(draft.stageName ?? "")
      setSoloBirthDate(draft.soloBirthDate ?? "")
      if (Array.isArray(draft.groupMembers) && draft.groupMembers.length >= 2) setGroupMembers(draft.groupMembers)
      setBiography(draft.biography ?? "")
      setMusicalStyle(draft.musicalStyle ?? "")
      setInstagram(draft.instagram ?? "")
      setHasOriginalComposition(Boolean(draft.hasOriginalComposition))
      setIsSacemRegistered(Boolean(draft.isSacemRegistered))
      setAllowsBroadcast(Boolean(draft.allowsBroadcast))
      setHasStageExperience(Boolean(draft.hasStageExperience))
      setStageExperienceDetails(draft.stageExperienceDetails ?? "")
      setPreferredAuditionDate(auditionDates.includes(draft.preferredAuditionDate) ? draft.preferredAuditionDate : "")
      setDraftRestoredAt(draft.savedAt)
    }
    draftReady.current = true
  }, [edition, auditionDates])

  useEffect(() => {
    if (!draftReady.current) return
    const hasContent = stageName || biography || musicalStyle || soloBirthDate || groupMembers.some((m) => m.firstName || m.lastName || m.birthDate)
    if (!hasContent) return
    const timer = window.setTimeout(() => {
      writeDraft(edition, {
        savedAt: new Date().toISOString(),
        applicationType,
        stageName,
        soloBirthDate,
        groupMembers,
        biography,
        musicalStyle,
        instagram,
        hasOriginalComposition,
        isSacemRegistered,
        allowsBroadcast,
        hasStageExperience,
        stageExperienceDetails,
        preferredAuditionDate,
      })
    }, 500)
    return () => window.clearTimeout(timer)
  }, [
    edition,
    applicationType,
    stageName,
    soloBirthDate,
    groupMembers,
    biography,
    musicalStyle,
    instagram,
    hasOriginalComposition,
    isSacemRegistered,
    allowsBroadcast,
    hasStageExperience,
    stageExperienceDetails,
    preferredAuditionDate,
  ])

  const clearDraft = () => {
    writeDraft(edition, null)
    setDraftRestoredAt(null)
    setApplicationType("solo")
    setStageName("")
    setSoloBirthDate("")
    setGroupMembers([
      { firstName: "", lastName: "", birthDate: "" },
      { firstName: "", lastName: "", birthDate: "" },
    ])
    setBiography("")
    setMusicalStyle("")
    setInstagram("")
    setHasOriginalComposition(false)
    setIsSacemRegistered(false)
    setAllowsBroadcast(false)
    setHasStageExperience(false)
    setStageExperienceDetails("")
    setPreferredAuditionDate("")
    setAcceptedRules(false)
  }

  const addGroupMember = () => {
    setGroupMembers([...groupMembers, { firstName: "", lastName: "", birthDate: "" }])
  }

  const removeGroupMember = (index: number) => {
    if (groupMembers.length > 2) {
      setGroupMembers(groupMembers.filter((_, i) => i !== index))
    }
  }

  const updateGroupMember = (index: number, field: keyof GroupMember, value: string) => {
    setGroupMembers(groupMembers.map((member, i) => (i === index ? { ...member, [field]: value } : member)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setError(null)

    const membersData: GroupMember[] =
      applicationType === "solo" ? [{ firstName: "", lastName: "", birthDate: soloBirthDate }] : groupMembers

    const payload = {
      application_type: applicationType,
      stage_name: stageName,
      group_members: membersData,
      biography,
      musical_style: musicalStyle,
      instagram: instagram || null,
      has_original_composition: hasOriginalComposition,
      is_sacem_registered: hasOriginalComposition ? isSacemRegistered : null,
      allows_broadcast: allowsBroadcast,
      has_stage_experience: hasStageExperience,
      stage_experience_details: hasStageExperience ? stageExperienceDetails : null,
      preferred_audition_date: preferredAuditionDate || null,
      accepted_rules: acceptedRules,
    }

    const parsed = applicationCreateSchema.safeParse(payload)
    if (!parsed.success) {
      setError(formatZodError(parsed.error))
      return
    }

    const eligibility = validateEligibility(applicationType, membersData, ageReferenceDate)
    if (!eligibility.valid) {
      setError(eligibility.errors.join(" "))
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/application/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue")
        setIsSubmitting(false)
        return
      }

      // Candidature enregistrée : le brouillon local n'a plus lieu d'être.
      writeDraft(edition, null)
      // Navigation complète pour recharger le tableau de bord avec la nouvelle candidature.
      window.location.assign("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {draftRestoredAt && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm" role="status">
          <p className="flex items-center gap-2">
            <Save className="h-4 w-4 text-primary" />
            Brouillon restauré (enregistré le {new Date(draftRestoredAt).toLocaleString("fr-FR")}). Vos saisies sont conservées sur cet appareil jusqu&#39;à l&#39;envoi.
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={clearDraft}>
            Repartir de zéro
          </Button>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>Type de candidature et identification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Application Type */}
          <div className="space-y-3">
            <Label>Type de candidature *</Label>
            <RadioGroup value={applicationType} onValueChange={(value) => setApplicationType(value as ApplicationType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="solo" id="solo" />
                <Label htmlFor="solo" className="font-normal cursor-pointer">
                  Artiste solo
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="group" id="group" />
                <Label htmlFor="group" className="font-normal cursor-pointer">
                  Groupe
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Stage Name */}
          <div className="space-y-2">
            <Label htmlFor="stageName">Nom de scène *</Label>
            <Input
              id="stageName"
              placeholder="Votre nom d'artiste ou nom du groupe"
              required
              maxLength={100}
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
            />
          </div>

          {applicationType === "solo" && (
            <div className="space-y-2">
              <Label htmlFor="soloBirthDate">Date de naissance *</Label>
              <Input
                id="soloBirthDate"
                type="date"
                required
                value={soloBirthDate}
                onChange={(e) => setSoloBirthDate(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Vous devez avoir entre {SOLO_MIN_AGE} et {SOLO_MAX_AGE} ans au {refLabel}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {applicationType === "group" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Composition du groupe</CardTitle>
            <CardDescription>
              Tous les membres doivent avoir entre {GROUP_MEMBER_MIN_AGE} et {GROUP_MEMBER_MAX_AGE} ans au {refLabel}. La
              moyenne d&#39;âge du groupe doit être de {GROUP_AVERAGE_MAX_AGE} ans maximum.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupMembers.map((member, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Membre {index + 1}</h4>
                  {groupMembers.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGroupMember(index)}
                      aria-label={`Retirer le membre ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`firstName-${index}`}>Prénom *</Label>
                    <Input
                      id={`firstName-${index}`}
                      required
                      maxLength={100}
                      value={member.firstName}
                      onChange={(e) => updateGroupMember(index, "firstName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`lastName-${index}`}>Nom *</Label>
                    <Input
                      id={`lastName-${index}`}
                      required
                      maxLength={100}
                      value={member.lastName}
                      onChange={(e) => updateGroupMember(index, "lastName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`birthDate-${index}`}>Date de naissance *</Label>
                    <Input
                      id={`birthDate-${index}`}
                      type="date"
                      required
                      value={member.birthDate}
                      onChange={(e) => updateGroupMember(index, "birthDate", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addGroupMember} className="w-full bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un membre
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Informations artistiques</CardTitle>
          <CardDescription>Présentez votre univers musical</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Biography */}
          <div className="space-y-2">
            <Label htmlFor="biography">Biographie *</Label>
            <Textarea
              id="biography"
              placeholder="Présentez votre parcours, vos influences, votre projet musical..."
              required
              minLength={BIOGRAPHY_MIN_LENGTH}
              maxLength={5000}
              rows={6}
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              Minimum {BIOGRAPHY_MIN_LENGTH} caractères ({biography.trim().length}/{BIOGRAPHY_MIN_LENGTH})
            </p>
          </div>

          {/* Musical Style */}
          <div className="space-y-2">
            <Label htmlFor="musicalStyle">Style musical *</Label>
            <Input
              id="musicalStyle"
              placeholder="Rock, Pop, Folk, Électro, Jazz, etc."
              required
              maxLength={100}
              value={musicalStyle}
              onChange={(e) => setMusicalStyle(e.target.value)}
            />
          </div>

          {/* Instagram */}
          <div className="space-y-2">
            <Label htmlFor="instagram">Compte Instagram</Label>
            <Input
              id="instagram"
              placeholder="@votre_compte"
              maxLength={100}
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">Optionnel</p>
          </div>

          {/* Original Composition */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasOriginalComposition"
                checked={hasOriginalComposition}
                onCheckedChange={(checked) => setHasOriginalComposition(checked === true)}
              />
              <Label htmlFor="hasOriginalComposition" className="font-normal cursor-pointer">
                Je présenterai une composition originale
              </Label>
            </div>

            {hasOriginalComposition && (
              <div className="ml-6 space-y-3 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isSacemRegistered"
                    checked={isSacemRegistered}
                    onCheckedChange={(checked) => setIsSacemRegistered(checked === true)}
                  />
                  <Label htmlFor="isSacemRegistered" className="font-normal cursor-pointer">
                    Cette composition est enregistrée à la SACEM
                  </Label>
                </div>
              </div>
            )}
          </div>

          {/* Broadcast Authorization */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowsBroadcast"
              checked={allowsBroadcast}
              onCheckedChange={(checked) => setAllowsBroadcast(checked === true)}
            />
            <Label htmlFor="allowsBroadcast" className="font-normal cursor-pointer">
              J&#39;autorise la diffusion de ma prestation sur toutes les plateformes
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Expérience scénique</CardTitle>
          <CardDescription>Parlez-nous de vos prestations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasStageExperience"
              checked={hasStageExperience}
              onCheckedChange={(checked) => setHasStageExperience(checked === true)}
            />
            <Label htmlFor="hasStageExperience" className="font-normal cursor-pointer">
              Je me suis déjà produit(e) sur scène
            </Label>
          </div>

          {hasStageExperience && (
            <div className="space-y-2">
              <Label htmlFor="stageExperienceDetails">À quelles occasions ? *</Label>
              <Textarea
                id="stageExperienceDetails"
                placeholder="Décrivez vos expériences scéniques (festivals, concerts, événements...)"
                required={hasStageExperience}
                maxLength={2000}
                rows={4}
                value={stageExperienceDetails}
                onChange={(e) => setStageExperienceDetails(e.target.value)}
                className="resize-none"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {auditionDates.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Date d&#39;audition</CardTitle>
            <CardDescription>Choisissez votre date préférée ({venue})</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="preferredAuditionDate">Date de préférence</Label>
            <Select value={preferredAuditionDate} onValueChange={setPreferredAuditionDate}>
              <SelectTrigger id="preferredAuditionDate">
                <SelectValue placeholder="Sélectionnez une date" />
              </SelectTrigger>
              <SelectContent>
                {auditionDates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {formatDateFr(date)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Optionnel, sans garantie : le planning est fixé par l&#39;organisation.</p>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6 border-2 border-primary/20">
        <CardHeader>
          <CardTitle>Règlement du tremplin</CardTitle>
          <CardDescription>Veuillez lire et accepter le règlement pour continuer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Règlement du Tremplin Jeunes en Scène</p>
              <Button asChild variant="outline" size="sm">
                <a href="/pdf/reglement.pdf" target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4 mr-2" />
                  Consulter le PDF
                </a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Le règlement détaille les conditions de participation, les critères de sélection, et les modalités du
              tremplin.
            </p>
          </div>
          <div className="flex items-start space-x-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <Checkbox
              id="acceptedRules"
              checked={acceptedRules}
              onCheckedChange={(checked) => setAcceptedRules(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="acceptedRules" className="font-normal cursor-pointer leading-relaxed">
              J&#39;ai lu et j&#39;accepte le règlement du Tremplin Jeunes en Scène organisé par Pass&#39;Musique *
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 space-y-4">
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-lg" role="alert">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="flex-1"
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Envoi en cours..." : "Soumettre ma candidature"}
          </Button>
        </div>
      </div>
    </form>
  )
}
