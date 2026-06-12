import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms' };

export default function Terms() {
  return (
    <div className="space-y-8 leading-relaxed">
      <header className="space-y-2">
        <h1 className="text-3xl font-medium">Terms of Service</h1>
        <p className="text-txt-dim">
          These terms govern your use of PayLance. By connecting your wallet and signing the
          login message, you agree to them.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Acceptable use</h2>
        <p className="text-txt-dim">You agree not to use PayLance to:</p>
        <ol className="space-y-2 text-txt-dim list-decimal pl-5">
          <li>Offer or solicit work that is illegal in your jurisdiction or your counterparty&apos;s.</li>
          <li>Impersonate another person, brand, or wallet.</li>
          <li>Manipulate ratings, reviews, or matching by colluding with another account.</li>
          <li>Circumvent the escrow flow, including agreeing to pay off platform after a match.</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Fees</h2>
        <p className="text-txt-dim">
          PayLance charges a flat 2% fee on every successful release. The fee is deducted on
          chain by the escrow contract at the moment of release. There are no other platform
          fees.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Funds</h2>
        <p className="text-txt-dim">
          USDC sent to an escrow contract is held by that contract, not by PayLance. PayLance
          cannot move, freeze, or claw back escrowed funds outside of the contract&apos;s
          defined release, refund, and dispute paths.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Disputes</h2>
        <p className="text-txt-dim">
          When parties cannot agree, Support Care reviews the order chat and any delivered
          work and proposes a split. The split is executed on chain via{' '}
          <code className="text-purple-light">resolveDispute</code>. The sum of the split equals
          the escrowed amount minus the 2% fee.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Termination</h2>
        <p className="text-txt-dim">
          You can stop using PayLance at any time. Active orders continue to follow the on chain
          flow until they settle.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Liability</h2>
        <p className="text-txt-dim">
          PayLance is provided as is, without warranty. To the extent allowed by law, PayLance is
          not liable for any indirect or consequential loss arising from your use of the
          platform, including loss of funds caused by user error, smart contract bugs, or
          network outages.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Changes</h2>
        <p className="text-txt-dim">
          These terms may change. Material changes will be announced on the platform.
        </p>
      </section>

      <p className="text-xs text-txt-mute pt-4">Last updated: 2026-05-22</p>
    </div>
  );
}
