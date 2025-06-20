import {GradientText} from '@/components/animate-ui/text/gradient';
import {HighlightText} from '@/components/animate-ui/text/highlight';

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <GradientText className="text-6xl font-bold" text="敬请期待" />
        <HighlightText className="text-lg" text="该功能正在开发中" />
      </div>
    </div>
  );
};
