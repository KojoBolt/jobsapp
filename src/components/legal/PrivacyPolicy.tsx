const PrivacyPolicy = () => (
  <>
    <section>
      <h2 className="text-base font-semibold text-foreground">1. Information We Collect</h2>
      <p>We collect information that you provide directly to us, including:</p>
      <ul className="ml-4 mt-2 list-disc space-y-1.5">
        <li>Personal identifiers (name, email address, phone number)</li>
        <li>Professional information (resume, LinkedIn profile, work history)</li>
        <li>Preference data (target roles, industry, tone of voice settings)</li>
        <li>Payment information (processed securely via Stripe; we do not store card details)</li>
      </ul>
    </section>

    <section>
      <h2 className="text-base font-semibold text-foreground">2. AI Data Processing & Usage</h2>
      <p>Your data is processed by AI systems under the following safeguards:</p>
      <ul className="ml-4 mt-2 list-disc space-y-1.5">
        <li><strong className="text-foreground">Purpose Limitation:</strong> Data is used exclusively for generating and optimizing job applications.</li>
        <li><strong className="text-foreground">No Model Training:</strong> Your personal data is never used to train AI models.</li>
        <li><strong className="text-foreground">Encryption:</strong> All data is encrypted in transit (TLS 1.3) and at rest (AES-256).</li>
        <li><strong className="text-foreground">Access Controls:</strong> Strict role-based access ensures only authorized personnel can view your data.</li>
        <li><strong className="text-foreground">Third-Party Models:</strong> When third-party AI is used, data is processed under data processing agreements that prohibit retention.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-base font-semibold text-foreground">3. Human-in-the-Loop Audit</h2>
      <p>
        Our human review process involves trained career specialists who may access your application
        materials to ensure quality. All reviewers:
      </p>
      <ul className="ml-4 mt-2 list-disc space-y-1.5">
        <li>Are bound by confidentiality agreements and undergo background checks.</li>
        <li>Access data only through secure, audited environments.</li>
        <li>Cannot download, copy, or export your personal data.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-base font-semibold text-foreground">4. Data Retention</h2>
      <ul className="ml-4 mt-2 list-disc space-y-1.5">
        <li>Active account data is retained for the duration of your subscription plus 90 days.</li>
        <li>Application records are retained for 12 months post-submission.</li>
        <li>Deleted accounts have all personal data purged within 30 days.</li>
        <li>AI processing logs are anonymized within 7 days.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-base font-semibold text-foreground">5. Your Rights</h2>
      <p>You have the right to:</p>
      <ul className="ml-4 mt-2 list-disc space-y-1.5">
        <li>Access all personal data we hold about you.</li>
        <li>Request correction of inaccurate information.</li>
        <li>Request deletion of your data at any time.</li>
        <li>Export your data in a portable format.</li>
        <li>Opt out of AI processing (applications will be human-only at reduced volume).</li>
      </ul>
    </section>

    <section>
      <h2 className="text-base font-semibold text-foreground">6. Data Sharing</h2>
      <p>
        We do not sell your personal data. We share data only with:
      </p>
      <ul className="ml-4 mt-2 list-disc space-y-1.5">
        <li>Employers, as part of job application submissions (at your direction).</li>
        <li>Service providers (infrastructure, payment processing) under strict DPAs.</li>
        <li>Legal authorities, when required by law.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-base font-semibold text-foreground">7. Contact</h2>
      <p>
        For privacy inquiries or data requests, contact our Data Protection Officer at{" "}
        <span className="text-primary">privacy@jobapp.com</span>.
      </p>
    </section>

    <p className="mt-4 text-xs text-muted-foreground/70">
      Last updated: February 7, 2026 · Version 2.1 · GDPR & CCPA Compliant
    </p>
  </>
);

export default PrivacyPolicy;
