import { redirect } from 'next/navigation';
import { SlugSearchPageProps } from '@/lib/types';

export default async function CheckoutPage({ params, searchParams }: SlugSearchPageProps) {
  const { slug } = await params;
  const { raffle: raffleRef } = await searchParams;
  const target = raffleRef && typeof raffleRef === 'string'
    ? `/${slug}/checkout?raffle=${encodeURIComponent(raffleRef)}`
    : `/${slug}/checkout`;
  redirect(target);
}

