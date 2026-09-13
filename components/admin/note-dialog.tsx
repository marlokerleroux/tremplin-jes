"use client"

import { useEffect, useState } from "react"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function NoteDialog({
  stageName,
  currentNote,
  onSave,
}: {
  stageName: string
  currentNote: string | null | undefined
  onSave: (note: string) => Promise<void>
}) {
  const [noteText, setNoteText] = useState(currentNote || "")
  const [isSaving, setIsSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setNoteText(currentNote || "")
    }
  }, [isOpen, currentNote])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(noteText)
      setIsOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 px-2 relative" aria-label={`Notes pour ${stageName}`}>
          <MessageSquare className="h-3 w-3" />
          {currentNote && <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="[overflow-wrap:anywhere]">
        <DialogHeader>
          <DialogTitle>Notes - {stageName}</DialogTitle>
          <DialogDescription>Notes de l&#39;organisateur pour ce candidat</DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Notes internes (problèmes, retards, etc.)"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={4}
          maxLength={2000}
        />
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
