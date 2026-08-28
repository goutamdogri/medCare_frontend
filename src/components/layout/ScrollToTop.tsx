import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Restores the window scroll position to the top whenever the route changes.
 * Without this, switching pages keeps the previous page's scroll offset.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
