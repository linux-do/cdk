import {useTheme} from 'next-themes';
import {Button} from '@/components/ui/button';
import {SidebarTrigger} from '@/components/ui/sidebar';
import {SunIcon, MoonIcon} from 'lucide-react';

export function SiteHeader() {
  const {theme, setTheme} = useTheme();

  return (
    <>
      <div className="fixed bottom-4 ml-2 z-50">
        <div className="flex sm:flex-col items-center border border-border rounded-2xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hover:bg-accent/50 transition-colors rounded-xl border-0 shadow-none bg-transparent"
          >
            {theme === 'dark' ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
          </Button>
          <SidebarTrigger className="hover:bg-accent/50 transition-colors duration-200 rounded-xl border-0 shadow-none bg-transparent" />
        </div>
      </div>
    </>
  );
}
