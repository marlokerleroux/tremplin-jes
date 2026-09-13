import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Music, Calendar, Users, FileText, LogOut, Plus, MapPin, Clock, Award } from "lucide-react"
import Link from "next/link"
import { handleSignOut } from "@/lib/auth"
import Image from "next/image"
import { DeleteApplicationButton } from "@/components/delete-application-button"
import { getCurrentApplication, getSeasonState } from "@/lib/season-config"
import { computeAgeAt, formatDateFr, formatDateShortFr, formatDateTimeFr, isMinorAt } from "@/lib/season"
import { normalizeGroupMembers } from "@/lib/admin-data"
import { parentalAuthorizationUrl, technicalSheetUrl } from "@/lib/documents"
import { VerifyEmailBanner } from "@/components/verify-email-banner"

export default async function DashboardPage() {
  const session = await requireAuth()

  if (session.user.role === "admin") {
    redirect("/admin")
  }

  const [fullProfile, season] = await Promise.all([
    prisma.profile.findUnique({ where: { id: session.user.id } }),
    getSeasonState(),
  ])

  const application = await getCurrentApplication(session.user.id, season.config.edition, {
    time_slot: true,
    technical_sheet: true,
    parental_authorizations: true,
  })

  const members = application ? normalizeGroupMembers(application.group_members) : []
  const minorMembers = members
    .map((member, index) => ({
      index,
      firstName: member.firstName,
      lastName: member.lastName,
      age: computeAgeAt(member.birthDate, season.ageReferenceDate),
    }))
    .filter((member) => member.age !== null && isMinorAt(members[member.index].birthDate, season.ageReferenceDate))

  const hasTechnicalSheet = Boolean(application?.technical_sheet?.pdf_url)
  const emailVerified = Boolean(fullProfile?.email_verified_at)
  const canApply = season.registration === "open" && emailVerified

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
    return formatDateFr(dateString, { weekday: false })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/images/design-mode/logo_sans_fond.png"
              alt="Tremplin Jeunes en Scène"
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
            Bonjour, {fullProfile?.first_name} {fullProfile?.last_name}
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Bienvenue sur votre espace candidat · édition {season.config.edition}
          </p>
        </div>

        {!emailVerified && fullProfile && (
          <div className="mb-6">
            <VerifyEmailBanner email={fullProfile.email} />
          </div>
        )}

        {/* No Application State */}
        {!application && (
          <Card className="border-2 border-dashed">
            <CardHeader className="text-center">
              <CardTitle>Aucune candidature</CardTitle>
              <CardDescription>
                {canApply
                  ? `Vous n'avez pas encore soumis de candidature pour l'édition ${season.config.edition}`
                  : season.registration === "closed"
                    ? "Les inscriptions de cette édition sont closes"
                    : season.registration === "not_yet_open"
                      ? "Les inscriptions ne sont pas encore ouvertes"
                      : "Confirmez votre adresse email pour déposer votre candidature"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
              {canApply ? (
                <Button asChild size="lg">
                  <Link href="/apply">
                    <Plus className="h-5 w-5 mr-2" />
                    Créer ma candidature
                  </Link>
                </Button>
              ) : (
                <Button size="lg" disabled>
                  {season.registration === "open" ? "Adresse email à confirmer" : "Inscriptions fermées"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Application Exists */}
        {application && (
          <div className="space-y-6">
            {application.result_sent_at && application.status === "validated" && (
              <Card className={application.is_finalist ? "border-2 border-accent bg-gradient-to-br from-pink-50 to-white" : "border-2 border-gray-300"}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Award className={`h-6 w-6 ${application.is_finalist ? "text-accent" : "text-gray-500"}`} />
                    <CardTitle>{application.is_finalist ? "Vous êtes finaliste !" : "Résultats des auditions"}</CardTitle>
                  </div>
                  <CardDescription>
                    {application.is_finalist
                      ? `Félicitations, ${application.stage_name} fait partie des finalistes de l'édition ${season.config.edition}. Les informations pratiques de la finale vous seront communiquées par email.`
                      : `Merci pour votre participation aux auditions de l'édition ${season.config.edition}. ${application.stage_name} n'a pas été retenu pour la finale cette année ; nous vous encourageons à retenter votre chance.`}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {application.time_slot && season.config.is_validated && application.status !== "rejected" && (
              <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-green-600" />
                    <CardTitle className="text-green-900">Votre créneau d&#39;audition</CardTitle>
                  </div>
                  <CardDescription>Votre audition a été programmée !</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Date</p>
                        <p className="font-semibold text-green-900">{formatDateFr(application.time_slot.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Horaire</p>
                        <p className="font-semibold text-green-900">
                          {application.time_slot.start_time} - {application.time_slot.end_time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Lieu</p>
                        <p className="font-semibold text-green-900">{season.venue}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/60 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-900 leading-relaxed">
                      Les informations ci-dessus font foi ; une convocation par email vous est envoyée en complément.
                      Merci de vous présenter au moins 30 minutes avant votre créneau.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status Card */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>Statut de votre candidature</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(application.status)}
                    {application.status !== "validated" && <DeleteApplicationButton />}
                  </div>
                </div>
                <CardDescription>
                  Candidature soumise le {formatDateTimeFr(application.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {application.status === "pending" && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm text-orange-900 leading-relaxed">
                      Si ce n&#39;est pas déjà fait, merci de penser à déposer votre fiche technique. Vous recevrez une
                      notification par email dès que votre candidature sera validée.
                    </p>
                  </div>
                )}
                {application.status === "validated" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-900 leading-relaxed">
                      Félicitations ! Votre candidature a été validée. Vous recevrez prochainement plus d&#39;informations
                      concernant votre audition.
                    </p>
                  </div>
                )}
                {application.status === "rejected" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-900 leading-relaxed">
                      Malheureusement, votre candidature n&#39;a pas été retenue cette année. Nous vous encourageons à
                      retenter votre chance l&#39;année prochaine.
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b last:border-b-0">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">Fiche technique</p>
                      <p className="text-sm text-muted-foreground">
                        {hasTechnicalSheet ? (
                          <a href={technicalSheetUrl(application.id)} target="_blank" rel="noopener noreferrer" className="underline">
                            Fiche technique envoyée (voir le PDF)
                          </a>
                        ) : (
                          "Veuillez envoyer votre fiche technique"
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 sm:justify-end">
                    {hasTechnicalSheet ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Envoyée
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        À compléter
                      </Badge>
                    )}
                    <Button asChild variant={hasTechnicalSheet ? "outline" : "default"} size="sm">
                      <Link href="/technical-sheet">
                        {hasTechnicalSheet ? (
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
                  const memberAuth = application.parental_authorizations.find((auth) => auth.member_index === member.index)
                  const memberName =
                    application.application_type === "solo"
                      ? "Autorisation parentale"
                      : `Autorisation parentale - ${member.firstName} ${member.lastName}`

                  return (
                    <div key={member.index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b last:border-b-0">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{memberName}</p>
                          <p className="text-sm text-muted-foreground">
                            {memberAuth ? (
                              <a
                                href={parentalAuthorizationUrl(application.id, member.index)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                              >
                                Autorisation parentale envoyée (voir le PDF)
                              </a>
                            ) : (
                              `Obligatoire - ${member.firstName || "vous"} aur${member.firstName ? "a" : "ez"} ${member.age} ans le ${formatDateShortFr(season.ageReferenceDate)}`
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 sm:justify-end">
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
                          <Link href={`/parental-authorization?memberIndex=${member.index}`}>
                            {memberAuth ? (
                              "Voir / Modifier"
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                Envoyer
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
            <div className="grid md:grid-cols-2 gap-6 min-w-0 [&>*]:min-w-0">
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
                    Date d&#39;audition
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
              {application.application_type === "group" && members.length > 0 && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Membres du groupe
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {members.map((member, index) => (
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
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{application.biography}</p>
                </CardContent>
              </Card>

              {/* Stage Experience */}
              {application.has_stage_experience && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Expérience scénique</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{application.stage_experience_details}</p>
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
