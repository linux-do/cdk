import * as React from 'react';

import {cn} from '@/lib/utils';

function Textarea({className, ...props}: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
          'placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full rounded-xl border border-transparent bg-muted/55 px-3 py-2 text-base shadow-none transition-[background-color,box-shadow] outline-none hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 read-only:bg-muted/40 dark:bg-white/[0.04] dark:hover:bg-white/[0.06] dark:focus-visible:bg-white/[0.06] dark:read-only:bg-white/[0.03] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/30 aria-invalid:bg-destructive/5 md:text-sm',
          className,
      )}
      {...props}
    />
  );
}

export {Textarea};
