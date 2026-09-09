"use client"

import { Download, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { AdminApplicationDTO } from "@/lib/admin-data"
import { getMinorMembers, hasTechnicalSheet, memberLabel } from "@/lib/admin-client"
import { computeAgeAt, formatDateFr, formatDateShortFr } from "@/lib/season"
import { parentalAuthorizationUrl, technicalSheetUrl } from "@/lib/documents"
import type { UploadTarget } from "./upload-dialog"

export function ApplicationDetailsDialog({
  application,
  ageReferenceDate,
  onClose,
  onUpload,
}: {
  application: AdminApplicationDTO | null
  ageReferenceDate: string
  onClose: () => void
  onUpload: (target: UploadTarget) => void
}) {
  if (!application) return null
  const refLabel = formatDateShortFr(ageReferenceDate)
  const minors = getMinorMembers(application, ageReferenceDate)
  const formatDate = (value: string | null) => (value ? formatDateFr(value, { weekday: false }) : "Non spécifiée")

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{application.stage_name}</DialogTitle>
          <DialogDescription>Détails de la candidature · édition {application.edition}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <section className="space-y-2">
            <h4 className="font-semibold">Contact</h4>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Nom :</span> {application.profile?.first_name || "N/A"}{" "}
                {application.profile?.last_name || ""}
              </p>
              <p>
                <span className="text-muted-foreground">Email :</span> {application.profile?.email || "N/A"}
              </p>
              {application.profile?.phone && (
                <p>
                  <span className="text-muted-foreground">Téléphone :</span> {application.profile.phone}
                </p>
              )}
              <p>
                <span className="text-muted-foreground">Adresse :</span> {application.profile?.street_address || "N/A"}
              </p>
              <p>
                <span className="text-muted-foreground">Ville :</span> {application.profile?.postal_code || ""}{" "}
                {application.profile?.city || "N/A"}
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h4 className="font-semibold">Informations générales</h4>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Type :</span>{" "}
                {application.application_type === "solo" ? "Artiste solo" : "Groupe"}
              </p>
              {application.application_type === "solo" && application.group_members[0]?.birthDate && (
                <p>
                  <span className="text-muted-foreground">Date de naissance :</span>{" "}
                  {formatDate(application.group_members[0].birthDate)} (
                  {computeAgeAt(application.group_members[0].birthDate, ageReferenceDate) ?? "?"} ans au {refLabel})
                </p>
              )}
              <p>
                <span className="text-muted-foreground">Genre musical :</span> {application.musical_style}
              </p>
              {application.instagram && (
                <p>
                  <span className="text-muted-foreground">Instagram :</span>{" "}
                  <a
                    href={`https://instagram.com/${application.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    @{application.instagram.replace("@", "")}
                  </a>
                </p>
              )}
              <p>
                <span className="text-muted-foreground">Date d&#39;audition préférée :</span>{" "}
                {formatDate(application.preferred_audition_date)}
              </p>
            </div>
          </section>

          {application.application_type === "group" && application.group_members.length > 0 && (
            <section className="space-y-2">
              <h4 className="font-semibold">Membres du groupe</h4>
              <div className="grid sm:grid-cols-2 gap-2">
                {application.group_members.map((member, index) => (
                  <div key={index} className="p-2 bg-muted/50 rounded text-sm">
                    <p className="font-medium">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-muted-foreground">Né(e) le {formatDate(member.birthDate)}</p>
                    <p className="text-muted-foreground">
                      {computeAgeAt(member.birthDate, ageReferenceDate) ?? "?"} ans au {refLabel}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-2">
            <h4 className="font-semibold">Biographie</h4>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{application.biography}</p>
          </section>

          <section className="space-y-2">
            <h4 className="font-semibold">Informations complémentaires</h4>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Composition originale :</span>{" "}
                {application.has_original_composition ? "Oui" : "Non"}
              </p>
              {application.has_original_composition && (
                <p>
                  <span className="text-muted-foreground">SACEM :</span> {application.is_sacem_registered ? "Oui" : "Non"}
                </p>
              )}
              <p>
                <span className="text-muted-foreground">Autorise la diffusion :</span> {application.allows_broadcast ? "Oui" : "Non"}
              </p>
              <p>
                <span className="text-muted-foreground">Expérience scénique :</span> {application.has_stage_experience ? "Oui" : "Non"}
              </p>
            </div>
          </section>

          {application.has_stage_experience && application.stage_experience_details && (
            <section className="space-y-2">
              <h4 className="font-semibold">Détails de l&#39;expérience scénique</h4>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{application.stage_experience_details}</p>
            </section>
          )}

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Fiche technique</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpload({ type: "technical", applicationId: application.id, stageName: application.stage_name })}
              >
                <Upload className="h-4 w-4 mr-2" />
                {hasTechnicalSheet(application) ? "Remplacer" : "Ajouter"}
              </Button>
            </div>
            {hasTechnicalSheet(application) ? (
              <a
                href={technicalSheetUrl(application.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <Download className="h-4 w-4" />
                <span>Télécharger la fiche technique (PDF)</span>
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune fiche technique envoyée</p>
            )}
          </section>

          {minors.length > 0 && (
            <section className="space-y-2">
              <h4 className="font-semibold">Autorisations parentales</h4>
              <div className="space-y-3">
                {minors.map((minor) => {
                  const auth = application.parental_authorizations.find((a) => a.member_index === minor.index)
                  const label = memberLabel(application, minor)
                  return (
                    <div key={minor.index} className="p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">
                          {label} ({minor.age ?? "?"} ans au {refLabel})
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onUpload({
                              type: "parental",
                              applicationId: application.id,
                              stageName: application.stage_name,
                              memberIndex: minor.index,
                              memberName: label,
                            })
                          }
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {auth ? "Remplacer" : "Ajouter"}
                        </Button>
                      </div>
                      {auth ? (
                        <a
                          href={parentalAuthorizationUrl(application.id, minor.index)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                        >
                          <Download className="h-4 w-4" />
                          <span>Télécharger l&#39;autorisation parentale (PDF)</span>
                        </a>
                      ) : (
                        <p className="text-sm text-red-600 font-medium">⚠️ Autorisation parentale obligatoire non fournie</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
