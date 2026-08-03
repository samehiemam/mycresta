import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Fleet from "./pages/Fleet";
import BoatDetail from "./pages/BoatDetail";
import Services from "./pages/Services";
import YachtFinance from "./pages/YachtFinance";
import About from "./pages/About";
import Configure from "./pages/Configure";
import MyCresta from "./pages/MyCresta";
import NotFound from "./pages/NotFound";
import Login from "./pages/portal/Login";
import Register from "./pages/portal/Register";
import Verify from "./pages/portal/Verify";
import ConfirmEmail from "./pages/portal/ConfirmEmail";
import Accounts from "./pages/portal/Accounts";
import { StudioModels, StudioBuilder } from "./pages/portal/Studio";
import { Builds, BuildDetail } from "./pages/portal/Builds";
import { Users } from "./pages/portal/Users";
import { Leads } from "./pages/portal/Leads";
import SetPassword from "./pages/portal/SetPassword";
import { PricedConfigurator } from "./pages/portal/PricedConfigurator";
import { ForgotPassword, ResetPassword } from "./pages/portal/ResetPassword";
import {
  RequireAuth,
  CustomerPortal,
  TeamPortal,
  AmbassadorPortal,
} from "./pages/portal/Portal";
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
          <Route path="/yacht-finance" element={<YachtFinance />} />
          <Route path="/about" element={<About />} />
          <Route path="/configure" element={<Configure />} />
          <Route path="/my-cresta" element={<MyCresta />} />
          {/* My Cresta portal */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
        {/* Public: someone setting a first password cannot sign in yet. */}
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/portal"
          element={
            <RequireAuth roles={["customer", "employee", "ambassador", "admin"]}>
              <CustomerPortal />
            </RequireAuth>
          }
        />
        <Route
          path="/portal/team"
          element={
            <RequireAuth roles={["employee", "admin"]}>
              <TeamPortal />
            </RequireAuth>
          }
        />
        <Route
          path="/portal/accounts"
          element={
            <RequireAuth roles={["employee", "admin"]}>
              <Accounts />
            </RequireAuth>
          }
        />
        <Route
          path="/portal/ambassador"
          element={
            <RequireAuth roles={["ambassador", "admin"]}>
              <AmbassadorPortal />
            </RequireAuth>
          }
        />
        {/* The public configurator, with the price list showing. Same
            component, so it looks exactly like what a customer sees. */}
        <Route
          path="/portal/configurator"
          element={
            <RequireAuth roles={["ambassador", "employee", "admin"]}>
              <PricedConfigurator />
            </RequireAuth>
          }
        />
        <Route
          path="/portal/leads"
          element={
            <RequireAuth roles={["ambassador", "employee", "admin"]}>
              <Leads />
            </RequireAuth>
          }
        />
        <Route
          path="/portal/users"
          element={
            <RequireAuth roles={["admin"]}>
              <Users />
            </RequireAuth>
          }
        />
        <Route
          path="/portal/builds"
          element={
            <RequireAuth roles={["customer", "ambassador", "employee", "admin"]}>
              <Builds />
            </RequireAuth>
          }
        />
        <Route
          path="/portal/builds/:id"
          element={
            <RequireAuth roles={["customer", "ambassador", "employee", "admin"]}>
              <BuildDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/portal/studio"
          element={
            <RequireAuth roles={["ambassador", "employee", "admin"]}>
              <StudioModels />
            </RequireAuth>
          }
        />
        <Route
          path="/portal/studio/:id"
          element={
            <RequireAuth roles={["customer", "ambassador", "employee", "admin"]}>
              <StudioBuilder />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
}
