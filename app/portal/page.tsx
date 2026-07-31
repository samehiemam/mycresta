import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PortalDemo } from "../components/PortalDemo";
import { SiteHeader } from "../components/SiteHeader";
import { chatGPTSignInPath, getChatGPTUser } from "../chatgpt-auth";
import {
  getAccessUserByEmail,
  isAdminEmail,
  listManagedAccounts,
  type UserRole,
} from "../../db/users";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Cresta | Cresta Marine",
  description:
    "Cresta Marine account workspace for customers, owners, ambassadors and employees.",
};

export default async function PortalPage() {
  const user = await getChatGPTUser();

  if (!user) {
    redirect(chatGPTSignInPath("/portal"));
  }

  const admin = isAdminEmail(user.email);
  const accessUser = await getAccessUserByEmail(user.email);
  if (!admin && accessUser?.status !== "approved") {
    redirect("/my-cresta");
  }

  const approvedRole = (accessUser?.approvedRole ?? "employee") as UserRole;
  const accountUsers =
    admin || approvedRole === "employee" ? await listManagedAccounts() : [];

  return (
    <>
      <SiteHeader />
      <PortalDemo
        user={user}
        initialRole={approvedRole}
        canPreviewRoles={admin}
        accountUsers={accountUsers}
      />
    </>
  );
}
