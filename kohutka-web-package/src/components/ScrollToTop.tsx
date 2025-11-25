import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Component that scrolls window to top on every navigation
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
