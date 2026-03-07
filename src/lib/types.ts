// ==========================================
// PAGE PROPS — centralizados para evitar
// redefinição em cada página
// ==========================================

export type SlugPageProps = {
  params: Promise<{ slug: string }>;
};

export type SlugIdPageProps = {
  params: Promise<{ slug: string; id: string }>;
};

export type SlugSearchPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// ==========================================
// MYSTERY BOX — tipos do JSON armazenado
// ==========================================

export type MysteryBoxRule = {
  minTickets: number;
  boxes: number;
};

export type MysteryBoxConfig = {
  rules: MysteryBoxRule[];
  winProbability: number; // ex: 0.1 = 10% de chance por abertura
};

// ==========================================
// TIPOS AUXILIARES PARA O FRONTEND
// ==========================================

export type ClientFormData = {
  name: string;
  cpf: string;
  phone: string;
  email: string;
};

export type PaymentApiResponse = {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  amount: number;
};

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'CANCELLED' | 'REFUNDED';

export type PaymentStatusResponse = {
  status: PaymentStatus;
  boxesGranted: number;
  clientCpf?: string;
};

export type MysteryBoxOpenResponse = {
  won: boolean;
  prize?: {
    id: string;
    name: string;
    description: string | null;
  };
  boxesOpened: number;
  boxesTotal: number;
};