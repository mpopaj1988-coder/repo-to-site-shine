import { Header } from "./Header";
import { Footer } from "./Footer";
import { EmailCaptureModal } from "./EmailCaptureModal";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <EmailCaptureModal />
    </div>
  );
}