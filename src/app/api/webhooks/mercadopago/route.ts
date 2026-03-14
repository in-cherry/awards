import { MercadoPagoAdapter } from '@/infra/payments/mercado-pago-adapter';

const mercadoPagoAdapter = new MercadoPagoAdapter();

export async function POST(req: Request) {
  return mercadoPagoAdapter.processWebhook(req);
}
