import Footer from '@/components/Footer';
import Header from '@/components/Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-18 bg-background">
        {children}
      </main>
      <Footer />
    </div>
  );
}
