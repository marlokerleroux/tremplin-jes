"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function DeleteApplicationButton() {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch("/api/application/delete", {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la suppression")
      }

      toast({
        title: "Candidature supprimée",
        description: "Votre candidature a été supprimée avec succès.",
      })

      // Redirect to home page
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("[v0] Error deleting application:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer la candidature",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer ma candidature
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Votre candidature et votre fiche technique seront définitivement supprimées.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
