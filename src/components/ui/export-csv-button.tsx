"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  href: string
}

export function ExportCsvButton({ href }: Props) {
  return (
    <Button asChild variant="outline" size="sm">
      <a href={href} download>
        <Download className="w-4 h-4 mr-1" />
        CSV
      </a>
    </Button>
  )
}
