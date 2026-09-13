"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus, Save, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { AdminApplicationDTO } from "@/lib/admin-data"
import type { GroupMember } from "@/lib/validation/application"
import { apiJson } from "@/lib/admin-client"

interface EditFormData {
  stage_name: string
  musical_style: string
  biography: string
  instagram: string
  has_original_composition: boolean
  is_sacem_registered: boolean
  has_stage_experience: boolean
  stage_experience_details: string
  group_members: GroupMember[]
}

function toFormData(application: AdminApplicationDTO): EditFormData {
  return {
    stage_name: application.stage_name || "",
    musical_style: application.musical_style || "",
    biography: application.biography || "",
    instagram: application.instagram || "",
    has_original_composition: application.has_original_composition || false,
    is_sacem_registered: application.is_sacem_registered || false,
    has_stage_experience: application.has_stage_experience || false,
    stage_experience_details: application.stage_experience_details || "",
    group_members: application.group_members.length > 0 ? application.group_members : [{ firstName: "", lastName: "", birthDate: "" }],
  }
}

export function EditApplicationDialog({
  application,
  onClose,
  onSaved,
}: {
  application: AdminApplicationDTO | null
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [form, setForm] = useState<EditFormData | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setForm(application ? toFormData(application) : null)
  }, [application])

  const updateMember = (index: number, field: keyof GroupMember, value: string) => {
    if (!form) return
    setForm({
      ...form,
      group_members: form.group_members.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    })
  }

  const save = async () => {
    if (!application || !form) return
    setIsSaving(true)
    try {
      await apiJson("/api/admin/application/update", {
        method: "PUT",
        body: JSON.stringify({
          applicationId: application.id,
          updates: {
            ...form,
            instagram: form.instagram || null,
            stage_experience_details: form.stage_experience_details || null,
          },
        }),
      })
      await onSaved()
      toast.success("Candidature mise à jour")
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={application !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto [overflow-wrap:anywhere]">
        <DialogHeader>
          <DialogTitle>Éditer la candidature</DialogTitle>
          <DialogDescription>Modifiez les informations de la candidature de {application?.stage_name}</DialogDescription>
        </DialogHeader>

        {form && (
          <div className="space-y-6 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-stage-name">Nom de scène</Label>
                <Input id="edit-stage-name" value={form.stage_name} onChange={(e) => setForm({ ...form, stage_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-musical-style">Style musical</Label>
                <Input
                  id="edit-musical-style"
                  value={form.musical_style}
                  onChange={(e) => setForm({ ...form, musical_style: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-instagram">Instagram</Label>
              <Input
                id="edit-instagram"
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                placeholder="@username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-biography">Biographie</Label>
              <Textarea id="edit-biography" value={form.biography} onChange={(e) => setForm({ ...form, biography: e.target.value })} rows={5} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-original"
                  checked={form.has_original_composition}
                  onCheckedChange={(checked) => setForm({ ...form, has_original_composition: checked === true })}
                />
                <Label htmlFor="edit-original">Propose une composition originale</Label>
              </div>

              {form.has_original_composition && (
                <div className="flex items-center space-x-2 ml-6">
                  <Checkbox
                    id="edit-sacem"
                    checked={form.is_sacem_registered}
                    onCheckedChange={(checked) => setForm({ ...form, is_sacem_registered: checked === true })}
                  />
                  <Label htmlFor="edit-sacem">Inscrit à la SACEM</Label>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-experience"
                  checked={form.has_stage_experience}
                  onCheckedChange={(checked) => setForm({ ...form, has_stage_experience: checked === true })}
                />
                <Label htmlFor="edit-experience">A une expérience scénique</Label>
              </div>

              {form.has_stage_experience && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="edit-experience-details">Détails de l&#39;expérience</Label>
                  <Textarea
                    id="edit-experience-details"
                    value={form.stage_experience_details}
                    onChange={(e) => setForm({ ...form, stage_experience_details: e.target.value })}
                    rows={3}
                  />
                </div>
              )}
            </div>

            {application?.application_type === "group" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Membres du groupe</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setForm({ ...form, group_members: [...form.group_members, { firstName: "", lastName: "", birthDate: "" }] })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un membre
                  </Button>
                </div>

                <div className="space-y-4">
                  {form.group_members.map((member, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 grid gap-4 sm:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor={`edit-member-first-${index}`}>Prénom</Label>
                            <Input id={`edit-member-first-${index}`} value={member.firstName} onChange={(e) => updateMember(index, "firstName", e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-member-last-${index}`}>Nom</Label>
                            <Input id={`edit-member-last-${index}`} value={member.lastName} onChange={(e) => updateMember(index, "lastName", e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-member-birth-${index}`}>Date de naissance</Label>
                            <Input
                              id={`edit-member-birth-${index}`}
                              type="date"
                              value={member.birthDate}
                              onChange={(e) => updateMember(index, "birthDate", e.target.value)}
                            />
                          </div>
                        </div>
                        {form.group_members.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            aria-label={`Retirer le membre ${index + 1}`}
                            onClick={() => setForm({ ...form, group_members: form.group_members.filter((_, i) => i !== index) })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {application?.application_type === "solo" && (
              <div className="space-y-2">
                <Label htmlFor="edit-solo-birth">Date de naissance</Label>
                <Input
                  id="edit-solo-birth"
                  type="date"
                  value={form.group_members[0]?.birthDate || ""}
                  onChange={(e) => updateMember(0, "birthDate", e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button onClick={save} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
