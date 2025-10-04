"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { loginUser } from "@/lib/client-store"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const submit = () => {
    const res = loginUser(email, password)
    if (res.ok) {
      toast({ title: "Logged in", description: "Welcome back" })
      router.push("/")
    } else {
      toast({ variant: "destructive", title: "Error", description: res.message })
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-balance">Incident Handler Login</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/register")}>
            Create account
          </Button>
          <Button onClick={submit}>Login</Button>
        </CardFooter>
      </Card>
    </main>
  )
}
