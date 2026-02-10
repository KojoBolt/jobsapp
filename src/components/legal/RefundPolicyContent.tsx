const RefundPolicyContent = () => (
  <>
    <p className="text-sm text-muted-foreground">Effective Date: February 10, 2026</p>
    <p className="mt-3">
      At JobApp, we provide a high-touch, human-in-the-loop service. Because our team begins working
      on your "Mission" immediately, we offer a Performance & Quality Guarantee.
    </p>

    <section className="mt-6">
      <h2 className="text-base font-semibold text-foreground">1. The "Human-Touch" Guarantee</h2>
      <p className="mt-2">
        If you are unhappy with the quality of your first 5 applications, we will stop your mission
        and provide a Full Refund.
      </p>
      <ul className="ml-4 mt-2 list-disc space-y-1.5">
        <li>
          <strong className="text-foreground">Condition:</strong> Flag the issue within 24 hours of
          launch and before 10 applications are deployed.
        </li>
      </ul>
    </section>

    <section className="mt-6">
      <h2 className="text-base font-semibold text-foreground">2. Refund Eligibility</h2>
      <ul className="ml-4 mt-2 list-disc space-y-1.5">
        <li>
          <strong className="text-foreground">200-App Blitz ($99):</strong> Non-refundable after 10
          applications are verified/deployed.
        </li>
        <li>
          <strong className="text-foreground">Subscriptions ($29.99/$49.99):</strong> Cancel anytime.
          No pro-rated refunds for partial months.
        </li>
        <li>
          <strong className="text-foreground">Digital Products:</strong> All sales for Info Products
          (Playbooks, Templates) are final.
        </li>
      </ul>
    </section>

    <section className="mt-6">
      <h2 className="text-base font-semibold text-foreground">3. The "Identity Vault" Exception</h2>
      <p className="mt-2">
        If we determine your Resume/LinkedIn requires a total rewrite before we can start, we will
        offer a 100% Refund or a mission pause.
      </p>
    </section>

    <section className="mt-6">
      <h2 className="text-base font-semibold text-foreground">4. How to Request a Refund</h2>
      <p className="mt-2">
        Email <strong className="text-foreground">support@jobapp.ai</strong> with "Quality Review
        Request", your Order ID, and a link to the draft that failed our standards.
      </p>
    </section>

    <section className="mt-6">
      <h2 className="text-base font-semibold text-foreground">5. Abuse Prevention</h2>
      <p className="mt-2">
        We reserve the right to refuse refunds if we detect attempts to download the full 200-app
        list or multiple requests across different accounts.
      </p>
    </section>
  </>
);

export default RefundPolicyContent;
