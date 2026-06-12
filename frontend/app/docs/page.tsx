import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Docs' };

export default function DocsOverview() {
  return (
    <div className="space-y-8 leading-relaxed">
      <header className="space-y-2">
        <h1 className="text-3xl font-medium">PayLance docs</h1>
        <p className="text-txt-dim">
          How the platform works, end to end. Jump to Terms and Privacy for the legal basics.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">What PayLance does</h2>
        <p className="text-txt-dim">
          PayLance is a freelance and creator marketplace where every order is settled in USDC on
          the Arc network. The hirer sets the price, the freelancer reviews it in a private chat,
          the hirer can adjust the price if needed, both sides hit Agree, and the full payment
          locks into an on-chain escrow contract until the work is done.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Who it is for</h2>
        <p className="text-txt-dim">
          Freelancers, creators, and the clients and brands who hire them. PayLance covers six
          categories: Design, Writing and Content, Digital Marketing, Video Editing, AI Services,
          and Influencer and Creator Hiring.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">The order lifecycle</h2>
        <ol className="space-y-2 text-txt-dim list-decimal pl-5">
          <li><span className="text-white">Offer sent.</span> The hirer opens an order at the price they want to pay and adds an optional message.</li>
          <li><span className="text-white">Negotiating.</span> Both sides clarify scope and timeline in the order chat. Only the hirer can change the price. Each adjustment resets the freelancer's acceptance.</li>
          <li><span className="text-white">Accepted.</span> The freelancer hits Agree at the current price. The order is now ready to fund.</li>
          <li><span className="text-white">Funded.</span> The hirer locks the agreed USDC amount in a per order escrow contract on Arc.</li>
          <li><span className="text-white">In progress.</span> The freelancer does the work.</li>
          <li><span className="text-white">Delivered.</span> The freelancer submits the delivery in chat.</li>
          <li><span className="text-white">Reviewing.</span> The client reviews the delivery.</li>
          <li><span className="text-white">Completed.</span> Both parties mark the order satisfied. Funds release to the freelancer, minus the platform fee.</li>
        </ol>
        <p className="text-txt-dim">
          Cancellations require both parties to agree. Disputes are handled by Support Care, who
          can split the escrowed amount between the two sides.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Sign in</h2>
        <p className="text-txt-dim">
          PayLance uses Sign In With Ethereum (SIWE). There is no email and no password. You
          connect your wallet, sign a one time message, and receive a session token that expires
          after two hours. Changing accounts in your wallet drops the token and prompts you to
          sign again.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">On chain</h2>
        <p className="text-txt-dim">Two Solidity contracts power PayLance.</p>
        <ul className="space-y-2 text-txt-dim list-disc pl-5">
          <li>
            <code className="text-purple-light">EscrowFactory</code> deploys one escrow per order
            and tracks them by order id. UUPS upgradeable. Two step ownable. Pausable.
          </li>
          <li>
            <code className="text-purple-light">FreelanceEscrow</code> holds the USDC for a single
            order until release, refund, or Support Care resolution. Beacon proxy, so every escrow
            upgrades together when the beacon is upgraded.
          </li>
        </ul>
        <p className="text-txt-dim">
          Both contracts live in the <code className="text-purple-light">contracts/</code> directory of the repo.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Fees</h2>
        <p className="text-txt-dim">
          A flat 2% fee on every successful release. There is no listing fee, no withdrawal fee,
          and no platform balance. Disputes settle at the same 2%, deducted on chain.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Where to go from here</h2>
        <ul className="space-y-2 text-txt-dim list-disc pl-5">
          <li><a href="/docs/terms" className="text-purple-light hover:underline">Terms</a> and <a href="/docs/privacy" className="text-purple-light hover:underline">Privacy</a>: legal basics.</li>
          <li><a href="/explore" className="text-purple-light hover:underline">Browse</a> to see live listings or <a href="/hire" className="text-purple-light hover:underline">Hire</a> to post a job.</li>
        </ul>
      </section>
    </div>
  );
}
