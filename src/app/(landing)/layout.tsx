export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Header will be included in the page component */}
      <main className="flex-1 pt-16">{children}</main>
    </div>
  );
}
