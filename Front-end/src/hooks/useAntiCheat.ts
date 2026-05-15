import { useCallback, useEffect, useRef } from 'react';

export interface AntiCheatHandlers {
  onViolation: (reason: 'blur' | 'hidden' | 'visibility') => void;
  enabled: boolean;
}

/**
 * Анти-чит для тестів: blur/hidden, блок контекстного меню, копіювання/вставки.
 * PrintScreen у браузері повністю заблокувати неможливо — перехоплюємо типову клавішу.
 */
export function useAntiCheat({ onViolation, enabled }: AntiCheatHandlers) {
  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;

  const trigger = useCallback((reason: 'blur' | 'hidden' | 'visibility') => {
    if (!enabled) return;
    onViolationRef.current(reason);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') trigger('visibility');
    };
    const onBlur = () => trigger('blur');

    const onKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a')) {
        e.preventDefault();
      }
      if (e.key === 'PrintScreen') e.preventDefault();
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('contextmenu', onContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('contextmenu', onContextMenu);
    };
  }, [enabled, trigger]);
}
