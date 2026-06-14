import { useState } from 'react';
import { Check, ChevronDown, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import PublicNavbar from "../../components/layout/PublicNavbar";


const C = {
  navyDark: "#0d1b3e",
  gold: "#f5b400",
  goldHover: "#e0a200",
};

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFAQ, setOpenFAQ] = useState(null);
  const navigate = useNavigate();

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const plans = [
    {
      name: 'Starter',
      description: 'Best for startups',
      price: isAnnual ? '$99' : '$119',
      period: '/mo',
      features: ['Access to Core Integration Suite','Basic Automation Tools','Email Support','API Documentation','Community Forum Access','10,000 transaction limit per month','Monthly Usage Reports'],
      primaryBtn: 'Start 14-Day Free Trial',
      secondaryBtn: 'Book a Demo',
      popular: false,
      bgColor: 'bg-white', textColor: 'text-gray-900', borderColor: 'border-gray-200',
      btnPrimary: 'bg-[#f59e0b] hover:bg-[#d97706] text-white',
      btnSecondary: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
    },
    {
      name: 'Business',
      description: 'Best for small and growing businesses',
      price: isAnnual ? '$299' : '$349',
      period: '/mo',
      features: ['Everything included in Starter','Advanced Automation Workflows','Dedicated Account Manager','24/7 Priority Phone & Chat Support','Advanced Analytics Dashboard','Integration Customization','Unlimited Transactions per Month'],
      primaryBtn: 'Start 14-Day Free Trial',
      secondaryBtn: 'Book a Demo',
      popular: true,
      bgColor: 'bg-[#0a1628]', textColor: 'text-white', borderColor: 'border-[#0a1628]',
      btnPrimary: 'bg-[#f59e0b] hover:bg-[#d97706] text-white',
      btnSecondary: 'border border-gray-500 text-white hover:bg-white/10'
    },
    {
      name: 'Enterprise',
      description: 'Tailored solutions for enterprise-level companies',
      price: 'Custom Pricing', period: '',
      features: ['Comprehensive Platform Access','Full-Custom Solutions','Private Cloud Infrastructure','Dedicated Consulting & Training','Security Compliance Services','Multi-User Licensing & Billing','Exclusive VIP Support'],
      primaryBtn: 'Request a Proposal',
      secondaryBtn: 'Schedule Meeting',
      popular: false,
      bgColor: 'bg-[#f59e0b]', textColor: 'text-[#0a1628]', borderColor: 'border-[#f59e0b]',
      btnPrimary: 'bg-[#0a1628] hover:bg-[#1a2639] text-white',
      btnSecondary: 'border border-[#0a1628] text-[#0a1628] hover:bg-[#0a1628]/10'
    }
  ];

  const faqs = [
    { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for annual plans.' },
    { question: 'Can I upgrade my plan later?', answer: 'Yes, you can upgrade your plan at any time. The new pricing will be prorated based on your current billing cycle.' },
    { question: 'Are there any hidden fees?', answer: 'No hidden fees. All features listed are included in the price. Enterprise plans may have custom add-ons discussed during proposal.' },
    { question: 'Is there a contract commitment?', answer: 'Monthly plans can be cancelled anytime. Annual plans have a 12-month commitment with savings up to 20%.' }
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* NAVBAR */}
      <PublicNavbar />

      {/* PRICING HEADER */}
      <section className="pt-16 pb-8 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl lg:text-5xl font-bold text-[#0a1628] mb-4">
            <span className="text-[#1e3a5f]">&#123;</span> Choose Your Plan <span className="text-[#1e3a5f]">&#125;</span>
          </h1>
          <p className="text-gray-600 text-lg mb-8">Choose from our flexible plans designed to suit your business needs.</p>
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
            <button onClick={() => setIsAnnual(true)} className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${isAnnual ? 'bg-[#0a1628] text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}>Annual</button>
            <button onClick={() => setIsAnnual(false)} className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!isAnnual ? 'bg-[#0a1628] text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}>Monthly</button>
          </div>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl p-6 lg:p-8 ${plan.bgColor} ${plan.borderColor} border-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1`}>
                {plan.popular && (
                  <div className="absolute -top-3 right-6">
                    <span className="bg-[#f59e0b] text-[#0a1628] text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className={`text-xl font-bold ${plan.textColor}`}>{plan.name}</h3>
                  <p className={`text-sm mt-1 ${plan.popular ? 'text-gray-300' : 'text-gray-500'}`}>{plan.description}</p>
                </div>
                <div className="mb-6 flex items-center gap-2">
                  <span className={`text-4xl font-bold ${plan.textColor}`}>{plan.price}</span>
                  {plan.period && <span className={`text-lg ${plan.popular ? 'text-gray-300' : 'text-gray-500'}`}>{plan.period}</span>}
                  {plan.price !== 'Custom Pricing' && <HelpCircle className="w-5 h-5 text-gray-400" />}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${plan.name === 'Enterprise' ? 'text-[#0a1628]' : 'text-[#f59e0b]'}`} />
                      <span className={`text-sm ${plan.popular ? 'text-gray-300' : 'text-gray-600'}`}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-3">
                  <button className={`w-full py-3 px-6 rounded-full font-semibold text-sm transition-all hover:scale-105 shadow-md ${plan.btnPrimary}`}>{plan.primaryBtn}</button>
                  <button className={`w-full py-3 px-6 rounded-full font-semibold text-sm transition-all hover:scale-105 ${plan.btnSecondary}`}>{plan.secondaryBtn}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#0a1628] mb-2">FAQ</h2>
          <p className="text-gray-600 mb-8">Quick Answers to Common Questions</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button onClick={() => toggleFAQ(index)} className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-semibold text-[#0a1628] pr-4">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFAQ === index ? 'rotate-180' : ''}`} />
                </button>
                {openFAQ === index && <div className="px-4 pb-4"><p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: C.navyDark, padding: "24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <span style={{ color: "rgba(255,255,255,0.3)", fontFamily: "Inter", fontSize: 13 }}>© 2024 International Export Gateway. All Rights Reserved.</span>
          <div style={{ display: "flex", gap: 20 }}>
            {["Home", "Services", "Pricing", "About Us", "Contact"].map(l => (
              <a key={l} href={l === "Home" ? "/" : `/${l.toLowerCase().replace(" ", "-")}`} style={{ color: "rgba(255,255,255,0.3)", fontFamily: "Inter", fontSize: 12, textDecoration: "none" }}
                onMouseEnter={e => e.target.style.color = C.gold}
                onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.3)"}
              >{l}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Pricing;