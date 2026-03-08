"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSession, saveSession } from '@/lib/session';

type Tenant = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  isActive: boolean;
};

type Raffle = {
  id: string;
  title: string;
  description?: string | null;
  bannerUrl?: string | null;
  price: number;
  minNumbers: number;
  totalNumbers: number;
  status: 'DRAFT' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';
  drawDate?: Date | null;
  nextTicketNumber: number;
  mysteryBoxEnabled: boolean;
  mysteryBoxConfig?: any;
  winnerId?: string | null;
};

type User = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  role?: 'USER' | 'ADMIN';
};

interface AppContextType {
  tenant: Tenant | null;
  setTenant: React.Dispatch<React.SetStateAction<Tenant | null>>;
  raffle: Raffle | null;
  setRaffle: React.Dispatch<React.SetStateAction<Raffle | null>>;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAdmin: boolean;
  setIsAdmin: React.Dispatch<React.SetStateAction<boolean>>;
  ticketCount: number;
  setTicketCount: React.Dispatch<React.SetStateAction<number>>;
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMysteryBoxModalOpen: boolean;
  setIsMysteryBoxModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  boxOpeningStatus: 'closed' | 'opening' | 'opened';
  setBoxOpeningStatus: React.Dispatch<React.SetStateAction<'closed' | 'opening' | 'opened'>>;
  boxPrize: string | null;
  setBoxPrize: React.Dispatch<React.SetStateAction<string | null>>;
  currentBoxTicket: any;
  setCurrentBoxTicket: React.Dispatch<React.SetStateAction<any>>;
  expandedTickets: string[];
  setExpandedTickets: React.Dispatch<React.SetStateAction<string[]>>;
  isNewUser: boolean | null;
  setIsNewUser: React.Dispatch<React.SetStateAction<boolean | null>>;
  formData: {
    name: string;
    email: string;
    birthDate: string;
    phone: string;
    confirmPhone: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    email: string;
    birthDate: string;
    phone: string;
    confirmPhone: string;
  }>>;
  cpf: string;
  setCpf: React.Dispatch<React.SetStateAction<string>>;
  cpfError: string;
  setCpfError: React.Dispatch<React.SetStateAction<string>>;
  loginCpf: string;
  setLoginCpf: React.Dispatch<React.SetStateAction<string>>;
  loginCpfError: string;
  setLoginCpfError: React.Dispatch<React.SetStateAction<string>>;
  loginPhone: string;
  setLoginPhone: React.Dispatch<React.SetStateAction<string>>;
  loginPhoneError: string;
  setLoginPhoneError: React.Dispatch<React.SetStateAction<string>>;
  loginUser: any;
  setLoginUser: React.Dispatch<React.SetStateAction<any>>;
  isLoginStepPhone: boolean;
  setIsLoginStepPhone: React.Dispatch<React.SetStateAction<boolean>>;
  phoneError: string;
  setPhoneError: React.Dispatch<React.SetStateAction<string>>;
  // Phone confirmation modal (compra com sessão ativa)
  isPhoneConfirmModalOpen: boolean;
  setIsPhoneConfirmModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // Persistência de sessão
  saveUserSession: (user: { id?: string; name: string; email: string; phone?: string; cpf?: string; role?: 'USER' | 'ADMIN' }) => void;
  // Checkout states
  isCheckoutModalOpen: boolean;
  setIsCheckoutModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  checkoutPaymentData: {
    paymentId: string;
    qrCode: string;
    qrCodeBase64: string;
    amount: number;
  } | null;
  setCheckoutPaymentData: React.Dispatch<React.SetStateAction<{
    paymentId: string;
    qrCode: string;
    qrCodeBase64: string;
    amount: number;
  } | null>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children, tenant, raffle }: { children: ReactNode; tenant?: Tenant; raffle?: Raffle }) {
  const [tenantState, setTenant] = useState<Tenant | null>(tenant || null);
  const [raffleState, setRaffle] = useState<Raffle | null>(raffle || null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ticketCount, setTicketCount] = useState(raffle?.minNumbers || 1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMysteryBoxModalOpen, setIsMysteryBoxModalOpen] = useState(false);
  const [boxOpeningStatus, setBoxOpeningStatus] = useState<'closed' | 'opening' | 'opened'>('closed');
  const [boxPrize, setBoxPrize] = useState<string | null>(null);
  const [currentBoxTicket, setCurrentBoxTicket] = useState<any>(null);
  const [expandedTickets, setExpandedTickets] = useState<string[]>([]);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birthDate: '',
    phone: '',
    confirmPhone: ''
  });
  const [cpf, setCpf] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [loginCpf, setLoginCpf] = useState('');
  const [loginCpfError, setLoginCpfError] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPhoneError, setLoginPhoneError] = useState('');
  const [loginUser, setLoginUser] = useState<any>(null);
  const [isLoginStepPhone, setIsLoginStepPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [isPhoneConfirmModalOpen, setIsPhoneConfirmModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // Carrega sessão do localStorage na montagem
  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session);
    }
  }, []);

  const saveUserSession = (userData: Parameters<typeof saveSession>[0]) => {
    saveSession(userData);
    setUser(userData);
  };
  const [checkoutPaymentData, setCheckoutPaymentData] = useState<{
    paymentId: string;
    qrCode: string;
    qrCodeBase64: string;
    amount: number;
  } | null>(null);

  return (
    <AppContext.Provider value={{
      tenant: tenantState, setTenant,
      raffle: raffleState, setRaffle,
      user, setUser,
      isAdmin, setIsAdmin,
      ticketCount, setTicketCount,
      isModalOpen, setIsModalOpen,
      isLoginModalOpen, setIsLoginModalOpen,
      isMysteryBoxModalOpen, setIsMysteryBoxModalOpen,
      boxOpeningStatus, setBoxOpeningStatus,
      boxPrize, setBoxPrize,
      currentBoxTicket, setCurrentBoxTicket,
      expandedTickets, setExpandedTickets,
      isNewUser, setIsNewUser,
      formData, setFormData,
      cpf, setCpf,
      cpfError, setCpfError,
      loginCpf, setLoginCpf,
      loginCpfError, setLoginCpfError,
      loginPhone, setLoginPhone,
      loginPhoneError, setLoginPhoneError,
      loginUser, setLoginUser,
      isLoginStepPhone, setIsLoginStepPhone,
      phoneError, setPhoneError,
      isPhoneConfirmModalOpen, setIsPhoneConfirmModalOpen,
      saveUserSession,
      isCheckoutModalOpen, setIsCheckoutModalOpen,
      checkoutPaymentData, setCheckoutPaymentData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
}
