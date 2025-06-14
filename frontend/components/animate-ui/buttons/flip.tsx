'use client';

import * as React from 'react';
import {
  type HTMLMotionProps,
  type Transition,
  type Variant,
  motion,
} from 'motion/react';

import {cn} from '@/lib/utils';

type FlipDirection = 'top' | 'bottom' | 'left' | 'right';

type FlipButtonProps = HTMLMotionProps<'button'> & {
  frontText?: string;
  backText?: string;
  frontContent?: React.ReactNode;
  backContent?: React.ReactNode;
  transition?: Transition;
  frontClassName?: string;
  backClassName?: string;
  from?: FlipDirection;
};

const DEFAULT_SPAN_CLASS_NAME =
  'absolute inset-0 flex items-center justify-center rounded-lg';

function FlipButton({
  frontText,
  backText,
  frontContent,
  backContent,
  transition = {type: 'spring', stiffness: 280, damping: 20},
  className,
  frontClassName,
  backClassName,
  from = 'top',
  ...props
}: FlipButtonProps) {
  const isVertical = from === 'top' || from === 'bottom';
  const rotateAxis = isVertical ? 'rotateX' : 'rotateY';

  const frontOffset = from === 'top' || from === 'left' ? '50%' : '-50%';
  const backOffset = from === 'top' || from === 'left' ? '-50%' : '50%';

  const buildVariant = (
      opacity: number,
      rotation: number,
      offset: string | null = null,
  ): Variant => ({
    opacity,
    [rotateAxis]: rotation,
    ...(isVertical && offset !== null ? {y: offset} : {}),
    ...(!isVertical && offset !== null ? {x: offset} : {}),
  });

  const frontVariants = {
    initial: buildVariant(1, 0, '0%'),
    hover: buildVariant(0, 90, frontOffset),
  };

  const backVariants = {
    initial: buildVariant(0, 90, backOffset),
    hover: buildVariant(1, 0, '0%'),
  };

  const frontDisplay = frontContent || frontText;
  const backDisplay = backContent || backText;
  const invisibleText = frontText || (typeof frontContent === 'string' ? frontContent : 'Content');

  return (
    <motion.button
      data-slot="flip-button"
      initial="initial"
      whileHover="hover"
      whileTap={{scale: 0.95}}
      className={cn(
          'relative inline-block h-10 px-4 py-2 text-sm font-medium cursor-pointer perspective-[1000px] focus:outline-none',
          className,
      )}
      {...props}
    >
      <motion.span
        data-slot="flip-button-front"
        variants={frontVariants}
        transition={transition}
        className={cn(
            DEFAULT_SPAN_CLASS_NAME,
            'bg-muted text-black dark:text-white',
            frontClassName,
        )}
      >
        {frontDisplay}
      </motion.span>
      <motion.span
        data-slot="flip-button-back"
        variants={backVariants}
        transition={transition}
        className={cn(
            DEFAULT_SPAN_CLASS_NAME,
            'bg-primary text-primary-foreground',
            backClassName,
        )}
      >
        {backDisplay}
      </motion.span>
      <span className="invisible">{invisibleText}</span>
    </motion.button>
  );
}

export {FlipButton, type FlipButtonProps, type FlipDirection};
