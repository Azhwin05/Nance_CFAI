import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BrandWordmark } from "@/components/shared/brand"

/** Shown when the app is running on placeholder Supabase config. */
export function SetupNotice() {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <BrandWordmark />
        <CardTitle className="text-lg">Connect your backend</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Nance isn&apos;t connected to a Supabase project yet. To bring
          it online:
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Create or restore a Supabase project.</li>
          <li>
            Copy <code className="font-mono">.env.example</code> to{" "}
            <code className="font-mono">.env.local</code> and fill in the URL and
            keys.
          </li>
          <li>
            Apply the SQL migrations in{" "}
            <code className="font-mono">supabase/migrations</code>.
          </li>
          <li>Restart the dev server.</li>
        </ol>
        <p>
          The first account that signs up automatically becomes the Super Admin.
        </p>
      </CardContent>
    </Card>
  )
}
