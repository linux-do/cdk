import fs from 'fs';
import path from 'path';

export interface VersionLog {
  version: string;
  content: string;
  dirName: string;
  coverExists: boolean;
}

function parseVersion(dirName: string): string {
  // 将目录名转换为版本号，例如 "0_0_1" -> "0.0.1" 或 "v1_2_3" -> "1.2.3"
  return dirName.replace(/^v/i, '').replace(/_/g, '.');
}

function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;

    if (aPart !== bPart) {
      return bPart - aPart; // 降序排列，最新版本在前
    }
  }

  return 0;
}

export function getChangelogFiles(): VersionLog[] {
  const changelogDir = path.join(process.cwd(), 'public', 'docs', 'changelog');

  try {
    if (!fs.existsSync(changelogDir)) {
      console.warn('Changelog 目录不存在:', changelogDir);
      return [];
    }

    const items = fs.readdirSync(changelogDir, {withFileTypes: true});
    const versionDirs = items.filter((item) => item.isDirectory());

    const versionLogs: VersionLog[] = [];

    for (const dir of versionDirs) {
      const readmePath = path.join(changelogDir, dir.name, 'README.md');
      const coverPath = path.join(changelogDir, dir.name, 'cover.png');

      if (fs.existsSync(readmePath)) {
        try {
          const content = fs.readFileSync(readmePath, 'utf-8');
          const version = parseVersion(dir.name);
          const coverExists = fs.existsSync(coverPath);

          versionLogs.push({
            version,
            content,
            dirName: dir.name,
            coverExists,
          });
        } catch (error) {
          console.error(`读取版本 ${dir.name} 的 README.md 失败:`, error);
        }
      } else {
        console.warn(`版本目录 ${dir.name} 中缺少 README.md 文件`);
      }
    }

    // 按版本号降序排序
    versionLogs.sort((a, b) => compareVersions(a.version, b.version));

    return versionLogs;
  } catch (error) {
    console.error('读取 changelog 目录时出错:', error);
    return [];
  }
}
