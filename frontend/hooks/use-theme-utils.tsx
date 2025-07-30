import {useTheme} from 'next-themes';
import {SunIcon, MoonIcon} from 'lucide-react';
import {useCallback} from 'react';

const SystemTheme = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

const UserTheme = {
  ...SystemTheme,
  SYSTEM: 'system',
} as const;

type SystemTheme = (typeof SystemTheme)[keyof typeof SystemTheme];

type UserTheme = (typeof UserTheme)[keyof typeof UserTheme];

type ThemeSelectSpec<T> = {
  light: T;
  dark: T;
  system: T;
  default: T;
};

type SystemThemeSelectSpec<T> = {
  light: T;
  dark: T;
};

const getBaseRules = <T, >(light: T, dark: T) => ({
  light,
  dark,
});

const getSystemTheme = (): SystemTheme => {
  if (typeof window !== 'undefined') {
    return window.matchMedia(`(prefers-color-scheme: ${SystemTheme.DARK})`)
        .matches ?
      SystemTheme.DARK :
      SystemTheme.LIGHT;
  }
  return SystemTheme.LIGHT;
};

const selectSystem = <T, >(spec: SystemThemeSelectSpec<T>): T => {
  switch (getSystemTheme()) {
    case SystemTheme.LIGHT:
      return spec.light;
    case SystemTheme.DARK:
      return spec.dark;
  }
};

export function useThemeUtils() {
  const {theme, setTheme} = useTheme();

  const select = useCallback(
    <T, >(spec: ThemeSelectSpec<T>): T => {
      switch (theme) {
        case UserTheme.LIGHT:
          return spec.light;
        case UserTheme.DARK:
          return spec.dark;
        case UserTheme.SYSTEM:
          return spec.system;
        default:
          return spec.default;
      }
    },
    [theme],
  );

  const toggle = useCallback(() => {
    const baseRules = getBaseRules(UserTheme.DARK, UserTheme.LIGHT);
    const targetTheme = select({
      ...baseRules,
      system: selectSystem({
        ...baseRules,
      }),
      default: UserTheme.SYSTEM,
    });

    setTheme(targetTheme);
  }, [setTheme, select]);

  const getIcon = (className: string) => {
    const baseRules = getBaseRules(
        <MoonIcon className={className} />,
        <SunIcon className={className} />,
    );
    return select({
      ...baseRules,
      system: selectSystem({
        ...baseRules,
      }),
      default: <MoonIcon className={className} />,
    });
  };

  const getAction = () => {
    const baseRules = getBaseRules('切换深色模式', '切换浅色模式');
    return select({
      ...baseRules,
      system: selectSystem({
        ...baseRules,
      }),
      default: '切换深色模式',
    });
  };

  return {
    select,
    toggle,
    getIcon,
    getAction,
    selectSystem,
    getSystemTheme,
  };
}
