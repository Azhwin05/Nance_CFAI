"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  setLeadStage,
  addLeadActivity,
  convertLeadToClient,
} from "@/app/(app)/leads/actions"
import { LEAD_STAGES } from "@/lib/validation/lead"
import { LEAD_STAGE, statusEntry } from "@/lib/status"

export function LeadActions({
  leadId,
  currentStage,
  canConvert,
  converted,
}: {
  leadId: string
  currentStage: string
  canConvert: boolean
  converted: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [note, setNote] = React.useState("")

  function changeStage(stage: string) {
    startTransition(async () => {
      const result = await setLeadStage(
        leadId,
        stage as (typeof LEAD_STAGES)[number]
      )
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Stage updated")
      router.refresh()
    })
  }

  function convert() {
    startTransition(async () => {
      const result = await convertLeadToClient(leadId)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Converted to client")
      router.push(`/clients/${result.id}`)
      router.refresh()
    })
  }

  function addNote() {
    if (!note.trim()) return
    startTransition(async () => {
      const result = await addLeadActivity(leadId, note)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      setNote("")
      toast.success("Activity added")
      router.refresh()
    })
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-2">
        <Label>Stage</Label>
        <Select
          value={currentStage}
          onValueChange={(v) => v && changeStage(v)}
          disabled={pending}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEAD_STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {statusEntry(LEAD_STAGE, s).label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {canConvert && !converted && (
        <Button onClick={convert} disabled={pending} className="w-full">
          Convert to Client
        </Button>
      )}

      <div className="grid gap-2">
        <Label htmlFor="lead-note">Add activity</Label>
        <Textarea
          id="lead-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Call summary, next steps…"
          rows={2}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={addNote}
          disabled={pending || !note.trim()}
        >
          Add note
        </Button>
      </div>
    </div>
  )
}
