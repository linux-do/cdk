'use client';

import * as React from 'react';
import {Tabs as TabsPrimitive} from 'radix-ui';
import {type HTMLMotionProps, type Transition, motion} from 'motion/react';

import {cn} from '@/lib/utils';
import {
  MotionHighlight,
  MotionHighlightItem,
} from '@/components/animate-ui/effects/motion-highlight';

type TabsVariant = 'default' | 'pill' | 'fill';

type TabsContextValue = {
  variant: TabsVariant;
};

const TabsContext = React.createContext<TabsContextValue>({variant: 'default'});

type TabsProps = React.ComponentProps<typeof TabsPrimitive.Root> & {
  variant?: TabsVariant;
};

function Tabs({className, variant = 'default', ...props}: TabsProps) {
  return (
    <TabsContext.Provider value={{variant}}>
      <TabsPrimitive.Root
        data-slot="tabs"
        className={cn('flex flex-col gap-2', className)}
        {...props}
      />
    </TabsContext.Provider>
  );
}

type TabsListProps = React.ComponentProps<typeof TabsPrimitive.List> & {
  activeClassName?: string;
  transition?: Transition;
};

function TabsList({
  ref,
  children,
  className,
  activeClassName,
  transition = {
    type: 'spring',
    stiffness: 200,
    damping: 25,
  },
  ...props
}: TabsListProps) {
  const {variant} = React.useContext(TabsContext);
  const localRef = React.useRef<HTMLDivElement | null>(null);
  React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);

  const [activeValue, setActiveValue] = React.useState<string | undefined>(
      undefined,
  );

  const getActiveValue = React.useCallback(() => {
    if (!localRef.current) return;
    const activeTab = localRef.current.querySelector<HTMLElement>(
        '[data-state="active"]',
    );
    if (!activeTab) return;
    setActiveValue(activeTab.getAttribute('data-value') ?? undefined);
  }, []);

  React.useEffect(() => {
    getActiveValue();

    const observer = new MutationObserver(getActiveValue);

    if (localRef.current) {
      observer.observe(localRef.current, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    }

    return () => {
      observer.disconnect();
    };
  }, [getActiveValue]);

  return (
    <MotionHighlight
      controlledItems
      className={cn(
          variant === 'fill' ?
            'rounded-none bg-transparent shadow-none' :
          variant === 'pill' ?
            'rounded-full bg-white shadow-none dark:bg-white/[0.08]' :
            'rounded-sm bg-background shadow-sm',
          activeClassName,
      )}
      value={activeValue}
      transition={transition}
    >
      <TabsPrimitive.List
        ref={localRef}
        data-slot="tabs-list"
        className={cn(
            variant === 'fill' ?
              'inline-flex h-auto w-fit items-center justify-center gap-3 bg-transparent p-0 text-muted-foreground' :
            variant === 'pill' ?
              'inline-flex h-auto w-fit items-center justify-center gap-1 rounded-full bg-muted p-1 text-muted-foreground' :
              'bg-muted text-muted-foreground inline-flex h-10 w-fit items-center justify-center rounded-lg p-[4px]',
            className,
        )}
        {...props}
      >
        {children}
      </TabsPrimitive.List>
    </MotionHighlight>
  );
}

type TabsTriggerProps = React.ComponentProps<typeof TabsPrimitive.Trigger>;

function TabsTrigger({className, value, ...props}: TabsTriggerProps) {
  const {variant} = React.useContext(TabsContext);
  return (
    <MotionHighlightItem value={value} className="size-full">
      <TabsPrimitive.Trigger
        data-slot="tabs-trigger"
        className={cn(
            variant === 'fill' ?
              'z-[1] inline-flex size-full cursor-pointer items-center justify-center gap-1 whitespace-nowrap border-b border-transparent px-0 py-0.5 text-xs font-medium text-muted-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-foreground/25 data-[state=active]:text-foreground' :
            variant === 'pill' ?
              'z-[1] inline-flex size-full cursor-pointer items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground' :
              'z-[1] inline-flex cursor-pointer items-center size-full justify-center whitespace-nowrap rounded-sm px-2 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground',
            className,
        )}
        value={value}
        {...props}
      />
    </MotionHighlightItem>
  );
}

type TabsContentProps = React.ComponentProps<typeof TabsPrimitive.Content> &
  HTMLMotionProps<'div'> & {
    transition?: Transition;
  };

function TabsContent({
  className,
  children,
  transition = {
    duration: 0.5,
    ease: 'easeInOut',
  },
  ...props
}: TabsContentProps) {
  return (
    <TabsPrimitive.Content asChild {...props}>
      <motion.div
        data-slot="tabs-content"
        className={cn('flex-1 outline-none', className)}
        layout
        initial={{opacity: 0, y: -10}}
        animate={{opacity: 1, y: 0}}
        exit={{opacity: 0, y: 10}}
        transition={{...transition, duration: 0.1}}
        {...props}
      >
        {children}
      </motion.div>
    </TabsPrimitive.Content>
  );
}

type TabsContentsProps = HTMLMotionProps<'div'> & {
  children: React.ReactNode;
  className?: string;
  transition?: Transition;
};

function TabsContents({
  children,
  className,
  transition = {type: 'spring', stiffness: 300, damping: 30},
  ...props
}: TabsContentsProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const [height, setHeight] = React.useState(0);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const newHeight = entries?.[0]?.contentRect.height;
      if (!newHeight) return;
      requestAnimationFrame(() => {
        setHeight(newHeight);
      });
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [children]);

  React.useLayoutEffect(() => {
    if (containerRef.current) {
      const initialHeight = containerRef.current.getBoundingClientRect().height;
      setHeight(initialHeight);
    }
  }, [children]);

  return (
    <motion.div
      data-slot="tabs-contents"
      layout
      animate={{height: height}}
      transition={transition}
      className={className}
      {...props}
    >
      <div ref={containerRef}>{children}</div>
    </motion.div>
  );
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabsContents,
  type TabsProps,
  type TabsListProps,
  type TabsTriggerProps,
  type TabsContentProps,
  type TabsContentsProps,
};
