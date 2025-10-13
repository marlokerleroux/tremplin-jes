import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Music, Calendar, Users, FileText, LogOut, Plus, MapPin, Clock } from "lucide-react"
import Link from "next/link"
import { handleSignOut } from "@/lib/auth"
import Image from "next/image"
import { DeleteApplicationButton } from "@/components/delete-application-button"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  const { data: application } = await supabase
    .from("applications")
    .select(`
      *,
      time_slots!applications_time_slot_id_fkey (
        id,
        date,
        start_time,
        end_time
      ),
      technical_sheets (
        id,
        pdf_url,
        created_at
      ),
      parental_authorizations (
        id,
        member_index,
        member_name,
        pdf_url,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .maybeSingle()

  if (application && application.technical_sheets && !Array.isArray(application.technical_sheets)) {
    application.technical_sheets = [application.technical_sheets]
  }

  if (application && application.parental_authorizations && !Array.isArray(application.parental_authorizations)) {
    application.parental_authorizations = [application.parental_authorizations]
  }

  const { data: scheduleConfigData } = await supabase
    .from("schedule_config")
    .select("is_validated")
    .order("created_at", { ascending: false })
    .limit(1)

  const scheduleConfig = scheduleConfigData && scheduleConfigData.length > 0 ? scheduleConfigData[0] : null

  const minorMembers = application
    ? (() => {
        const auditionDate = new Date(2026, 0, 31) // 31 janvier 2026

        const calculateAgeAtAudition = (birthDate: string): number => {
          const birth = new Date(birthDate)
          let age = auditionDate.getFullYear() - birth.getFullYear()
          const monthDiff = auditionDate.getMonth() - birth.getMonth()

          if (monthDiff < 0 || (monthDiff === 0 && auditionDate.getDate() < birth.getDate())) {
            age--
          }

          return age
        }

        const members = application.group_members as any[]
        if (!members || members.length === 0) return []

        return members
          .map((member, index) => ({
            index,
            firstName: member.firstName || "",
            lastName: member.lastName || "",
            birthDate: member.birthDate,
            age: member.birthDate ? calculateAgeAtAudition(member.birthDate) : null,
          }))
          .filter((member) => member.age !== null && member.age < 18)
      })()
    : []

  const needsParentalAuth = minorMembers.length > 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            En attente
          </Badge>
        )
      case "validated":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Validée
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Refusée
          </Badge>
        )
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non spécifiée"
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatTimeSlotDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // Extract HH:MM from HH:MM:SS
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/images/design-mode/logo_sans_fond.png"
              alt="Tremplin Musical Breton"
              width={200}
              height={48}
              className="h-12 w-auto"
            />
          </div>
          <form action={handleSignOut}>
            <Button variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-indigo-900 mb-2">
            Bonjour, {profile?.first_name} {profile?.last_name}
          </h2>
          <p className="text-gray-700 leading-relaxed">Bienvenue sur votre espace candidat</p>
        </div>

        {/* No Application State */}
        {!application && (
          <Card className="border-2 border-dashed">
            <CardHeader className="text-center">
              <CardTitle>Aucune candidature</CardTitle>
              <CardDescription>Vous n'avez pas encore soumis de candidature</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
              <Button asChild size="lg">
                <Link href="/apply">
                  <Plus className="h-5 w-5 mr-2" />
                  Créer ma candidature
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Application Exists */}
        {application && (
          <div className="space-y-6">
            {application.time_slots && scheduleConfig?.is_validated === true && (
              <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-green-600" />
                    <CardTitle className="text-green-900">Votre créneau d'audition</CardTitle>
                  </div>
                  <CardDescription>Votre audition a été programmée !</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Date</p>
                        <p className="font-semibold text-green-900">
                          {formatTimeSlotDate(application.time_slots.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Horaire</p>
                        <p className="font-semibold text-green-900">
                          {formatTime(application.time_slots.start_time)} -{" "}
                          {formatTime(application.time_slots.end_time)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Lieu</p>
                        <p className="font-semibold text-green-900">Espace Léo Ferré, Brest</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/60 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-900 leading-relaxed">
                      📧 Un email de confirmation avec tous les détails vous sera envoyé. Merci de vous présenter au
                      moins 30 minutes avant votre créneau.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Statut de votre candidature</CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(application.status)}
                    {application.status !== "validated" && <DeleteApplicationButton />}
                  </div>
                </div>
                <CardDescription>Candidature soumise le {formatDate(application.created_at)}</CardDescription>
              </CardHeader>
              <CardContent>
                {application.status === "pending" && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm text-orange-900 leading-relaxed">
                      Si ce n'est pas déjà fait, merci de penser à déposer votre fiche technique. Vous recevrez une
                      notification par email dès que votre candidature sera validée.
                    </p>
                  </div>
                )}
                {application.status === "validated" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-900 leading-relaxed">
                      Félicitations ! Votre candidature a été validée. Vous recevrez prochainement plus d'informations
                      concernant votre audition.
                    </p>
                  </div>
                )}
                {application.status === "rejected" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-900 leading-relaxed">
                      Malheureusement, votre candidature n'a pas été retenue cette année. Nous vous encourageons à
                      retenter votre chance l'année prochaine.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents to Provide */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Documents à fournir
                </CardTitle>
                <CardDescription>
                  Veuillez fournir tous les documents requis pour finaliser votre candidature
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">Fiche technique</p>
                      <p className="text-sm text-muted-foreground">
                        {application.technical_sheets && application.technical_sheets.length > 0
                          ? "Fiche technique envoyée"
                          : "Veuillez remplir votre fiche technique"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {application.technical_sheets && application.technical_sheets.length > 0 ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Envoyée
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        À compléter
                      </Badge>
                    )}
                    <Button
                      asChild
                      variant={
                        application.technical_sheets && application.technical_sheets.length > 0 ? "outline" : "default"
                      }
                      size="sm"
                    >
                      <Link href="/technical-sheet">
                        {application.technical_sheets && application.technical_sheets.length > 0 ? (
                          "Voir / Modifier"
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Compléter
                          </>
                        )}
                      </Link>
                    </Button>
                  </div>
                </div>

                {minorMembers.map((member) => {
                  const memberAuth = application.parental_authorizations?.find(
                    (auth: any) => auth.member_index === member.index,
                  )
                  const memberName =
                    application.application_type === "solo"
                      ? "Autorisation parentale"
                      : `Autorisation parentale - ${member.firstName} ${member.lastName}`

                  return (
                    <div key={member.index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{memberName}</p>
                          <p className="text-sm text-muted-foreground">
                            {memberAuth
                              ? "Autorisation parentale envoyée"
                              : `Obligatoire - ${member.firstName} aura ${member.age} ans le 31/01/2026`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {memberAuth ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Envoyée
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Obligatoire
                          </Badge>
                        )}
                        <Button asChild variant={memberAuth ? "outline" : "default"} size="sm">
                          <Link
                            href={`/parental-authorization?memberIndex=${member.index}&memberName=${encodeURIComponent(
                              `${member.firstName} ${member.lastName}`,
                            )}`}
                          >
                            {memberAuth ? (
                              "Voir / Modifier"
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                Uploader
                              </>
                            )}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Application Details */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* General Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5 text-primary" />
                    Informations générales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">{application.application_type === "solo" ? "Artiste solo" : "Groupe"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nom de scène</p>
                    <p className="font-medium">{application.stage_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Style musical</p>
                    <p className="font-medium">{application.musical_style}</p>
                  </div>
                  <div className="pt-2 border-t">
                    <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
                      <a href="/pdf/reglement.pdf" target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        Consulter le règlement
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Audition Date */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Date d'audition
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Date préférée (non garantie)</p>
                    <p className="font-medium">{formatDate(application.preferred_audition_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Composition originale</p>
                    <p className="font-medium">{application.has_original_composition ? "Oui" : "Non"}</p>
                  </div>
                  {application.has_original_composition && (
                    <div>
                      <p className="text-sm text-muted-foreground">Enregistrée à la SACEM</p>
                      <p className="font-medium">{application.is_sacem_registered ? "Oui" : "Non"}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Group Members */}
              {application.application_type === "group" && application.group_members && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Membres du groupe
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(application.group_members as any[]).map((member: any, index: number) => (
                        <div key={index} className="p-3 bg-muted/50 rounded-lg">
                          <p className="font-medium">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">Né(e) le {formatDate(member.birthDate)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Biography */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Biographie</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{application.biography}</p>
                </CardContent>
              </Card>

              {/* Stage Experience */}
              {application.has_stage_experience && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Expérience scénique</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {application.stage_experience_details}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
