import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PaymentClient } from './PaymentClient';
import { SlugSearchPageProps } from '@/lib/types';

export default async function PaymentPage({ params, searchParams }: SlugSearchPageProps) {
  const { slug } = await params;
  const { id: paymentId, cpf } = await searchParams;

  if (!paymentId || typeof paymentId !== 'string') {
    notFound();
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) notFound();

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, tenantId: tenant.id },
    select: {
      id: true,
      status: true,
      amount: true,
      ticketCount: true,
      qrCode: true,
      qrCodeBase64: true,
      boxesGranted: true,
    },
  });

  if (!payment) notFound();

  return (
    <PaymentClient
      slug={slug}
      paymentId={payment.id}
      initialStatus={payment.status}
      amount={Number(payment.amount)}
      ticketCount={payment.ticketCount}
      qrCode={payment.qrCode ?? ''}
      qrCodeBase64={payment.qrCodeBase64 ?? ''}
      clientCpf={typeof cpf === 'string' ? cpf : ''}
    />
  );
}

