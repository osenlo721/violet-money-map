import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: Layout,
});

function Layout() {
  return (
    <>
      <nav className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
          <span className="mr-auto font-extrabold text-primary">Finanzas</span>
          {[{ to: "/", label: "Dashboard" }, { to: "/actualizar", label: "Actualizar Datos" }].map((l) => (
            <Link key={l.to} to={l.to} activeOptions={{ exact: true }}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}>
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
      <Outlet />
    </>
  );
}
