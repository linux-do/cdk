import * as React from 'react';

import {cn} from '@/lib/utils';

function Input({className, type, ...props}: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
          'file:text-foreground placeholder:text-muted-foreground placeholder:text-xs selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-xl border border-transparent bg-muted/55 px-3 py-1 text-base shadow-none transition-[background-color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 read-only:bg-muted/40 dark:bg-white/[0.04] dark:read-only:bg-white/[0.03] md:text-sm',
          'hover:bg-muted/70 dark:hover:bg-white/[0.06] focus-visible:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/15 dark:focus-visible:bg-white/[0.06]',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/30 aria-invalid:bg-destructive/5',
          className,
      )}
      {...props}
    />
  );
}

export {Input};
