import AppShell from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { MysqlSettingsGetResponse, MysqlSettingsSaveRequest } from "@shared/api";

const schema = z.object({
  host: z.string().min(1, "Obligatoriu"),
  port: z.coerce.number().int().min(1).max(65535).default(3306),
  user: z.string().min(1, "Obligatoriu"),
  password: z.string().optional(),
  database: z.string().min(1, "Obligatoriu"),
});

type FormValues = z.infer<typeof schema>;

export default function Settings() {
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { host: "", port: 3306, user: "", password: "", database: "" } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings/mysql");
        const data = (await res.json()) as MysqlSettingsGetResponse;
        if (data.settings) {
          form.reset({ host: data.settings.host, port: data.settings.port, user: data.settings.user, password: "", database: data.settings.database });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onSubmit(values: FormValues) {
    try {
      const body: MysqlSettingsSaveRequest = values;
      const res = await fetch("/api/settings/mysql", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Conexiune salvată", { description: "Schema a fost verificată și creată dacă era nevoie." });
    } catch (e: any) {
      toast.error("Eroare", { description: String(e?.message ?? e) });
    }
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-extrabold tracking-tight mb-4">General</h1>
      <Card>
        <CardHeader>
          <CardTitle>Conectare MySQL (phpMyAdmin)</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="host" render={({ field }) => (
                <FormItem>
                  <FormLabel>Host</FormLabel>
                  <FormControl><Input placeholder="localhost sau IP" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="port" render={({ field }) => (
                <FormItem>
                  <FormLabel>Port</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="user" render={({ field }) => (
                <FormItem>
                  <FormLabel>User</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Parolă</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="database" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Bază de date</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="md:col-span-2 flex items-center justify-end gap-2">
                <Button type="submit" disabled={loading}>Salvează</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
