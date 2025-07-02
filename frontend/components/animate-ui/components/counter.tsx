'use client';

import * as React from 'react';
import {motion, type HTMLMotionProps, type Transition} from 'motion/react';

import {
  SlidingNumber,
  type SlidingNumberProps,
} from '@/components/animate-ui/text/sliding-number';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';

type CounterProps = HTMLMotionProps<'div'> & {
  number: number;
  setNumber: (number: number) => void;
  slidingNumberProps?: Omit<SlidingNumberProps, 'number'>;
  buttonProps?: Omit<React.ComponentProps<typeof Button>, 'onClick'>;
  transition?: Transition;
  min?: number;
  max?: number;
  step?: number;
  longPressDelay?: number;
  longPressSpeed?: number;
};

function Counter({
  number,
  setNumber,
  className,
  slidingNumberProps,
  buttonProps,
  transition = {type: 'spring', bounce: 0, stiffness: 300, damping: 30},
  min = -Infinity,
  max = Infinity,
  step = 1,
  longPressDelay = 500,
  longPressSpeed = 100,
  ...props
}: CounterProps) {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const isLongPressingRef = React.useRef(false);
  const speedMultiplierRef = React.useRef(1);
  const numberRef = React.useRef(number);

  React.useEffect(() => {
    numberRef.current = number;
  }, [number]);

  const clamp = (value: number) => Math.max(min, Math.min(max, value));

  const handleIncrement = () => {
    const currentStep = Math.min(step * speedMultiplierRef.current, step * 5);
    const newValue = clamp(numberRef.current + currentStep);
    setNumber(newValue);
  };

  const handleDecrement = () => {
    const currentStep = Math.min(step * speedMultiplierRef.current, step * 5);
    const newValue = clamp(numberRef.current - currentStep);
    setNumber(newValue);
  };

  const startLongPress = (callback: () => void) => {
    isLongPressingRef.current = false;
    speedMultiplierRef.current = 1;

    callback();

    timeoutRef.current = setTimeout(() => {
      isLongPressingRef.current = true;
      speedMultiplierRef.current = 1;

      intervalRef.current = setInterval(() => {
        callback();
        if (speedMultiplierRef.current < 3) {
          speedMultiplierRef.current += 0.3;
        } else if (speedMultiplierRef.current < 5) {
          speedMultiplierRef.current += 0.2;
        }
      }, longPressSpeed);
    }, longPressDelay);
  };

  const stopLongPress = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    speedMultiplierRef.current = 1;
    isLongPressingRef.current = false;
  };

  React.useEffect(() => {
    return () => {
      stopLongPress();
    };
  }, []);

  const handleButtonClick = (callback: () => void) => {
    if (!isLongPressingRef.current) {
      callback();
    }
  };

  return (
    <motion.div
      data-slot="counter"
      layout
      transition={transition}
      className={cn(
          'flex items-center gap-x-2 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800',
          className,
      )}
      {...props}
    >
      <motion.div whileHover={{scale: 1.05}} whileTap={{scale: 0.95}}>
        <Button
          size="icon"
          {...buttonProps}
          onClick={() => handleButtonClick(handleDecrement)}
          onMouseDown={() => startLongPress(handleDecrement)}
          onMouseUp={stopLongPress}
          onMouseLeave={stopLongPress}
          onTouchStart={() => startLongPress(handleDecrement)}
          onTouchEnd={stopLongPress}
          className={cn(
              'bg-white dark:bg-neutral-950 hover:bg-white/70 dark:hover:bg-neutral-950/70 text-neutral-950 dark:text-white text-2xl font-light pb-[3px] select-none',
              buttonProps?.className,
          )}
        >
          -
        </Button>
      </motion.div>

      <SlidingNumber
        number={number}
        {...slidingNumberProps}
        className={cn('text-lg', slidingNumberProps?.className)}
      />

      <motion.div whileHover={{scale: 1.05}} whileTap={{scale: 0.95}}>
        <Button
          size="icon"
          {...buttonProps}
          onClick={() => handleButtonClick(handleIncrement)}
          onMouseDown={() => startLongPress(handleIncrement)}
          onMouseUp={stopLongPress}
          onMouseLeave={stopLongPress}
          onTouchStart={() => startLongPress(handleIncrement)}
          onTouchEnd={stopLongPress}
          className={cn(
              'bg-white dark:bg-neutral-950 hover:bg-white/70 dark:hover:bg-neutral-950/70 text-neutral-950 dark:text-white text-2xl font-light pb-[3px] select-none',
              buttonProps?.className,
          )}
        >
          +
        </Button>
      </motion.div>
    </motion.div>
  );
}

export {Counter, type CounterProps};
