"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { decideExpense } from "@/app/(app)/finance/expenses/actions"

type Action = "approved" | "rejected" | "changes_requested"

const META: Record<
  Action,
  { title: string; verb: string; variant: "default" | "destructive" | "outline" }
> = {
  approved: { title: "Approve expense", verb: "Approve", variant: "default" },
  rejected: { title: "Reject expense", verb: "Reject", variant: "destructive" },
  changes_requested: {
    title: "Request changes",
    verb: "Request changes",
    variant: "outline",
  },
}

export function ExpenseApproval({
  expenseId,
  summary,
}: {
  expenseId: string
  summary: string
}) {
  const router = useRouter()
  const [action, setAction] = React.useState<Action | null>(null)
  const [comment, setComment] = React.useState("")
  const [pending, startTransition] = React.useTransition()

  function confirm() {
    if (!action) return
    startTransition(async () => {
      const result = await decideExpense({ expenseId, action, comment })
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(`Expense ${action.replace("_", " ")}`)
      setAction(null)
      setComment("")
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setAction("approved")}>Approve</Button>
        <Button variant="outline" onClick={() => setAction("changes_requested")}>
          Request Changes
        </Button>
        <Button variant="destructive" onClick={() => setAction("rejected")}>
          Reject
        </Button>
      </div>

      <Dialog open={action !== null} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action ? META[action].title : ""}</DialogTitle>
            <DialogDescription>{summary}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="approval-comment">
              Comment {action === "approved" ? "(optional)" : ""}
            </Label>
            <Textarea
              id="approval-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a note for the record…"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant={action ? META[action].variant : "default"}
              onClick={confirm}
              disabled={pending}
            >
              {pending ? "Working…" : action ? META[action].verb : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
