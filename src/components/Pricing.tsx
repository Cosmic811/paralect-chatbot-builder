import Link from 'next/link';
import { PLANS } from '@/lib/billing/plans';
export function Pricing() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {Object.entries(PLANS).map(([id, plan]) => (
        <article
          key={id}
          className={`rounded-3xl border p-8 ${id === 'pro' ? 'border-violet-400 bg-violet-50' : 'border-zinc-200 bg-white'}`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">{plan.name}</h3>
            {id === 'pro' && (
              <span className="rounded-full bg-violet-200 px-3 py-1 text-xs font-medium text-violet-900">
                Ready for your website
              </span>
            )}
          </div>
          <p className="mt-3 text-sm text-zinc-500">
            {id === 'free'
              ? 'Find the answers hiding in your docs.'
              : 'Give every visitor a helpful first answer.'}
          </p>
          <div className="mt-7">
            <span className="text-5xl font-semibold tracking-tight">${plan.price}</span>
            <span className="ml-2 text-sm text-zinc-500">/ month</span>
          </div>
          <ul className="my-8 space-y-3 text-sm text-zinc-700">
            {[
              `${plan.bots} chatbot${plan.bots > 1 ? 's' : ''}`,
              `${plan.documents} documents across your workspace`,
              `${plan.messages.toLocaleString()} messages / calendar month`,
              'TXT, PDF and DOCX knowledge',
              'Saved conversations',
              plan.embed ? 'Embeddable website widget' : 'Private playground',
            ].map((feature) => (
              <li key={feature} className="flex gap-3">
                <span className="text-violet-600">✓</span>
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href={id === 'free' ? '/signup' : '/dashboard/billing?checkout=pro'}
            className="btn w-full"
          >
            {id === 'free' ? 'Start for free' : 'Try Pro demo'}
          </Link>
          <p className="mt-3 text-center text-xs text-zinc-500">
            {id === 'free'
              ? 'No credit card required'
              : 'Demo billing. No real payment or subscription.'}
          </p>
        </article>
      ))}
    </div>
  );
}
