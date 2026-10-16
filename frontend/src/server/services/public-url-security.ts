import dns from "node:dns/promises";
import net from "node:net";

export function isPrivateIp(
  ip: string
): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] =
      ip.split(".").map(Number);

    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;

    if (
      a === 169 &&
      b === 254
    ) {
      return true;
    }

    if (
      a === 172 &&
      b >= 16 &&
      b <= 31
    ) {
      return true;
    }

    if (
      a === 192 &&
      b === 168
    ) {
      return true;
    }
    // Reserved, carrier-grade NAT, documentation, benchmarking,
    // multicast, and cloud metadata IP ranges must never be contacted.
    const c=Number(ip.split(".")[2]);
    if(a>=224||a===100&&b>=64&&b<=127||a===192&&b===0||
       a===192&&b===0&&c===2||a===198&&b===18||a===198&&b===19||
       a===198&&b===51&&c===100||a===203&&b===0&&c===113||
       a===192&&b===88||a===192&&b===9||a===198&&b===19||
       a===255)return true;
    return false;
  }

  if (net.isIPv6(ip)) {
    const normalized =
      ip.toLowerCase();

    return (
      normalized === "::1" ||
      normalized === "::" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe8") ||
      normalized.startsWith("fe9") ||
      normalized.startsWith("fea") ||
      normalized.startsWith("feb")
    );
  }

  return true;
}

export async function assertPublicUrl(
  rawUrl: string
): Promise<URL> {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("URL_INVALIDA");
  }

  if (
    !["http:", "https:"].includes(
      url.protocol
    )
  ) {
    throw new Error(
      "PROTOCOLO_NAO_PERMITIDO"
    );
  }

  if (
    url.username ||
    url.password
  ) {
    throw new Error(
      "URL_COM_CREDENCIAIS_NAO_PERMITIDA"
    );
  }

  const hostname =
    url.hostname.toLowerCase();

  if(url.port&&url.port!=="443"&&url.port!=="80")
    throw new Error("PORTA_NAO_PERMITIDA");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "0.0.0.0"
  ) {
    throw new Error(
      "HOST_NAO_PERMITIDO"
    );
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error(
        "HOST_NAO_PERMITIDO"
      );
    }

    return url;
  }

  let addresses: Array<{
    address: string;
    family: number;
  }>;

  try {
    addresses =
      await dns.lookup(
        hostname,
        {
          all: true,
        }
      );
  } catch {
    throw new Error(
      "HOST_NAO_ENCONTRADO"
    );
  }

  if (!addresses.length) {
    throw new Error(
      "HOST_NAO_ENCONTRADO"
    );
  }

  if (
    addresses.some(
      (item) =>
        isPrivateIp(
          item.address
        )
    )
  ) {
    throw new Error(
      "HOST_NAO_PERMITIDO"
    );
  }

  return url;
}