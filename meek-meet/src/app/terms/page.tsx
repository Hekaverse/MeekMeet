import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Meek Meet",
  description: "Terms and conditions for using the Meek Meet platform.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen pt-28 pb-20 bg-cream">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <h1 className="font-serif text-4xl text-charcoal mb-8">Terms of Service</h1>
        <p className="text-charcoal-muted mb-8">Last updated: 16 June 2026</p>

        <div className="prose prose-lg prose-stone max-w-none">
          <p>
            These Terms of Service (“Terms”) govern your access to and use of the Meek Meet
            platform, including our website and mobile applications. By using Meek Meet, you
            agree to these Terms.
          </p>

          <h2>1. About Meek Meet</h2>
          <p>
            Meek Meet is a community listening and civic intelligence platform. We provide
            tools for individuals and groups to gather, reflect, and share anonymised,
            aggregated community insights with decision-makers.
          </p>

          <h2>2. Eligibility</h2>
          <p>
            You must be at least 13 years old to use Meek Meet. Shepherd applicants must be
            adults in their jurisdiction and must complete our verification process.
          </p>

          <h2>3. Account Responsibilities</h2>
          <ul>
            <li>Keep your account credentials secure.</li>
            <li>Provide accurate information.</li>
            <li>Do not impersonate others or create multiple accounts to manipulate results.</li>
          </ul>

          <h2>4. Community Conduct</h2>
          <p>
            Meek Meet is built on respect, safety, and honesty. You agree not to use the
            platform to:
          </p>
          <ul>
            <li>Harass, bully, or discriminate against others.</li>
            <li>Share illegal, hateful, violent, or sexually explicit content.</li>
            <li>Attempt to de-anonymise other users or circumvent privacy protections.</li>
            <li>Spread misinformation or manipulate community insights.</li>
          </ul>

          <h2>5. Shepherd Verification</h2>
          <p>
            Shepherds are trusted community leaders. By applying, you consent to verification
            of your identity and safeguarding credentials. Providing false information will
            result in permanent disqualification.
          </p>

          <h2>6. Content and Data</h2>
          <p>
            You retain ownership of content you submit. By submitting responses, you grant
            Meek Meet a licence to store, aggregate, and anonymise that content for the
            purpose of generating community insights and reports.
          </p>

          <h2>7. Reports and Authority Submissions</h2>
          <p>
            Community reports are generated from anonymised, aggregated data. Shepherds are
            responsible for ensuring reports are accurate and submitted in good faith. Meek
            Meet does not guarantee any response from authorities.
          </p>

          <h2>8. Termination</h2>
          <p>
            We may suspend or terminate accounts that violate these Terms or pose a risk to
            community safety. You may delete your account at any time.
          </p>

          <h2>9. Disclaimers</h2>
          <p>
            Meek Meet is provided “as is” without warranties of any kind. We are not liable
            for disputes between users, decisions made by authorities, or indirect damages
            arising from platform use.
          </p>

          <h2>10. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of Meek Meet after
            changes constitutes acceptance of the updated Terms.
          </p>

          <h2>11. Governing Law</h2>
          <p>
            These Terms are governed by the laws of Australia. Any disputes will be resolved
            in the courts of New South Wales.
          </p>

          <h2>12. Contact</h2>
          <p>
            For questions about these Terms, contact us at{" "}
            <a href="mailto:legal@meekmeet.com" className="text-terracotta hover:underline">
              legal@meekmeet.com
            </a>.
          </p>
        </div>
      </div>
    </main>
  );
}
