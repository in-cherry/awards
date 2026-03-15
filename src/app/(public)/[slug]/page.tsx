import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Footer } from "@/components/ui/footer";
import { Header } from "@/components/ui/header";

interface TenantProps {
  params: Promise<{ slug: string }>
}

export default async function Tenant({ params }: TenantProps) {
  const { slug } = await params;

  return (
    <div>
      <Header />

      <Footer />
    </div>
  );
}