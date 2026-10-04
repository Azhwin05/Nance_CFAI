"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { BrandWordmark } from "@/components/shared/brand"
import { signInWithPassword, signUpWithPassword } from "@/lib/auth/actions"

const schema = z.object({
  fullName: z.string().optional(),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
})
type Values = z.infer<typeof schema>

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [mode, setMode] = React.useState<"signin" | "signup">("signin")
  const [pending, startTransition] = React.useTransition()

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", password: "" },
  })

  function onSubmit(values: Values) {
    startTransition(async () => {
      const result =
        mode === "signin"
          ? await signInWithPassword(values.email, values.password)
          : await signUpWithPassword(
              values.email,
              values.password,
              values.fullName ?? ""
            )

      if ("error" in result) {
        toast.error(result.error)
        return
      }
      if (mode === "signup") {
        toast.success("Account created. You can sign in now.")
        setMode("signin")
        return
      }
      const to = params.get("redirectedFrom") || "/dashboard"
      router.push(to)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <BrandWordmark />
        <div>
          <CardTitle className="text-lg">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </CardTitle>
          <CardDescription>
            Internal operations platform for Clickfield AI.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {mode === "signup" && (
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="Ashwin" autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@clickfield.ai"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete={
                        mode === "signin" ? "current-password" : "new-password"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={pending}>
              {pending
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>
        </Form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              No account yet?{" "}
              <button
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => setMode("signup")}
                type="button"
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => setMode("signin")}
                type="button"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  )
}
