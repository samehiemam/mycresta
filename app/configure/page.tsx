import type { Metadata } from "next";
import { Configurator } from "../components/Configurator";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Configure your Kumbra | Cresta Marine",
  description:
    "Choose your Kumbra model, hull colour, engines, upholstery and equipment, then save the configuration for a tailored quote.",
};

export default function ConfigurePage() {
  return (
    <>
      <SiteHeader inverse solid />
      <Configurator />
    </>
  );
}
