type PaymentBrandName = "visa" | "mastercard" | "elo" | "amex" | "hipercard" | "pix" | "boleto";

const labels: Record<PaymentBrandName, string> = { visa:"Visa", mastercard:"Mastercard", elo:"Elo", amex:"American Express", hipercard:"Hipercard", pix:"Pix", boleto:"Boleto" };

export const PAYMENT_BRANDS: PaymentBrandName[] = ["visa","mastercard","elo","amex","hipercard","pix","boleto"];

export function PaymentBrand({ brand }: { brand: PaymentBrandName }) {
  return <span className="flex h-9 w-[58px] items-center justify-center rounded-lg border border-white/80 bg-white px-1.5 shadow-[0_5px_14px_rgba(0,0,0,.18),inset_0_0_0_1px_rgba(15,35,26,.04)] transition-transform hover:-translate-y-0.5 sm:h-10 sm:w-[64px]" title={labels[brand]} aria-label={labels[brand]}>
    <svg viewBox="0 0 64 30" aria-hidden="true" className="h-full w-full">
      {brand==="visa"&&<text x="32" y="20" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="15" fontWeight="900" fontStyle="italic" fill="#1434CB">VISA</text>}
      {brand==="mastercard"&&<><circle cx="26" cy="15" r="9" fill="#EB001B"/><circle cx="38" cy="15" r="9" fill="#F79E1B"/><path d="M32 8.3a9 9 0 0 1 0 13.4 9 9 0 0 1 0-13.4Z" fill="#FF5F00"/></>}
      {brand==="elo"&&<><circle cx="18" cy="15" r="9" fill="none" stroke="#111" strokeWidth="4" strokeDasharray="12 5"/><path d="M13 7l4 4M14 22l5-4" stroke="#FFCB05" strokeWidth="3"/><text x="42" y="20" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="14" fontWeight="900" fill="#111">elo</text></>}
      {brand==="amex"&&<><rect x="3" y="5" width="58" height="20" rx="3" fill="#2E77BC"/><text x="32" y="19.5" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="10" fontWeight="900" fill="white">AMEX</text></>}
      {brand==="hipercard"&&<><rect x="3" y="6" width="58" height="18" rx="4" fill="#B3131B"/><text x="32" y="19" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="9.5" fontWeight="800" fill="white">hipercard</text></>}
      {brand==="pix"&&<><g transform="translate(12 5)" fill="none" stroke="#32BCAD" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2 3 8a4 4 0 0 0 0 6l6 6M9 2a4 4 0 0 1 6 0l3 3M9 20a4 4 0 0 0 6 0l3-3M18 5l3 3a4 4 0 0 1 0 6l-3 3M7 10l4 4a3 3 0 0 0 4 0l4-4"/></g><text x="45" y="19" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="12" fontWeight="700" fill="#32BCAD">pix</text></>}
      {brand==="boleto"&&<><path d="M8 6v18M12 6v18M16 6v18M21 6v18M25 6v18M30 6v18M34 6v18M39 6v18" stroke="#111" strokeWidth="1.8"/><text x="51" y="18" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="6.5" fontWeight="700" fill="#111">BOLETO</text></>}
    </svg>
  </span>;
}
