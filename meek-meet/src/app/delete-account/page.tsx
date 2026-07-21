import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delete Your Account — Meek Meet",
  description: "Request deletion of your Meek Meet account and personal data.",
};

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen pt-28 pb-20 bg-cream">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <h1 className="font-serif text-4xl text-charcoal mb-8">Delete Your Account</h1>
        <p className="text-charcoal-muted mb-8">Last updated: 16 June 2026</p>

        <div className="prose prose-lg prose-stone max-w-none">
          <p>
            You can request that we delete your Meek Meet account and the personal data
            associated with it. To start the process, send an email from the address
            registered to your account.
          </p>

          <h2>How to request account deletion</h2>
          <ol>
            <li>
              Email us at{" "}
              <a href="mailto:privacy@meekmeet.com" className="text-terracotta hover:underline">
                privacy@meekmeet.com
              </a>{" "}
              from the email address linked to your Meek Meet account.
            </li>
            <li>
              Use the subject line: <strong>Account Deletion Request</strong>.
            </li>
            <li>
              Include your registered email address and, if you know it, the name of any
              circles you lead or joined.
            </li>
            <li>
              We will confirm receipt within 48 hours and complete the deletion within 30
              days, unless we are required by law to keep certain information.
            </li>
          </ol>

          <h2>What data is deleted</h2>
          <ul>
            <li>Your profile (name, email, avatar, preferences).</li>
            <li>Your individual responses and comments in circles.</li>
            <li>Your RSVPs, bookmarks, and meeting attendance records.</li>
            <li>Your shepherd application and verification documents, if any.</li>
          </ul>

          <h2>What data may be kept</h2>
          <ul>
            <li>
              <strong>Anonymised, aggregated insights</strong> that cannot be linked back to
              you. These are used for community reports and the public Voice dashboard.
            </li>
            <li>
              Information we are legally required to retain (for example, records related to
              safety or compliance).
            </li>
          </ul>

          <h2>Request deletion of specific data without deleting your account</h2>
          <p>
            If you want some data removed but wish to keep your account, email us at{" "}
            <a href="mailto:privacy@meekmeet.com" className="text-terracotta hover:underline">
              privacy@meekmeet.com
            </a>{" "}
            and let us know what you would like deleted. We will process your request within
            30 days.
          </p>

          <h2>Questions?</h2>
          <p>
            Contact us at{" "}
            <a href="mailto:privacy@meekmeet.com" className="text-terracotta hover:underline">
              privacy@meekmeet.com
            </a>{" "}
            and we will be happy to help.
          </p>
        </div>
      </div>
    </main>
  );
}
