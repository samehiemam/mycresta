import { SiteHeader } from "../../app/components/SiteHeader";
import { Configurator } from "../../app/components/Configurator";
import { useTitle } from "../lib/useTitle";

export default function Configure() {
  useTitle("Configure your Kumbra | Cresta Marine");
  return (
    <>
      <SiteHeader inverse solid />
      <Configurator />
    </>
  );
}
