export function AppHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="border-b border-white/10 bg-[#0b0b0b]/90 px-6 py-5 backdrop-blur lg:px-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-xl font-bold tracking-tight text-white">
          {title}
        </h1>

        {description && (
          <p className="mt-1 text-sm text-neutral-500">
            {description}
          </p>
        )}
      </div>
    </header>
  );
}