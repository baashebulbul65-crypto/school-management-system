import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import SectionDivider from '../components/SectionDivider';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Pricing from '../components/Pricing';
import Testimonials from '../components/Testimonials';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';

function LandingPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [prefillEmail, setPrefillEmail] = useState('');
  const navigate = useNavigate();

  // Deep link WhatsApp-ka macallinka soo dhaweynta ah (Users.jsx) —
  // ?email=... si toos ah u furta LoginModal-ka staff mode-ka isagoo
  // email-ka soo buuxinaya, si macallinku uusan u qorin gacan ahaan.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setPrefillEmail(emailParam);
      setIsLoginOpen(true);
    }
  }, []);

  const handleLoginSuccess = ({ profile } = {}) => {
    // Waalid/Arday -> Parent Portal, Admin/Macallin -> Dashboard-ka Maamulka
    if (profile?.role === 'arday' || profile?.role === 'waalid') {
      navigate('/parent');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <>
      <Navbar onOpenLogin={() => setIsLoginOpen(true)} />
      <Hero onOpenLogin={() => setIsLoginOpen(true)} />
      <SectionDivider />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Footer />
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialEmail={prefillEmail}
      />
    </>
  );
}

export default LandingPage;