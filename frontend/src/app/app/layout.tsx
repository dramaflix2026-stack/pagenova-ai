import { Sidebar } from "@/components/sidebar";

export default function ProductLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <Sidebar />

      <div className="min-h-screen lg:pl-64">
        {children}
      </div>
    </div>
  );
}