"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin } from "lucide-react"

type Site = {
  id: string
  name: string
}

type Props = {
  sites: Site[]
  currentSiteId: string
}

export function SiteSwitcher({ sites, currentSiteId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (sites.length <= 1) return null

  function handleChange(siteId: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("siteId", siteId)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
      <Select value={currentSiteId} onValueChange={handleChange}>
        <SelectTrigger className="h-8 text-sm border-slate-200 w-auto min-w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sites.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
