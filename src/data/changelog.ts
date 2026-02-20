import raw from '../../CHANGELOG.md?raw';

export interface ChangelogChange {
  type: 'feature' | 'improvement' | 'fix' | 'removed';
  description: string;
}

export interface ChangelogRelease {
  version: string;
  date: string;
  changes: ChangelogChange[];
}

function parseChangelog(md: string): ChangelogRelease[] {
  const releases: ChangelogRelease[] = [];

  for (const block of md.split(/\n(?=## \[)/)) {
    const header = block.match(/^## \[(\d+\.\d+\.\d+)\]\s*-\s*(\d{4}-\d{2}-\d{2})/);
    if (!header) continue;

    const changes: ChangelogChange[] = [];

    for (const section of block.split(/\n(?=### )/)) {
      const sectionHeader = section.match(/^### (.+)/);
      if (!sectionHeader) continue;

      const name = sectionHeader[1].trim().toLowerCase();
      const type: ChangelogChange['type'] =
        name === 'added'                    ? 'feature'     :
        name === 'fixed' || name === 'security' ? 'fix'    :
        name === 'removed'                  ? 'removed'     :
        'improvement';

      for (const bullet of section.match(/^- .+/gm) ?? []) {
        changes.push({
          type,
          description: bullet.replace(/^- /, '').replace(/\*\*(.+?)\*\*/g, '$1').trim(),
        });
      }
    }

    if (changes.length > 0) {
      releases.push({ version: header[1], date: header[2], changes });
    }
  }

  return releases;
}

export const CHANGELOG = parseChangelog(raw);
