import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminAccessRequests } from "../../components/AdminAccessRequests";
import { SiteHeader } from "../../components/SiteHeader";
import { chatGPTSignInPath, getChatGPTUser } from "../../chatgpt-auth";
import { isAdminEmail, listAccessUsers } from "../../../db/users";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Access approvals | Cresta Marine",
  robots: { index: false, follow: false },
};

export default async function AccessRequestsAdminPage() {
  const user = await getChatGPTUser();
  if (!user) redirect(chatGPTSignInPath("/admin/access-requests"));

  if (!isAdminEmail(user.email)) {
    return (
      <>
        <SiteHeader />
        <main className="admin-access-page">
          <span className="eyebrow">Administration</span>
          <h1>Access not authorised.</h1>
          <p>
            This account is signed in but is not on the Cresta administration
            allowlist.
          </p>
        </main>
      </>
    );
  }

  const users = await listAccessUsers();

  return (
    <>
      <SiteHeader />
      <main className="admin-access-page">
        <div className="admin-access-heading">
          <div>
            <span className="eyebrow">Administration</span>
            <h1>Account access requests.</h1>
          </div>
          <p>
            Approve or reject customer, employee and ambassador registrations.
            No account receives a role until it is approved here.
          </p>
        </div>
        <AdminAccessRequests initialUsers={users} />
      </main>
    </>
  );
}
