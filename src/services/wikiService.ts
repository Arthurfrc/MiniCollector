import { WikiCarData } from '../types/Car';

export interface WikiSearchResult {
    title: string;
    snippet: string;
    pageId: number;
}

const WIKI_BASE = 'https://hotwheels.fandom.com/api.php';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CarVersion {
    year?: string;
    series?: string;
    cardSeriesNumber?: string;   // Col #
    cardSeriesName?: string;     // Series name
    color?: string;
    baseColor?: string;
    baseType?: string;
    toyNumber?: string;          // Toy # = baseCode
    country?: string;
    photoFileName?: string;
    photoUrl?: string;
    // label legível para exibir na lista
    label: string;
}

// ─── Busca de sugestões ───────────────────────────────────────────────────────

export async function searchWiki(query: string): Promise<WikiSearchResult[]> {
    const params = new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: query,
        srlimit: '8',
        format: 'json',
        origin: '*',
    });

    const res = await fetch(`${WIKI_BASE}?${params}`);
    const data = await res.json();

    return (data.query?.search ?? []).map((item: any) => ({
        title: item.title,
        snippet: item.snippet.replace(/<[^>]+>/g, ''),
        pageId: item.pageid,
    }));
}

// ─── Detalhes de uma página (dados gerais) ────────────────────────────────────

export async function getCarFromWiki(pageTitle: string): Promise<WikiCarData | null> {
    const params = new URLSearchParams({
        action: 'parse',
        page: pageTitle,
        prop: 'wikitext|images',
        format: 'json',
        origin: '*',
    });

    try {
        const res = await fetch(`${WIKI_BASE}?${params}`);
        const data = await res.json();
        if (data.error) return null;
        const wikitext: string = data.parse?.wikitext?.['*'] ?? '';
        return parseWikitext(wikitext, pageTitle, data.parse?.images ?? []);
    } catch {
        return null;
    }
}

// ─── Versões da tabela ────────────────────────────────────────────────────────

export async function getCarVersions(pageTitle: string): Promise<CarVersion[]> {
    const params = new URLSearchParams({
        action: 'parse',
        page: pageTitle,
        prop: 'wikitext',
        format: 'json',
        origin: '*',
    });

    try {
        const res = await fetch(`${WIKI_BASE}?${params}`);
        const data = await res.json();
        if (data.error) return [];
        const wikitext: string = data.parse?.wikitext?.['*'] ?? '';
        const versions = parseVersionsTable(wikitext);

        // Resolve URLs das fotos em paralelo (máximo 10 de uma vez)
        const batch = versions.slice(0, 10);
        await Promise.all(
            batch.map(async (v) => {
                if (v.photoFileName) {
                    v.photoUrl = await resolveFileUrl(v.photoFileName);
                }
            })
        );

        return versions;
    } catch {
        return [];
    }
}

// ─── Thumbnail da página ──────────────────────────────────────────────────────

export async function getPageThumbnail(pageTitle: string): Promise<string | null> {
    const params = new URLSearchParams({
        action: 'query',
        titles: pageTitle,
        prop: 'pageimages',
        pithumbsize: '300',
        format: 'json',
        origin: '*',
    });

    try {
        const res = await fetch(`${WIKI_BASE}?${params}`);
        const data = await res.json();
        const pages = data.query?.pages ?? {};
        const page = Object.values(pages)[0] as any;
        return page?.thumbnail?.source ?? null;
    } catch {
        return null;
    }
}

// Extrai nome da página da URL
export function extractPageTitleFromUrl(url: string): string | null {
    const match = url.match(/\/wiki\/([^?#]+)/);
    if (!match) return null;

    // Decodifica URL e remove underscores
    return decodeURIComponent(match[1]).replace(/_/g, ' ');
}

// Busca direta pela URL
export async function getCarFromWikiUrl(url: string): Promise<WikiCarData | null> {
    const pageTitle = extractPageTitleFromUrl(url);
    if (!pageTitle) return null;

    return getCarFromWiki(pageTitle);
}

// ─── Resolve URL real de um arquivo da wiki ───────────────────────────────────

async function resolveFileUrl(fileName: string): Promise<string | undefined> {
    const params = new URLSearchParams({
        action: 'query',
        titles: `File:${fileName}`,
        prop: 'imageinfo',
        iiprop: 'url',
        iiurlwidth: '300',
        format: 'json',
        origin: '*',
    });

    try {
        const res = await fetch(`${WIKI_BASE}?${params}`);
        const data = await res.json();
        const pages = data.query?.pages ?? {};
        const page = Object.values(pages)[0] as any;
        return page?.imageinfo?.[0]?.thumburl ?? page?.imageinfo?.[0]?.url ?? undefined;
    } catch {
        return undefined;
    }
}

// ─── Parser do wikitable de versões ──────────────────────────────────────────

function parseVersionsTable(wikitext: string): CarVersion[] {
    // Encontra o bloco do wikitable principal
    const tableMatch = wikitext.match(/\{\|[^\n]*wikitable[\s\S]*?\|\}/);
    if (!tableMatch) return [];

    const table = tableMatch[0];
    const rows = table.split(/\n\s*\|-/).slice(1); // divide por linhas separadoras

    if (rows.length < 2) return [];

    // Linha de headers (células com !)
    const headerRow = rows[0];
    const headers = headerRow
        .split(/!!|\n!/)
        .map(h => h.replace(/^!/, '').replace(/\[\[[^\]]*\]\]/g, '').trim().toLowerCase());

    const colIndex = (names: string[]): number =>
        headers.findIndex(h => names.some(n => h.includes(n)));

    const idxYear = colIndex(['year']);
    const idxSeries = colIndex(['series']);
    const idxColNum = colIndex(['col #', 'col#', 'collection']);
    const idxColor = colIndex(['color']);
    const idxBase = colIndex(['base color']);
    const idxToy = colIndex(['toy #', 'toy#']);
    const idxCountry = colIndex(['country']);
    const idxPhoto = colIndex(['photo']);

    const versions: CarVersion[] = [];

    for (const row of rows.slice(1)) {
        if (!row.trim()) continue;

        // Células separadas por || ou por \n|
        const rawCells = row.split(/\|\||\n\|(?!\|)/).map(c =>
            c.replace(/^\|/, '').trim()
        );

        const cell = (idx: number): string | undefined => {
            if (idx < 0 || idx >= rawCells.length) return undefined;
            return cleanCell(rawCells[idx]);
        };

        const photoRaw = idxPhoto >= 0 ? rawCells[idxPhoto] ?? '' : '';
        const photoFileName = extractFileName(photoRaw);

        const year = cell(idxYear);
        const series = cell(idxSeries);
        const colNum = cell(idxColNum);
        const color = cell(idxColor);
        const baseColor = cell(idxBase);

        // Monta label legível: "2025 - Factory Fresh 5/5 - Rosso Corsa"
        const parts = [year, series, color].filter(Boolean);
        const label = parts.length > 0 ? parts.join(' · ') : 'Versão desconhecida';
        const seriesClean = series?.replace(/\d+\/\d+$/, '').trim();
        const seriesNum = series?.match(/(\d+\/\d+)$/)?.[1];

        versions.push({
            year,
            cardSeriesNumber: seriesNum,
            cardSeriesName: seriesClean,
            color,
            baseColor,
            toyNumber: cell(idxToy),
            country: cell(idxCountry),
            photoFileName,
            label,
        });
    }

    return versions.filter(v => v.year || v.series || v.color);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanCell(raw: string): string | undefined {
    return raw
        .replace(/\[\[File:[^\]]*\]\]/gi, '')     // remove imagens
        .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, '$2') // [[Link|Texto]] → Texto
        .replace(/<[^>]+>/g, '')                   // remove HTML
        .replace(/\{\{[^}]*\}\}/g, '')             // remove templates {{}}
        .replace(/[']{2,3}/g, '')                  // remove '' e '''
        .trim() || undefined;
}

function extractFileName(raw: string): string | undefined {
    const match = raw.match(/\[\[File:([^\]|]+)/i);
    return match ? match[1].trim() : undefined;
}

// ─── Parser geral de wikitext (usado em getCarFromWiki) ───────────────────────

function parseWikitext(wikitext: string, title: string, images: string[]): WikiCarData {
    const get = (field: string): string | undefined => {
        const regex = new RegExp(`\\|\\s*${field}\\s*=\\s*([^|\\n{}]+)`, 'i');
        const match = wikitext.match(regex);
        if (!match) return undefined;
        return match[1]
            .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1')
            .replace(/<[^>]+>/g, '')
            .trim() || undefined;
    };

    const yearRaw = get('Year') ?? get('year');
    const year = yearRaw ? parseInt(yearRaw, 10) : undefined;

    const firstImage = images[0]
        ? `https://hotwheels.fandom.com/wiki/Special:FilePath/${encodeURIComponent(images[0])}`
        : undefined;

    return {
        name: title,
        brand: get('Brand') ?? get('brand'),
        year: isNaN(year!) ? undefined : year,
        baseColor: get('Base Color') ?? get('Color') ?? get('base color'),
        serie: get('Series') ?? get('series'),
        baseCode: get('Base Code') ?? get('Toy #') ?? get('ToyNumber'),
        cardSeriesNumber: get('Series #') ?? get('SeriesNumber'),
        cardCollectionNumber: get('Col #') ?? get('CollectionNumber'),
        cardSeriesName: get('Series') ?? get('series'),
        country: get('Country') ?? get('country'),
        pageUrl: `https://hotwheels.fandom.com/wiki/${encodeURIComponent(title)}`,
        thumbnailUrl: firstImage,
    };
}