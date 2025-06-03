'use client';

import * as React from 'react';
import {motion, type HTMLMotionProps} from 'motion/react';
import {cva, type VariantProps} from 'class-variance-authority';

import {cn} from '@/lib/utils';

const buttonVariants = cva(
    'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium cursor-pointer overflow-hidden disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive [background:_linear-gradient(var(--liquid-button-color)_0_0)_no-repeat_calc(200%-var(--liquid-button-fill,0%))_100%/200%_var(--liquid-button-fill,0.2em)] hover:[--liquid-button-fill:100%] hover:[--liquid-button-delay:0.3s] [transition:_background_0.3s_var(--liquid-button-delay,0s),_color_0.3s_var(--liquid-button-delay,0s),_background-position_0.3s_calc(0.3s_-_var(--liquid-button-delay,0s))] focus:outline-none',
    {
      variants: {
        variant: {
          default:
          'text-primary hover:text-primary-foreground !bg-muted [--liquid-button-color:var(--primary)]',
          outline:
          'border !bg-background dark:!bg-input/30 dark:border-input [--liquid-button-color:var(--primary)]',
          secondary:
          'text-secondary hover:text-secondary-foreground !bg-muted [--liquid-button-color:var(--secondary)]',
        },
        size: {
          default: 'h-10 px-4 py-2 has-[>svg]:px-3',
          sm: 'h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
          lg: 'h-12 rounded-xl px-8 has-[>svg]:px-6',
          icon: 'size-10',
        },
      },
      defaultVariants: {
        variant: 'default',
        size: 'default',
      },
    },
);

type LiquidButtonProps = HTMLMotionProps<'button'> &
  VariantProps<typeof buttonVariants>;

function LiquidButton({
  className,
  variant,
  size,
  ...props
}: LiquidButtonProps) {
  return (
    <motion.button
      whileTap={{scale: 0.95}}
      whileHover={{scale: 1.05}}
      className={cn(buttonVariants({variant, size, className}))}
      {...props}
    />
  );
}

export {LiquidButton, type LiquidButtonProps};
