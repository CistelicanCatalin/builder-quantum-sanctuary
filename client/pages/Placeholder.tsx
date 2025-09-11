import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Placeholder({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl text-center mt-10">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-muted-foreground">{description}</p>
        ) : null}
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button asChild>
            <Link to="/">Back to Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/sites">Go to Sites</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
