/**
 * Note: Use position fixed according to your needs
 * Desktop navbar is better positioned at the bottom
 * Mobile navbar is better positioned at bottom right.
 **/

import {cn} from '@/lib/utils';
import {IconLayoutNavbarCollapse} from '@tabler/icons-react';
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';

import {useRef, useState, memo, useCallback} from 'react';

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
  mobileButtonClassName,
}: {
  items: {
    title: string;
    icon: React.ReactNode;
    href?: string;
    onClick?: () => void;
    tooltip?: string;
    customComponent?: React.ReactNode;
    external?: boolean;
  }[];
  desktopClassName?: string;
  mobileClassName?: string;
  mobileButtonClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile
        items={items}
        className={mobileClassName}
        buttonClassName={mobileButtonClassName}
      />
    </>
  );
};

const FloatingDockMobile = memo(
    ({
      items,
      className,
      buttonClassName,
    }: {
    items: {
      title: string;
      icon: React.ReactNode;
      href?: string;
      onClick?: () => void;
      tooltip?: string;
      customComponent?: React.ReactNode;
      external?: boolean;
    }[];
    className?: string;
    buttonClassName?: string;
  }) => {
      const [open, setOpen] = useState(false);

      const toggleOpen = useCallback(() => {
        setOpen((prev) => !prev);
      }, []);

      return (
        <div className={cn('relative block md:hidden', className)}>
          <AnimatePresence>
            {open && (
              <motion.div
                layoutId="nav"
                className="absolute inset-x-0 bottom-full mb-2 flex flex-col gap-1"
              >
                {items.map((item, idx) => {
                  if (item.title === 'divider') {
                    return null; // Mobile版本不显示分隔符
                  }
                  return (
                    <motion.div
                      key={item.title}
                      initial={{opacity: 0, y: 10}}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: 10,
                        transition: {
                          delay: idx * 0.05,
                        },
                      }}
                      transition={{delay: (items.length - 1 - idx) * 0.05}}
                    >
                      {item.customComponent ? (
                        <div
                          key={item.title}
                          className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-900',
                              buttonClassName,
                          )}
                        >
                          {item.customComponent}
                        </div>
                      ) : item.href ? (
                      <a
                        href={item.href}
                        key={item.title}
                        className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-900',
                            buttonClassName,
                        )}
                        {...((item.external || item.href.startsWith('https://')) ?
                          {target: '_blank', rel: 'noopener noreferrer'} :
                          {})}
                      >
                        <div className="flex items-center justify-center">
                          {item.icon}
                        </div>
                      </a>
                    ) : (
                      <button
                        onClick={item.onClick}
                        key={item.title}
                        className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-900',
                            buttonClassName,
                        )}
                      >
                        <div className="flex items-center justify-center">
                          {item.icon}
                        </div>
                      </button>
                    )}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={toggleOpen}
            className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-800',
                buttonClassName,
            )}
          >
            <motion.div
              animate={{rotate: open ? 180 : 0}}
              transition={{duration: 0.3, ease: 'easeInOut'}}
            >
              <IconLayoutNavbarCollapse className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
            </motion.div>
          </button>
        </div>
      );
    },
);

FloatingDockMobile.displayName = 'FloatingDockMobile';

const FloatingDockDesktop = memo(
    ({
      items,
      className,
    }: {
    items: {
      title: string;
      icon: React.ReactNode;
      href?: string;
      onClick?: () => void;
      tooltip?: string;
      customComponent?: React.ReactNode;
      external?: boolean;
    }[];
    className?: string;
  }) => {
      const mouseX = useMotionValue(Infinity);

      const handleMouseMove = useCallback(
          (e: React.MouseEvent) => {
            mouseX.set(e.pageX);
          },
          [mouseX],
      );

      const handleMouseLeave = useCallback(() => {
        mouseX.set(Infinity);
      }, [mouseX]);

      return (
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={cn(
              'mx-auto hidden items-end gap-2 rounded-xl bg-gray-50 px-2 pb-2 md:flex dark:bg-neutral-900',
              className,
          )}
        >
          {(() => {
            const firstRow = items.slice(0, 3);
            const dividerIndex = items.findIndex((item) => item.title === 'divider');
            const secondRow = dividerIndex !== -1 ? items.slice(dividerIndex + 1) : [];

            return (
              <>
                <div className="flex items-end gap-2">
                  {firstRow.map((item) => (
                    <IconContainer mouseX={mouseX} key={item.title} {...item} />
                  ))}
                </div>
                {dividerIndex !== -1 && (
                  <div className="flex items-center justify-center px-1 mx-1 self-stretch mt-3">
                    <div className="w-px h-full bg-border"></div>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  {secondRow.map((item) => (
                    <IconContainer mouseX={mouseX} key={item.title} {...item} />
                  ))}
                </div>
              </>
            );
          })()}
        </motion.div>
      );
    },
);

FloatingDockDesktop.displayName = 'FloatingDockDesktop';

const IconContainer = memo(
    ({
      mouseX,
      title,
      icon,
      href,
      onClick,
      tooltip,
      customComponent,
      external,
    }: {
    mouseX: MotionValue;
    title: string;
    icon: React.ReactNode;
    href?: string;
    onClick?: () => void;
    tooltip?: string;
    customComponent?: React.ReactNode;
    external?: boolean;
  }) => {
      const ref = useRef<HTMLDivElement>(null);

      const distance = useTransform(mouseX, (val) => {
        const bounds = ref.current?.getBoundingClientRect() ?? {x: 0, width: 0};

        return val - bounds.x - bounds.width / 2;
      });

      const widthTransform = useTransform(distance, [-150, 0, 150], [40, 70, 40]);
      const heightTransform = useTransform(
          distance,
          [-150, 0, 150],
          [40, 70, 40],
      );

      const widthTransformIcon = useTransform(
          distance,
          [-150, 0, 150],
          [20, 35, 20],
      );
      const heightTransformIcon = useTransform(
          distance,
          [-150, 0, 150],
          [20, 35, 20],
      );

      const width = useSpring(widthTransform, {
        mass: 0.1,
        stiffness: 150,
        damping: 12,
      });
      const height = useSpring(heightTransform, {
        mass: 0.1,
        stiffness: 150,
        damping: 12,
      });

      const widthIcon = useSpring(widthTransformIcon, {
        mass: 0.1,
        stiffness: 150,
        damping: 12,
      });
      const heightIcon = useSpring(heightTransformIcon, {
        mass: 0.1,
        stiffness: 150,
        damping: 12,
      });

      const [hovered, setHovered] = useState(false);

      const handleMouseEnter = useCallback(() => {
        setHovered(true);
      }, []);

      const handleMouseLeave = useCallback(() => {
        setHovered(false);
      }, []);

      const Element = customComponent ? 'div' : href ? 'a' : 'button';
      const elementProps = customComponent ? {} : href ?
      {
        href,
        ...((external || href.startsWith('https://')) ?
            {target: '_blank', rel: 'noopener noreferrer'} :
            {}),
      } :
      {onClick};

      return (
        <Element {...elementProps}>
          <motion.div
            ref={ref}
            style={{width, height}}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative flex aspect-square items-center justify-center rounded-full bg-gray-200 cursor-pointer dark:bg-neutral-800"
          >
            <AnimatePresence>
              {hovered && (
                <motion.div
                  initial={{opacity: 0, y: 10, x: '-50%'}}
                  animate={{opacity: 1, y: 0, x: '-50%'}}
                  exit={{opacity: 0, y: 2, x: '-50%'}}
                  className="absolute -top-8 left-1/2 w-fit rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs whitespace-pre text-neutral-700 dark:border-neutral-900 dark:bg-neutral-800 dark:text-white"
                >
                  {tooltip || title}
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              style={{width: widthIcon, height: heightIcon}}
              className="flex items-center justify-center"
            >
              {customComponent || icon}
            </motion.div>
          </motion.div>
        </Element>
      );
    },
);

IconContainer.displayName = 'IconContainer';
