import { AlertCircle, CheckCircle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function StatusBadge({ status }: { status: string }) {
  if (status === "validated") {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="h-4 w-4 mr-1" />
        Validée
      </Badge>
    )
  }
  if (status === "rejected") {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <AlertCircle className="h-4 w-4 mr-1" />
        Refusée
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
      <Clock className="h-4 w-4 mr-1" />
      En attente
    </Badge>
  )
}
