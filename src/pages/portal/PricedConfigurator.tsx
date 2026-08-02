import { useState } from "react";
import { Configurator } from "../../../app/components/Configurator";
import { useAuth } from "../../lib/auth";
import { useTitle } from "../../lib/useTitle";

/**
 * The public configurator with the price list showing.
 *
 * Shipping and handling is held for the session only: this build has not been
 * saved against a customer yet, so there is nothing to attach it to. Once it
 * is shared or a client's own build is opened, the figure is stored.
 */
export function PricedConfigurator() {
  useTitle("Configurator | My Cresta");
  const { user } = useAuth();
  const [shipping, setShipping] = useState<number | null>(null);

  return (
    <Configurator
      prices
      shippingMinor={shipping}
      canEditShipping={user?.role === "admin"}
      onShippingChange={(minor) => setShipping(minor)}
    />
  );
}
