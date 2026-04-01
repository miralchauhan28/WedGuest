import { useCallback, useEffect, useRef, useState } from "react";

const FADE_MS = 400;
const AUTO_DISMISS_MS = 3000;

export function Alert({ variant = "success", children, onDismiss }) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const onDismissRef = useRef(onDismiss);
  const timersRef = useRef({});

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const removeFromDom = useCallback(() => {
    setVisible(false);
    onDismissRef.current?.();
  }, []);

  const startFadeThenRemove = useCallback(() => {
    setFading(true);
    timersRef.current.afterFade = setTimeout(removeFromDom, FADE_MS);
  }, [removeFromDom]);

  const handleClose = useCallback(() => {
    clearTimeout(timersRef.current.autoFade);
    clearTimeout(timersRef.current.afterFade);
    startFadeThenRemove();
  }, [startFadeThenRemove]);

  useEffect(() => {
    timersRef.current.autoFade = setTimeout(startFadeThenRemove, AUTO_DISMISS_MS);
    return () => {
      clearTimeout(timersRef.current.autoFade);
      clearTimeout(timersRef.current.afterFade);
    };
  }, [startFadeThenRemove]);

  if (!visible) return null;

  return (
    <div
      className={`alert alert--${variant} ${fading ? "alert--fade" : ""}`}
      role="alert"
    >
      <div className="alert__body">{children}</div>
      <button
        type="button"
        className="alert__close"
        aria-label="Dismiss"
        onClick={handleClose}
      >
        ×
      </button>
    </div>
  );
}
