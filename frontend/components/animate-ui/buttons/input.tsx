'use client';

import * as React from 'react';
import {
  AnimatePresence,
  HTMLMotionProps,
  motion,
  Transition,
} from 'motion/react';
import {ArrowRight} from 'lucide-react';
import {cn} from '@/lib/utils';

type InputButtonContextType = {
  showInput: boolean;
  setShowInput: React.Dispatch<React.SetStateAction<boolean>>;
  transition: Transition;
  id: string;
};
const InputButtonContext = React.createContext<
  InputButtonContextType | undefined
>(undefined);

const useInputButton = (): InputButtonContextType => {
  const context = React.useContext(InputButtonContext);
  if (!context) {
    throw new Error('useInputButton must be used within a InputButton');
  }
  return context;
};

type InputButtonProviderProps = React.ComponentProps<'div'> &
  Partial<InputButtonContextType>;

function InputButtonProvider({
  className,
  transition = {type: 'spring', stiffness: 300, damping: 20},
  showInput,
  setShowInput,
  id,
  ...props
}: InputButtonProviderProps) {
  const localId = React.useId();
  const [localShowInput, setLocalShowInput] = React.useState(false);

  return (
    <InputButtonContext.Provider
      value={{
        showInput: showInput ?? localShowInput,
        setShowInput: setShowInput ?? setLocalShowInput,
        transition,
        id: id ?? localId,
      }}
    >
      <div
        data-slot="input-button-provider"
        className={cn(
            'relative w-fit flex items-center justify-center h-10',
            (showInput || localShowInput) && 'w-full max-w-[400px]',
            className,
        )}
        {...props}
      />
    </InputButtonContext.Provider>
  );
}

type InputButtonProps = HTMLMotionProps<'div'>;

function InputButton({className, ...props}: InputButtonProps) {
  return (
    <motion.div
      data-slot="input-button"
      className={cn('flex size-full', className)}
      {...props}
    />
  );
}

type InputButtonActionProps = HTMLMotionProps<'button'>;

function InputButtonAction({className, ...props}: InputButtonActionProps) {
  const {transition, setShowInput, id} = useInputButton();

  return (
    <motion.button
      data-slot="input-button-action"
      className={cn(
          'bg-background text-sm whitespace-nowrap disabled:pointer-events-none disabled:opacity-50 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive rounded-full border text-background-foreground cursor-pointer pl-4 pr-12 size-full font-medium',
          className,
      )}
      layoutId={`input-button-action-${id}`}
      transition={transition}
      onClick={() => setShowInput((prev) => !prev)}
      {...props}
    />
  );
}

type InputButtonSubmitProps = HTMLMotionProps<'button'> & {
  icon?: React.ElementType;
};

function InputButtonSubmit({
  className,
  children,
  icon: Icon = ArrowRight,
  ...props
}: InputButtonSubmitProps) {
  const {transition, showInput, setShowInput, id} = useInputButton();

  return (
    <motion.button
      data-slot="input-button-submit"
      layoutId={`input-button-submit-${id}`}
      transition={transition}
      className={cn(
          'z-[1] [&_svg:not([class*=\'size-\'])]:size-4 cursor-pointer disabled:pointer-events-none  disabled:opacity-50 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap bg-primary hover:bg-primary/90 transition-colors text-primary-foreground rounded-full text-sm flex items-center justify-center font-medium absolute inset-y-1 right-1',
        showInput ? 'px-4' : 'aspect-square',
        className,
      )}
      onClick={() => setShowInput((prev) => !prev)}
      {...props}
    >
      {showInput ? (
        <motion.span
          key="show-button"
          initial={{opacity: 0, scale: 0}}
          animate={{opacity: 1, scale: 1}}
          transition={{duration: 0.2}}
        >
          {children}
        </motion.span>
      ) : (
        <motion.span
          key="show-icon"
          initial={{opacity: 0, scale: 0}}
          animate={{opacity: 1, scale: 1}}
          transition={{duration: 0.2}}
        >
          <Icon className="size-4" />
        </motion.span>
      )}
    </motion.button>
  );
}

type InputButtonInputProps = React.ComponentProps<'input'>;

function InputButtonInput({className, ...props}: InputButtonInputProps) {
  const {transition, showInput, id} = useInputButton();

  return (
    <AnimatePresence>
      {showInput && (
        <div className="absolute inset-0 size-full flex items-center justify-center">
          <motion.div
            layoutId={`input-button-input-${id}`}
            className="size-full flex items-center bg-background rounded-full relative"
            transition={transition}
          >
            <input
              data-slot="input-button-input"
              className={cn(
                  'size-full selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground inset-0 pl-4 focus-visible:border-ring border focus-visible:ring-ring/50 focus-visible:ring-[3px] pr-32 py-2 text-sm bg-background rounded-full focus:outline-none absolute shrink-0 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive disabled:pointer-events-none disabled:cursor-not-allowed',
                  className,
              )}
              {...props}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export {
  InputButton,
  InputButtonProvider,
  InputButtonAction,
  InputButtonSubmit,
  InputButtonInput,
  useInputButton,
  type InputButtonProps,
  type InputButtonProviderProps,
  type InputButtonActionProps,
  type InputButtonSubmitProps,
  type InputButtonInputProps,
};
