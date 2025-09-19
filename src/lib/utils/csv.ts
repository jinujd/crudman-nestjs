function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

function flattenObject(input: any, depth = 1, prefix = ''): Record<string, any> {
  if (!input || typeof input !== 'object') return { [prefix || 'value']: input }
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(input)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && depth > 0) {
      Object.assign(out, flattenObject(v, depth - 1, key))
    } else {
      out[key] = v
    }
  }
  return out
}

export function toCsvFromArray(items: any[], options?: { flattenDepth?: 1 | 2 | 0 }): string {
  const depth = options?.flattenDepth ?? 1
  const flatItems = items.map((i) => flattenObject(i, depth))
  const headersSet = new Set<string>()
  for (const it of flatItems) Object.keys(it).forEach((h) => headersSet.add(h))
  const headers = Array.from(headersSet)
  const lines: string[] = []
  lines.push(headers.map(escapeCsvValue).join(','))
  for (const it of flatItems) {
    lines.push(headers.map((h) => escapeCsvValue((it as any)[h])).join(','))
  }
  return lines.join('\n')
}

export function toCsvFromObject(obj: any, options?: { flattenDepth?: 1 | 2 | 0 }): string {
  return toCsvFromArray([obj], options)
}

export function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (!lines.length) return []
  const parseLine = (line: string): string[] => {
    const out: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++ } else { inQuotes = false }
        } else cur += ch
      } else {
        if (ch === '"') inQuotes = true
        else if (ch === ',') { out.push(cur); cur = '' }
        else cur += ch
      }
    }
    out.push(cur)
    return out
  }
  const headers = parseLine(lines[0]).map((h) => h.trim())
  const rows: Array<Record<string, string>> = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = (cols[idx] ?? '').trim() })
    rows.push(row)
  }
  return rows
}


