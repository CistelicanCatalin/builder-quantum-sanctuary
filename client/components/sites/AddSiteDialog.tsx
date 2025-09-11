import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import type { SiteCreateRequest, SiteCreateResponse } from "@shared/api";

const schema = z.object({
  url: z.string().min(4, "URL invalid").url("URL invalid"),
  apiKey: z.string().min(16, "Cheie invalidă").regex(/^[a-f0-9]{32,128}$/i, "Cheie hex invalidă"),
});

type FormValues = z.infer<typeof schema>;

export default function AddSiteDialog() {
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { url: "", apiKey: "" } });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const body: SiteCreateRequest = { url: values.url.trim(), apiKey: values.apiKey.trim() };
      const res = await fetch("/api/sites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as SiteCreateResponse;
      toast.success("Site adăugat", { description: data.item.url });
      setOpen(false);
      form.reset();
    } catch (e: any) {
      toast.error("Eroare la salvare", { description: String(e?.message ?? e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          Add Site
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adaugă Site WordPress</DialogTitle>
          <DialogDescription>Introduce link-ul site-ului și cheia API generată de pluginul „WP Manager Client”.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="url" render={({ field }) => (
              <FormItem>
                <FormLabel>URL website</FormLabel>
                <FormControl>
                  <Input placeholder="https://exemplu.ro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="apiKey" render={({ field }) => (
              <FormItem>
                <FormLabel>API key</FormLabel>
                <FormControl>
                  <Input placeholder="64 hex chars" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Anulează</Button>
              <Button type="submit" disabled={loading}>{loading ? "Se salvează..." : "Salvează"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
