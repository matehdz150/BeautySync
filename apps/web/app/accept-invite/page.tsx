"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AcceptInvitePage() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get("token");

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<{ email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  // 1️⃣ validar token al cargar
  useEffect(() => {
    if (!token) {
      setError("Invalid invite link");
      setLoading(false);
      return;
    }

    fetch(`http://localhost:8000/auth/validate-invite/${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Invite not valid");
        return res.json();
      })
      .then((data) => setInvite(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function submit() {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name,
          password,
        }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message ?? "Could not complete invite");
      }

      alert("Account created — you can login now!");

      router.replace("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading && (
            <p className="flex gap-2 items-center text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking your invite…
            </p>
          )}

          {error && <p className="text-red-500">{error}</p>}

          {invite && !loading && (
            <>
              <p className="text-sm">
                You are accepting the invitation for:
                <br />
                <b>{invite.email}</b>
              </p>

              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <Input
                placeholder="Choose a password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button disabled={!name || !password} onClick={submit}>
                Create account
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}