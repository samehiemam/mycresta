import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Fleet from "./pages/Fleet";
import BoatDetail from "./pages/BoatDetail";
import Services from "./pages/Services";
import About from "./pages/About";
import Configure from "./pages/Configure";
import MyCresta from "./pages/MyCresta";
import NotFound from "./pages/NotFound";
import { IntroCurtain, ScrollProgress } from "./components/Chrome";
import { useRevealOnScroll } from "./lib/motion";

// Reset scroll on navigation, and honour in-page #hash targets.
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const location = useLocation();

  // Re-scan for [data-reveal] nodes whenever the route changes.
  useRevealOnScroll([location.pathname]);

  return (
    <>
      <IntroCurtain />
      <ScrollProgress />
      <ScrollToTop />
      {/* key on pathname so each page fades in on navigation */}
      <div className="cresta-page" key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/fleet/:slug" element={<BoatDetail />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/configure" element={<Configure />} />
          <Route path="/my-cresta" element={<MyCresta />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
}
