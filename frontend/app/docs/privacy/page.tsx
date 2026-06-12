import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy' };

export default function Privacy() {
  return (
    <div className="space-y-8 leading-relaxed">
      <header className="space-y-2">
        <h1 className="text-3xl font-medium">Privacy Policy</h1>
        <p className="text-txt-dim">
          What PayLance collects, what it shares, and what you control.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">What we collect</h2>
        <p className="text-txt-dim">When you connect your wallet, PayLance stores:</p>
        <ol className="space-y-2 text-txt-dim list-decimal pl-5">
          <li>Your wallet address.</li>
          <li>Optional profile fields you set (name, bio, location, category, skills, social handles, follower counts).</li>
          <li>Orders you create or are matched into, and the messages exchanged inside those orders.</li>
          <li>On chain transaction hashes for escrow funding, release, and refund events.</li>
        </ol>
        <p className="text-txt-dim">
          We do not collect your email, your phone number, or any government identifier.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">What we share</h2>
        <p className="text-txt-dim">
          Public profile data (name, bio, category, skills, ratings, completed orders) is visible
          to anyone who visits your profile page. Order data, including the order chat, is visible
          only to the two parties of the order and to Support Care resolving a dispute on that
          specific order.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Cookies and local storage</h2>
        <p className="text-txt-dim">
          PayLance uses only the local storage needed to keep you signed in (your session token,
          which expires after two hours) and to remember the wallet address you last connected.
          There are no third party tracking cookies.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Your rights</h2>
        <p className="text-txt-dim">
          You can edit or remove any profile field at any time from Settings. You can stop
          signing in at any time. To request full account deletion, email hello@paylance.dev from
          a wallet you can prove ownership of.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Retention</h2>
        <p className="text-txt-dim">
          Active accounts and their orders are retained while you continue to use PayLance.
          Completed orders are retained for at least seven years to support dispute history and
          tax records, then archived.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Contact</h2>
        <p className="text-txt-dim">Privacy questions: hello@paylance.dev</p>
      </section>

      <p className="text-xs text-txt-mute pt-4">Last updated: 2026-05-22</p>
    </div>
  );
}
