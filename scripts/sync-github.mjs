import fs from 'node:fs/promises';

const response = await fetch('https://github.com/users/jvalvim-bit/contributions', {
  headers: { 'User-Agent': 'Victor-Portfolio-Sync' },
});

if (!response.ok) throw new Error(`GitHub respondeu ${response.status}`);

const html = await response.text();
const heading = html.match(/<h2[^>]*id="js-contribution-activity-description"[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || '';
const publicTotal = Number((heading.replace(/<[^>]+>/g, '').match(/[\d,.]+/)?.[0] || '0').replace(/[,.]/g, ''));
const total = 2238;
const tips = new Map(
  [...html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)]
    .map(([, id, label]) => [id, label.trim()]),
);
const days = [...html.matchAll(/<td[^>]*class="ContributionCalendar-day"[^>]*>/g)]
  .map(([tag]) => {
    const id = tag.match(/id="([^"]+)"/)?.[1] || '';
    const label = tips.get(id) || '';
    const match = label.match(/^(\d+) contributions?/i);
    return {
      date: tag.match(/data-date="([^"]+)"/)?.[1] || '',
      level: Number(tag.match(/data-level="([0-4])"/)?.[1] || 0),
      count: match ? Number(match[1]) : 0,
      label,
    };
  })
  .filter((day) => day.date)
  .sort((a, b) => a.date.localeCompare(b.date));

if (days.length < 350) throw new Error(`Calendário incompleto: ${days.length} dias`);

const output = `window.GITHUB_ACTIVITY=${JSON.stringify({
  total,
  publicTotal,
  updatedAt: new Date().toISOString(),
  days,
})};\n`;

await fs.writeFile(new URL('../github-data.js', import.meta.url), output, 'utf8');
console.log(`${total} contribuições totais · ${publicTotal} públicas · ${days.length} dias`);
