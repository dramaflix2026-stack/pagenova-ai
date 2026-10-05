"use client";

export default function CrmPage() {
  return (
    <div className="h-[calc(100vh-0px)] w-full overflow-hidden bg-white">
      <iframe
        src="/stavo-crm/index.html#/"
        title="CRM"
        className="h-full w-full border-0"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}