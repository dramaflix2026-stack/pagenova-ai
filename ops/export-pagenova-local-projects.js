// PageNova original-origin exporter. No network, deletes, updates or schema upgrades.
// Codec SHA256 678f96c9e69d8a297fa4bc4ecba92f64c864bbd193fbbe7ee2519b850a6ae8da
(async()=>{
const FORMAT = "pagenova-project-backup";
const MAX_BYTES = 128 * 1024 * 1024;
const viewTypes = { Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array, DataView };
const base64 = (bytes) => { let s = ""; for (let i = 0; i < bytes.length; i += 32766)
    s += btoa(String.fromCharCode(...bytes.subarray(i, i + 32766))); return s; };
const unbase64 = (s) => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function sha(text) { return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))), b => b.toString(16).padStart(2, "0")).join(""); }
function bad() { throw Error("Arquivo de backup inválido ou não suportado. Nenhum projeto foi alterado."); }
async function encodePortableGraph(input) {
    const nodes = [];
    const seen = new Map();
    const encode = async (value, depth = 0) => {
        if (depth > 512)
            bad();
        if (value === null)
            return ["null"];
        if (value === undefined)
            return ["undefined"];
        if (typeof value === "string" || typeof value === "boolean")
            return [typeof value, value];
        if (typeof value === "number")
            return ["number", Object.is(value, -0) ? "-0" : Number.isFinite(value) ? value : String(value)];
        if (typeof value === "bigint")
            return ["bigint", String(value)];
        if (typeof value !== "object")
            bad();
        const found = seen.get(value);
        if (found !== undefined)
            return ["ref", found];
        const id = nodes.length;
        if (id > 200000)
            bad();
        seen.set(value, id);
        nodes.push([]);
        const next = (v) => encode(v, depth + 1);
        if (value instanceof Date)
            nodes[id] = ["date", Number.isNaN(value.getTime()) ? "invalid" : value.toISOString()];
        else if (value instanceof Blob) {
            const file = typeof File !== "undefined" && value instanceof File ? value : null;
            nodes[id] = ["blob", base64(new Uint8Array(await value.arrayBuffer())), value.type, file?.name ?? null, file?.lastModified ?? null];
        }
        else if (value instanceof ArrayBuffer)
            nodes[id] = ["buffer", base64(new Uint8Array(value))];
        else if (ArrayBuffer.isView(value)) {
            const name = value.constructor.name;
            if (!Object.hasOwn(viewTypes, name))
                bad();
            nodes[id] = ["view", name, await next(value.buffer), value.byteOffset, value instanceof DataView ? value.byteLength : value.byteLength / value.constructor.BYTES_PER_ELEMENT];
        }
        else if (value instanceof Map) {
            const pairs = [];
            for (const [k, v] of value)
                pairs.push([await next(k), await next(v)]);
            nodes[id] = ["map", pairs];
        }
        else if (value instanceof Set) {
            const values = [];
            for (const v of value)
                values.push(await next(v));
            nodes[id] = ["set", values];
        }
        else if (value instanceof RegExp)
            nodes[id] = ["regexp", value.source, value.flags, value.lastIndex];
        else if (Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null) {
            if (Array.isArray(value) && value.length > 1000000)
                bad();
            const pairs = [];
            for (const [k, v] of Object.entries(value))
                pairs.push([k, await next(v)]);
            nodes[id] = [Array.isArray(value) ? "array" : "object", pairs, Array.isArray(value) ? value.length : null];
        }
        else
            bad();
        return ["ref", id];
    };
    return { root: await encode(input), nodes };
}
function decodePortableGraph(graph) {
    if (!graph || typeof graph !== "object")
        bad();
    const g = graph;
    if (!Array.isArray(g.nodes) || g.nodes.length > 200001)
        bad();
    const cached = new Map();
    const decode = (token, depth = 0) => {
        if (depth > 512 || !Array.isArray(token))
            bad();
        const [tag, v] = token;
        if (tag === "null")
            return null;
        if (tag === "undefined")
            return undefined;
        if (tag === "string" && typeof v === "string" || tag === "boolean" && typeof v === "boolean")
            return v;
        if (tag === "number") {
            if (typeof v === "number" && Number.isFinite(v))
                return v;
            if (v === "-0")
                return -0;
            if (v === "NaN")
                return NaN;
            if (v === "Infinity")
                return Infinity;
            if (v === "-Infinity")
                return -Infinity;
            bad();
        }
        if (tag === "bigint" && typeof v === "string" && /^-?\d+$/.test(v))
            return BigInt(v);
        if (tag !== "ref" || !Number.isInteger(v) || v < 0 || v >= g.nodes.length)
            bad();
        if (cached.has(v))
            return cached.get(v);
        const node = g.nodes[v];
        if (!Array.isArray(node))
            bad();
        const [kind, data] = node;
        let out;
        if (kind === "date" && typeof data === "string")
            out = new Date(data === "invalid" ? NaN : data);
        else if (kind === "buffer" && typeof data === "string")
            out = unbase64(data).buffer;
        else if (kind === "blob" && typeof data === "string" && typeof node[2] === "string") {
            const bytes = unbase64(data);
            out = typeof node[3] === "string" && typeof node[4] === "number" ? new File([bytes], node[3], { type: node[2], lastModified: node[4] }) : new Blob([bytes], { type: node[2] });
        }
        else if (kind === "view" && typeof data === "string" && Object.hasOwn(viewTypes, data)) {
            const buffer = decode(node[2], depth + 1);
            if (!(buffer instanceof ArrayBuffer) || !Number.isInteger(node[3]) || !Number.isInteger(node[4]))
                bad();
            out = new viewTypes[data](buffer, node[3], node[4]);
        }
        else if (kind === "regexp" && typeof data === "string" && typeof node[2] === "string") {
            const r = new RegExp(data, node[2]);
            if (typeof node[3] !== "number")
                bad();
            r.lastIndex = node[3];
            out = r;
        }
        else if (kind === "object" || kind === "array" || kind === "map" || kind === "set") {
            if (!Array.isArray(data))
                bad();
            if (kind === "array" && (!Number.isInteger(node[2]) || Number(node[2]) < 0 || Number(node[2]) > 1000000))
                bad();
            out = kind === "map" ? new Map() : kind === "set" ? new Set() : kind === "array" ? new Array(Number(node[2])) : {};
            cached.set(v, out);
            for (const pair of data) {
                if (kind === "set") {
                    out.add(decode(pair, depth + 1));
                    continue;
                }
                if (!Array.isArray(pair) || pair.length !== 2)
                    bad();
                if (kind === "map") {
                    out.set(decode(pair[0], depth + 1), decode(pair[1], depth + 1));
                    continue;
                }
                if (typeof pair[0] !== "string" || pair[0] === "length" && kind === "array")
                    bad();
                if (kind === "array" && /^(0|[1-9][0-9]*)$/.test(pair[0]) && Number(pair[0]) >= Number(node[2]))
                    bad();
                Object.defineProperty(out, pair[0], { value: decode(pair[1], depth + 1), enumerable: true, writable: true, configurable: true });
            }
        }
        else
            bad();
        cached.set(v, out);
        return out;
    };
    return decode(g.root);
}
async function createPortableArchive(entries, sourceOrigin) {
    if (entries.length > 10000 || !/^https?:\/\//.test(sourceOrigin))
        bad();
    const encoded = [];
    for (const e of entries)
        encoded.push({ storage: e.storage, key: await encodePortableGraph(e.key), value: await encodePortableGraph(e.value) });
    const body = { format: FORMAT, version: 1, createdAt: new Date().toISOString(), sourceOrigin, entries: encoded };
    const text = JSON.stringify(body);
    if (new TextEncoder().encode(text).length > MAX_BYTES)
        throw Error("Backup acima de 128 MB. Exporte em lotes; os originais foram preservados.");
    return JSON.stringify({ ...body, sha256: await sha(text) });
}
async function readPortableArchive(text) {
    if (new TextEncoder().encode(text).length > MAX_BYTES)
        bad();
    const parsed = JSON.parse(text);
    if (!parsed || parsed.format !== FORMAT || parsed.version !== 1 || typeof parsed.createdAt !== "string" || typeof parsed.sourceOrigin !== "string" || !/^https?:\/\//.test(parsed.sourceOrigin) || !Array.isArray(parsed.entries) || parsed.entries.length > 10000)
        bad();
    const body = { format: parsed.format, version: parsed.version, createdAt: parsed.createdAt, sourceOrigin: parsed.sourceOrigin, entries: parsed.entries };
    if (await sha(JSON.stringify(body)) !== parsed.sha256)
        throw Error("A integridade do backup não confere. Nenhum projeto foi alterado.");
    const entries = [];
    for (const e of parsed.entries) {
        if (!e || !["indexeddb", "localStorage"].includes(e.storage))
            bad();
        entries.push({ storage: e.storage, key: decodePortableGraph(e.key), value: decodePortableGraph(e.value) });
    }
    return { id: parsed.sha256, sourceOrigin: parsed.sourceOrigin, createdAt: parsed.createdAt, entries };
}


if(!confirm('Este arquivo contém os projetos deste navegador. Confirme que pertencem a você e guarde o arquivo em local seguro. Nenhum dado será enviado pela rede.'))return;
const entries=[];const known=(await indexedDB.databases()).find(d=>d.name==='pagenova-projects');
if(known){
 const db=await new Promise((resolve,reject)=>{let blocked=false;const r=indexedDB.open(known.name,known.version);r.onupgradeneeded=()=>r.transaction.abort();r.onsuccess=()=>{if(blocked)r.result.close();else resolve(r.result);};r.onerror=()=>reject(r.error);r.onblocked=()=>{blocked=true;reject(Error('Banco ocupado. Originais preservados; feche outras abas e tente novamente.'));};});
 try{if(db.objectStoreNames.contains('projects')){
  const records=await new Promise((resolve,reject)=>{const rows=[];const tx=db.transaction('projects','readonly');const r=tx.objectStore('projects').openCursor();r.onsuccess=()=>{const c=r.result;if(c){rows.push({storage:'indexeddb',key:c.key,value:c.value});c.continue();}};tx.oncomplete=()=>resolve(rows);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});entries.push(...records);
 }}finally{db.close();}
}
for(const key of Object.keys(localStorage).filter(k=>k.startsWith('pagenova-builder-v2-private-v1')))entries.push({storage:'localStorage',key,value:localStorage.getItem(key)});
if(!entries.length)throw Error('Nenhum projeto encontrado nesta origem e neste perfil. Não limpe o navegador; confira o domínio original.');
const text=await createPortableArchive(entries,location.origin);const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='pagenova-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
console.info(entries.length+' registros exportados com verificação SHA-256. Originais preservados. Isso não comprova sincronização na nuvem.');

})().catch(error=>console.error('Exportação interrompida; originais preservados.',error));
