const TermsOfService = () => (
  <>
    <section>
      <h2 className="text-base font-semibold text-foreground">1. Acceptance of Terms</h2>
      <p>
        By accessing or using JobApp ("the Service"), you agree to be bound by these Terms of Service.
        If you do not agree, you may not use the Service. These terms constitute a legally binding
        agreement between you and JobApp, Inc.
      </p>
    </section>

    <section>
      <h2 className="text-base font-semibold text-foreground">2. Service Description</h2>
      <p>
        JobApp provides automated job application services enhanced by AI processing and human review.
        We submit applications on your behalf using the information and materials you provide through
        our Identity Vault system.
      </p>
    </section>

    <section>
      <h2 className="text-base font-semibold text-foreground">3. AI Data Processing</h2>
      <p>
        JobApp utilizes artificial intelligence to optimize your application materials. By using the Service, you acknowledge and consent to the following:
      </p>
      <ul className="ml-4 mt-2 list-disc space-y-1.5">
        <li>Your resume, cover letter, and profile data will be processed by AI models to generate tailored application content.</li>
        <li>AI-generated content is reviewed by human editors before submission (the "Human-in-the-Loop Audit").</li>
        <li>AI processing occurs on secure, SOC 2-compliant infrastructure with end-to-end encryption.</li>
        <li>No AI model is trained on your personal data. Your information is used solely for application generation.</li>
        <li>You retain full ownership of all original content you provide to the Service.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-base font-semibold text-foreground">4. Human-in-the-Loop Audit</h2>
      <p>
        Every application submitted through JobApp undergoes a mandatory human review process:
      </p>
      <ul className="ml-4 mt-2 list-disc space-y-1.5">
        <li>Trained career specialists review AI-generated content for accuracy, tone, and personalization.</li>
        <li>Reviewers may modify content to better align with company culture and role requirements.</li>
        <li>All reviewers are bound by strict NDAs and undergo background verification.</li>
        <li>Human Touch Notes are generated for each application documenting specific personalizations made.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-base font-semibold text-foreground">5. User Data Retention Policy</h2>
      <p>
        We take data retention seriously and adhere to the following schedule:
      </p>
      <ul className="ml-4 mt-2 list-disc space-y-1.5">
        <li><strong className="text-foreground">Active Account Data:</strong> Retained for the duration of your active subscription plus 90 days.</li>
        <li><strong className="text-foreground">Application Records:</strong> Stored for 12 months after submission for your reference and analytics.</li>
        <li><strong className="text-foreground">Resume & Personal Documents:</strong> Encrypted at rest and deleted within 30 days of account closure.</li>
        <li><strong className="text-foreground">AI Processing Logs:</strong> Anonymized and aggregated within 7 days. No personally identifiable information is retained.</li>
        <li><strong className="text-foreground">Right to Deletion:</strong> You may request complete data deletion at any time via the Support Hub.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-base font-semibold text-foreground">6. Payment & Refund Policy</h2>
      <p>
        All payments are processed securely. Refunds and satisfaction claims are governed by our
        dedicated <a href="/refund-policy" className="underline text-primary hover:text-primary/80">Refund & Satisfaction Policy</a>,
        which includes our Human-Touch Quality Guarantee. Please review the full policy for eligibility
        details, timelines, and how to submit a quality review request.
      </p>
    </section>

    <section>
      <h2 className="text-base font-semibold text-foreground">7. Limitation of Liability</h2>
      <p>
        JobApp does not guarantee interview invitations or job offers. The Service is designed to maximize
        your application quality and volume. Outcomes depend on market conditions, employer preferences,
        and other factors beyond our control.
      </p>
    </section>

    <p className="mt-4 text-xs text-muted-foreground/70">
      Last updated: February 7, 2026 · Version 2.1
    </p>
  </>
);

export default TermsOfService;
