"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, FileText } from "lucide-react"

interface GroupMember {
  firstName: string
  lastName: string
  birthDate: string
}

interface RegistrationFormProps {
  userId: string
}

export function RegistrationForm({ userId }: RegistrationFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [applicationType, setApplicationType] = useState<"solo" | "group">("solo")
  const [stageName, setStageName] = useState("")
  const [soloBirthDate, setSoloBirthDate] = useState("")
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([{ firstName: "", lastName: "", birthDate: "" }])
  const [biography, setBiography] = useState("")
  const [musicalStyle, setMusicalStyle] = useState("")
  const [instagram, setInstagram] = useState("")
  const [howDidYouHear, setHowDidYouHear] = useState("")
  const [hasOriginalComposition, setHasOriginalComposition] = useState(false)
  const [isSacemRegistered, setIsSacemRegistered] = useState(false)
  const [allowsBroadcast, setAllowsBroadcast] = useState(false)
  const [hasStageExperience, setHasStageExperience] = useState(false)
  const [stageExperienceDetails, setStageExperienceDetails] = useState("")
  const [preferredAuditionDate, setPreferredAuditionDate] = useState("")
  const [acceptedRules, setAcceptedRules] = useState(false)

  const addGroupMember = () => {
    setGroupMembers([...groupMembers, { firstName: "", lastName: "", birthDate: "" }])
  }

  const removeGroupMember = (index: number) => {
    if (groupMembers.length > 1) {
      setGroupMembers(groupMembers.filter((_, i) => i !== index))
    }
  }

  const updateGroupMember = (index: number, field: keyof GroupMember, value: string) => {
    const updated = [...groupMembers]
    updated[index][field] = value
    setGroupMembers(updated)
  }

  const calculateAgeAtAudition = (birthDate: string): number => {
    const birth = new Date(birthDate)
    const auditionDate = new Date(2026, 0, 31) // 31 janvier 2026

    // Calculate difference in milliseconds
    const diffMs = auditionDate.getTime() - birth.getTime()

    // Convert to years (365.25 days per year to account for leap years)
    const ageYears = diffMs / (1000 * 60 * 60 * 24 * 365.25)

    // Round to 2 decimal places
    return Math.round(ageYears * 100) / 100
  }

  const validateSoloAge = (birthDate: string): { valid: boolean; age: number; message?: string } => {
    const age = calculateAgeAtAudition(birthDate)
    if (age < 13) {
      return {
        valid: false,
        age,
        message: `Vous aurez ${age.toFixed(2)} ans au 31 janvier 2026. L'âge minimum est de 13 ans.`,
      }
    }
    if (age >= 24) {
      return {
        valid: false,
        age,
        message: `Vous aurez ${age.toFixed(2)} ans au 31 janvier 2026. L'âge maximum est de 23 ans.`,
      }
    }
    return { valid: true, age }
  }

  const validateGroupMemberAge = (birthDate: string): { valid: boolean; age: number; message?: string } => {
    const age = calculateAgeAtAudition(birthDate)
    if (age < 13) {
      return {
        valid: false,
        age,
        message: `Ce membre aura ${age.toFixed(2)} ans au 31 janvier 2026. L'âge minimum est de 13 ans.`,
      }
    }
    if (age > 25) {
      return {
        valid: false,
        age,
        message: `Ce membre aura ${age.toFixed(2)} ans au 31 janvier 2026. L'âge maximum pour un membre d'un groupe est de 25 ans.`,
      }
    }
    return { valid: true, age }
  }

  const validateGroupAverageAge = (members: GroupMember[]): { valid: boolean; average: number; message?: string } => {
    const ages = members.map((m) => calculateAgeAtAudition(m.birthDate))
    const average = ages.reduce((sum, age) => sum + age, 0) / ages.length

    if (average > 23) {
      return {
        valid: false,
        average,
        message: `La moyenne d'âge du groupe est de ${average.toFixed(2)} ans au 31 janvier 2026. Elle doit être de 23 ans maximum.`,
      }
    }
    return { valid: true, average }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setIsLoading(true)
    setError(null)

    if (!acceptedRules) {
      setError("Vous devez accepter le règlement du tremplin pour soumettre votre candidature")
      setIsLoading(false)
      setIsSubmitting(false)
      return
    }

    if (applicationType === "solo") {
      const validation = validateSoloAge(soloBirthDate)
      if (!validation.valid) {
        setError(validation.message!)
        setIsLoading(false)
        setIsSubmitting(false)
        return
      }
    }

    if (applicationType === "group") {
      for (let i = 0; i < groupMembers.length; i++) {
        const member = groupMembers[i]
        if (!member.birthDate) {
          setError(`Veuillez renseigner la date de naissance du membre ${i + 1}`)
          setIsLoading(false)
          setIsSubmitting(false)
          return
        }

        const validation = validateGroupMemberAge(member.birthDate)
        if (!validation.valid) {
          setError(`Membre ${i + 1} : ${validation.message}`)
          setIsLoading(false)
          setIsSubmitting(false)
          return
        }
      }

      const averageValidation = validateGroupAverageAge(groupMembers)
      if (!averageValidation.valid) {
        setError(averageValidation.message!)
        setIsLoading(false)
        setIsSubmitting(false)
        return
      }
    }

    try {
      const membersData =
        applicationType === "solo" ? [{ firstName: "", lastName: "", birthDate: soloBirthDate }] : groupMembers

      const res = await fetch("/api/application/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_type: applicationType,
          stage_name: stageName,
          group_members: membersData,
          biography,
          musical_style: musicalStyle,
          instagram: instagram || null,
          how_did_you_hear: howDidYouHear || null,
          has_original_composition: hasOriginalComposition,
          is_sacem_registered: hasOriginalComposition ? isSacemRegistered : null,
          allows_broadcast: allowsBroadcast,
          has_stage_experience: hasStageExperience,
          stage_experience_details: hasStageExperience ? stageExperienceDetails : null,
          preferred_audition_date: preferredAuditionDate || null,
          accepted_rules: acceptedRules,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue")
        setIsLoading(false)
        setIsSubmitting(false)
        return
      }

      try {
        await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "application_submitted",
            email: "",  // The API route will use session data
            firstName: "",
            lastName: "",
            applicationType: applicationType,
          }),
        })
      } catch (emailError) {
        console.error("Failed to send application email:", emailError)
      }

      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
      setIsLoading(false)
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>Type de candidature et identification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Application Type */}
          <div className="space-y-3">
            <Label>Type de candidature *</Label>
            <RadioGroup
              value={applicationType}
              onValueChange={(value) => setApplicationType(value as "solo" | "group")}
            >
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
              <p className="text-sm text-muted-foreground">Vous devez avoir entre 13 et 23 ans au 31 janvier 2026</p>
            </div>
          )}
        </CardContent>
      </Card>

      {applicationType === "group" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Composition du groupe</CardTitle>
            <CardDescription>
              Tous les membres doivent avoir entre 13 et 25 ans au 31 janvier 2026. La moyenne d'âge du groupe doit être
              de 23 ans maximum.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupMembers.map((member, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Membre {index + 1}</h4>
                  {groupMembers.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeGroupMember(index)}>
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
                      value={member.firstName}
                      onChange={(e) => updateGroupMember(index, "firstName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`lastName-${index}`}>Nom *</Label>
                    <Input
                      id={`lastName-${index}`}
                      required
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
              rows={6}
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">Minimum 100 caractères</p>
          </div>

          {/* Musical Style */}
          <div className="space-y-2">
            <Label htmlFor="musicalStyle">Style musical *</Label>
            <Input
              id="musicalStyle"
              placeholder="Rock, Pop, Folk, Électro, Jazz, etc."
              required
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
                onCheckedChange={(checked) => setHasOriginalComposition(checked as boolean)}
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
                    onCheckedChange={(checked) => setIsSacemRegistered(checked as boolean)}
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
              onCheckedChange={(checked) => setAllowsBroadcast(checked as boolean)}
            />
            <Label htmlFor="allowsBroadcast" className="font-normal cursor-pointer">
              J'autorise la diffusion de ma prestation sur toutes les plateformes
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
              onCheckedChange={(checked) => setHasStageExperience(checked as boolean)}
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
                rows={4}
                value={stageExperienceDetails}
                onChange={(e) => setStageExperienceDetails(e.target.value)}
                className="resize-none"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Date d'audition</CardTitle>
          <CardDescription>Choisissez votre date préférée à l'espace Léo Ferré Brest</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="preferredAuditionDate">Date de préférence</Label>
          <Select value={preferredAuditionDate} onValueChange={setPreferredAuditionDate}>
            <SelectTrigger id="preferredAuditionDate">
              <SelectValue placeholder="Sélectionnez une date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026-01-31">Samedi 31 janvier 2026</SelectItem>
              <SelectItem value="2026-02-01">Dimanche 1er février 2026</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

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
              onCheckedChange={(checked) => setAcceptedRules(checked as boolean)}
              className="mt-0.5"
            />
            <Label htmlFor="acceptedRules" className="font-normal cursor-pointer leading-relaxed">
              J'ai lu et j'accepte le règlement du Tremplin Jeunes en Scène organisé par Pass'Musique *
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 space-y-4">
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
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
          <Button type="submit" disabled={isLoading || isSubmitting} className="flex-1">
            {isLoading ? "Envoi en cours..." : "Soumettre ma candidature"}
          </Button>
        </div>
      </div>
    </form>
  )
}
