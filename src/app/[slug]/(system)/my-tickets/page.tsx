import { redirect } from 'next/navigation';
import { SlugSearchPageProps } from '@/lib/types';

export default async function LegacyMyTicketsPage({ params }: SlugSearchPageProps) {
  const { slug } = await params;
  redirect(`/${slug}/meus-bilhetes`);
}
