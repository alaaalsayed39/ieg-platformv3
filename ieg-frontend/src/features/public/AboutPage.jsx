import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';
import PublicNavbar from "../../components/layout/PublicNavbar";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* HERO SECTION */}
      <section className="relative h-[400px] lg:h-[500px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=2070&auto=format&fit=crop')` }}
        >
          <div className="absolute inset-0 bg-[#0a1628]/80" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 tracking-tight">About IEG</h1>
          <p className="text-xl lg:text-2xl text-white font-semibold mb-4">We're your global trade partner based in Egypt.</p>
          <p className="text-gray-300 text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
            From our headquarters in Cairo, we specialize in seamless international exports, connecting businesses to markets worldwide.
          </p>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="py-10 lg:py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-y-4">
            {[
              { value: '15+', label: 'Years' },
              { value: '500', label: 'Exporters' },
              { value: '80', label: 'Countries' },
              { value: '$2B', label: 'Volume' }
            ].map((stat, index, arr) => (
              <div key={stat.label} className="flex items-center">
                <div className="text-center px-4 lg:px-6">
                  <span className="block text-2xl lg:text-4xl font-bold text-[#f59e0b]">{stat.value}</span>
                  <span className="block text-sm lg:text-base font-semibold text-gray-800 mt-1">{stat.label}</span>
                </div>
                {index < arr.length - 1 && <div className="hidden sm:block w-px h-12 bg-gray-300" />}
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-4 font-medium">In global trade and logistics</p>
        </div>
      </section>

      {/* VISION / MISSION / VALUES */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {[
              { title: 'Our Vision', items: ['Drive a new era of global trade', 'Become the leading global trade partner', 'Digital Innovation', 'Customer Approach'] },
              { title: 'Our Mission', items: ['Digital Innovation', 'Empower with technology', 'Simplify exporters', 'Data-Driven Collaboration'] },
              { title: 'Our Values', items: ['Integrity & Trust', 'Teamwork & trade', 'Customer Excellence', 'Data-Driven Decisions'] },
            ].map((col) => (
              <div key={col.title} className="text-center">
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6">{col.title}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {col.items.map((item) => (
                    <div key={item} className="bg-[#0a1628] text-white p-4 rounded-lg shadow-md hover:shadow-xl transition-all hover:-translate-y-1 min-h-[80px] flex items-center justify-center">
                      <h4 className="font-semibold text-sm leading-snug">{item}</h4>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPANY CTA */}
      <section className="bg-[#1e3a5f] py-14 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">Company</h2>
          <p className="text-gray-300 text-base lg:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            A trusted partner for global trade, built by exporters, for exporters.
          </p>
          <button className="bg-[#f59e0b] hover:bg-[#d97706] text-white font-semibold py-2.5 px-8 rounded-full transition-all hover:scale-105 shadow-lg">
            Learn More
          </button>
        </div>
      </section>

      {/* LEADERSHIP TEAM & PARTNERS */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

            <div>
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-8">Leadership Team</h3>
              <div className="flex flex-wrap gap-8 items-start">
                {[
                  { name: 'Aya Ahmed', role: 'Founder', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face' },
                  { name: 'Shahd Abd Almoiez', role: 'Chief Executive Officer', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face' },
                  { name: 'Alaa Elsayed', role: 'Chief Operating Officer', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' },
                  { name: 'Reem Emad', role: 'Chief Marketing Officer', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face' },
                  { name: 'Aya Ebrahim', role: 'CTO', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face' }
                ].map((member) => (
                  <div key={member.name} className="flex flex-col items-center text-center group">
                    <div className="w-20 h-20 mb-3 rounded-lg overflow-hidden bg-gray-200 shadow-md group-hover:ring-2 group-hover:ring-[#f59e0b] transition-all">
                      <img src={member.img} alt={member.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 leading-tight">{member.name}</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-tight">{member.role}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-8">Partners</h3>
              <div className="flex flex-wrap items-center gap-10">
                {[
                  { href: 'https://www.fedex.com', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/FedEx_Corporation_-_2016_Logo.svg/3840px-FedEx_Corporation_-_2016_Logo.svg.png', alt: 'FedEx' },
                  { href: 'https://www.amazon.com', src: 'https://upload.wikimedia.org/wikipedia/commons/0/06/Amazon_2024.svg', alt: 'Amazon' },
                  { href: 'https://www.paypal.com', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/3840px-PayPal.svg.png', alt: 'PayPal' },
                  { href: 'https://www.dhl.com', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/DHL_Logo.svg/1280px-DHL_Logo.svg.png', alt: 'DHL' },
                  { href: 'https://www.ebay.com', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/EBay_logo.svg/1280px-EBay_logo.svg.png', alt: 'eBay' },
                ].map((p) => (
                  <a key={p.alt} href={p.href} target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-all duration-300 hover:scale-110">
                    <img src={p.src} alt={p.alt} className="h-8 lg:h-12 w-auto object-contain" />
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutUs;