import {getChangelogFiles} from '@/components/common/docs/changelog';
import {ChangelogClient} from '@/components/common/docs/ChangelogClient';

export default function Changelog() {
  const versionLogs = getChangelogFiles();

  return <ChangelogClient versionLogs={versionLogs} />;
}
