'use client';

import * as React from 'react';
import {ToggleGroup as ToggleGroupPrimitive} from 'radix-ui';
import {
  type HTMLMotionProps,
  type Transition,
  motion,
  AnimatePresence,
} from 'motion/react';
import {cva, type VariantProps} from 'class-variance-authority';

import {cn} from '@/lib/utils';

const toggleVariants = cva(
    'cursor-pointer inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium hover:text-muted-foreground text-accent-foreground transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none focus:outline-none aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap',
    {
      variants: {
        type: {
          single: '',
          multiple: 'data-[state=on]:bg-accent',
        },
        variant: {
          default: 'bg-transparent',
          outline: 'border border-input bg-transparent shadow-xs',
        },
        size: {
          default: 'h-9 px-2 min-w-9',
          sm: 'h-8 px-1.5 min-w-8',
          lg: 'h-10 px-2.5 min-w-10',
        },
      },
      defaultVariants: {
        variant: 'default',
        size: 'default',
      },
    },
);

type ToggleGroupContextProps = VariantProps<typeof toggleVariants> & {
  type?: 'single' | 'multiple';
  transition?: Transition;
  activeClassName?: string;
  globalId: string;
};

const ToggleGroupContext = React.createContext<
  ToggleGroupContextProps | undefined
>(undefined);

const useToggleGroup = (): ToggleGroupContextProps => {
  const context = React.useContext(ToggleGroupContext);
  if (!context) {
    throw new Error('useToggleGroup must be used within a ToggleGroup');
  }
  return context;
};

type ToggleGroupProps = React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  Omit<VariantProps<typeof toggleVariants>, 'type'> & {
    transition?: Transition;
    activeClassName?: string;
  };

function ToggleGroup({
  className,
  variant,
  size,
  children,
  transition = {type: 'spring', bounce: 0, stiffness: 200, damping: 25},
  activeClassName,
  ...props
}: ToggleGroupProps) {
  const globalId = React.useId();

  return (
    <ToggleGroupContext.Provider
      value={{
        variant,
        size,
        type: props.type,
        transition,
        activeClassName,
        globalId,
      }}
    >
      <ToggleGroupPrimitive.Root
        data-slot="toggle-group"
        className={cn(
            'flex items-center justify-center gap-1 relative',
            className,
        )}
        {...props}
      >
        {children}
      </ToggleGroupPrimitive.Root>
    </ToggleGroupContext.Provider>
  );
}

type ToggleGroupItemProps = React.ComponentProps<
  typeof ToggleGroupPrimitive.Item
> &
  Omit<VariantProps<typeof toggleVariants>, 'type'> & {
    children?: React.ReactNode;
    buttonProps?: HTMLMotionProps<'button'>;
    spanProps?: React.ComponentProps<'span'>;
  };

function ToggleGroupItem({
  ref,
  className,
  children,
  variant,
  size,
  buttonProps,
  spanProps,
  ...props
}: ToggleGroupItemProps) {
  const {
    activeClassName,
    transition,
    type,
    variant: contextVariant,
    size: contextSize,
    globalId,
  } = useToggleGroup();
  const itemRef = React.useRef<HTMLButtonElement | null>(null);
  React.useImperativeHandle(ref, () => itemRef.current as HTMLButtonElement);
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    const node = itemRef.current;
    if (!node) return;
    const observer = new MutationObserver(() => {
      setIsActive(node.getAttribute('data-state') === 'on');
    });
    observer.observe(node, {
      attributes: true,
      attributeFilter: ['data-state'],
    });
    setIsActive(node.getAttribute('data-state') === 'on');
    return () => observer.disconnect();
  }, []);

  return (
    <ToggleGroupPrimitive.Item ref={itemRef} {...props} asChild>
      <motion.button
        data-slot="toggle-group-item"
        initial={{scale: 1}}
        whileTap={{scale: 0.9}}
        {...buttonProps}
        className={cn('relative', buttonProps?.className)}
      >
        <span
          {...spanProps}
          data-state={isActive ? 'on' : 'off'}
          className={cn(
              'relative z-[1]',
              toggleVariants({
                variant: variant || contextVariant,
                size: size || contextSize,
                type,
              }),
              className,
              spanProps?.className,
          )}
        >
          {children}
        </span>

        <AnimatePresence initial={false}>
          {isActive && type === 'single' && (
            <motion.span
              layoutId={`active-toggle-group-item-${globalId}`}
              data-slot="active-toggle-group-item"
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={transition}
              className={cn(
                  'absolute inset-0 z-0 rounded-md bg-muted',
                  activeClassName,
              )}
            />
          )}
        </AnimatePresence>
      </motion.button>
    </ToggleGroupPrimitive.Item>
  );
}

export {
  ToggleGroup,
  ToggleGroupItem,
  type ToggleGroupProps,
  type ToggleGroupItemProps,
};
