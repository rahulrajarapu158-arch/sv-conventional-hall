/**
 * SV CONVENTIONAL HALL & LAWNS • HAYATHNAGAR, PEDDA AMBERPET
 * Interactive Virtual Tour & Venue Booking Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Mobile Navigation Toggle
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });

    // Close mobile nav when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }

  // ==========================================================================
  // Venue Spaces Tabs Switcher
  // ==========================================================================
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.space-tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });

  // ==========================================================================
  // Muhurtham & Event Budget Estimator Engine
  // ==========================================================================
  const guestSlider = document.getElementById('guestCountSlider');
  const guestDisplay = document.getElementById('guestCountDisplay');
  const summaryGuestCount = document.getElementById('summaryGuestCount');
  const summaryTierName = document.getElementById('summaryTierName');
  const summarySuites = document.getElementById('summarySuites');
  const totalEstimateDisplay = document.getElementById('totalEstimateDisplay');
  const tierRadios = document.querySelectorAll('input[name="venueTier"]');
  const addonSound = document.getElementById('addonSound');
  const addonLighting = document.getElementById('addonLighting');
  const addonValet = document.getElementById('addonValet');
  const addonCleaning = document.getElementById('addonCleaning');
  const sendEstimateBtn = document.getElementById('sendEstimateBtn');

  // Pricing Base Matrix (in INR)
  const tierConfig = {
    silver: {
      baseTariff: 135000,
      title: 'Royal Silver (Banquet Hall + Dining + 2 AC Suites)',
      suites: 'Included (2 AC Rooms)',
      perGuestRate: 35
    },
    gold: {
      baseTariff: 185000,
      title: 'Imperial Rose (Hall + Lawn + Dining + 3 Suites + Sound)',
      suites: 'Included (3 AC Deluxe Suites)',
      perGuestRate: 45
    },
    platinum: {
      baseTariff: 245000,
      title: 'Crown Diamond (Full Property + Lawn + Valet + Generator)',
      suites: 'Included (4 AC Deluxe Suites)',
      perGuestRate: 55
    }
  };

  function calculateTariff() {
    const guests = parseInt(guestSlider.value, 10);
    if (guestDisplay) guestDisplay.textContent = `${guests.toLocaleString('en-IN')} Guests`;
    if (summaryGuestCount) summaryGuestCount.textContent = `${guests.toLocaleString('en-IN')} Guests`;

    let selectedTierKey = 'silver';
    tierRadios.forEach(radio => {
      const card = radio.closest('.tier-card');
      if (radio.checked) {
        selectedTierKey = radio.value;
        if (card) card.classList.add('active');
      } else {
        if (card) card.classList.remove('active');
      }
    });

    const tier = tierConfig[selectedTierKey] || tierConfig.silver;
    if (summaryTierName) summaryTierName.textContent = tier.title;
    if (summarySuites) summarySuites.textContent = tier.suites;

    let total = tier.baseTariff + (guests * tier.perGuestRate);

    if (addonSound && addonSound.checked) total += 18000;
    if (addonLighting && addonLighting.checked) total += 22000;
    if (addonValet && addonValet.checked) total += 12000;
    if (addonCleaning && addonCleaning.checked) total += 8000;

    if (totalEstimateDisplay) {
      totalEstimateDisplay.textContent = total.toLocaleString('en-IN');
    }

    return { total, guests, tier };
  }

  if (guestSlider) {
    guestSlider.addEventListener('input', calculateTariff);
  }

  tierRadios.forEach(radio => {
    radio.addEventListener('change', calculateTariff);
  });

  [addonSound, addonLighting, addonValet, addonCleaning].forEach(addon => {
    if (addon) addon.addEventListener('change', calculateTariff);
  });

  // Initial Calculation Run
  calculateTariff();

  // Send Estimate to WhatsApp
  if (sendEstimateBtn) {
    sendEstimateBtn.addEventListener('click', () => {
      const { total, guests, tier } = calculateTariff();
      const message = `Hello SV Conventional Hall Management Desk,%0A%0AI used your website budget calculator to estimate my wedding/reception tariff:%0A- Expected Guests: ${guests}%0A- Selected Package: ${tier.title}%0A- Indicative Total Tariff: ₹ ${total.toLocaleString('en-IN')}%0A%0APlease check availability for my muhurtham dates and confirm the quote.`;
      window.open(`https://wa.me/919849287654?text=${message}`, '_blank');
    });
  }

  // ==========================================================================
  // Quick Muhurtham Date Checker Form
  // ==========================================================================
  const quickForm = document.getElementById('quickInquiryForm');
  if (quickForm) {
    const dateInput = document.getElementById('eventDate');
    if (dateInput) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      dateInput.value = futureDate.toISOString().split('T')[0];
      dateInput.min = new Date().toISOString().split('T')[0];
    }

    quickForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const date = document.getElementById('eventDate')?.value || 'Not Specified';
      const eventType = document.getElementById('eventType')?.value || 'Wedding';
      const guestEst = document.getElementById('guestEstimate')?.value || '600-1000 Guests';

      const msg = `Hello SV Conventional Hall,%0A%0AI would like to check hall availability:%0A- Preferred Muhurtham Date: ${date}%0A- Event Occasion: ${eventType}%0A- Expected Guests: ${guestEst}%0A%0APlease confirm slot availability and sharing booking process.`;
      window.open(`https://wa.me/919849287654?text=${msg}`, '_blank');
    });
  }

  // ==========================================================================
  // Interactive Floor Plan Zone Highlighting
  // ==========================================================================
  const keyItems = document.querySelectorAll('.key-item');
  keyItems.forEach(item => {
    item.addEventListener('click', () => {
      keyItems.forEach(k => k.classList.remove('active'));
      item.classList.add('active');

      const highlightId = item.getAttribute('data-highlight');
      document.querySelectorAll('.blueprint-zone').forEach(zone => {
        zone.classList.remove('highlight');
      });

      const targetZone = document.getElementById(highlightId);
      if (targetZone) {
        targetZone.classList.add('highlight');
      }
    });
  });

  // ==========================================================================
  // Main Contact Form
  // ==========================================================================
  const mainContactForm = document.getElementById('mainContactForm');
  if (mainContactForm) {
    const cDateInput = document.getElementById('cEventDate');
    if (cDateInput) {
      cDateInput.min = new Date().toISOString().split('T')[0];
    }

    mainContactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('cName')?.value || '';
      const phone = document.getElementById('cPhone')?.value || '';
      const date = document.getElementById('cEventDate')?.value || '';
      const type = document.getElementById('cEventType')?.value || '';
      const note = document.getElementById('cMessage')?.value || 'None';

      const msg = `Hello SV Conventional Hall,%0A%0A*New Booking Inquiry*%0A- Name: ${name}%0A- Mobile: ${phone}%0A- Event Date: ${date}%0A- Event Type: ${type}%0A- Notes: ${note}%0A%0APlease arrange a walkthrough or contact me back.`;
      window.open(`https://wa.me/919849287654?text=${msg}`, '_blank');
    });
  }

  // ==========================================================================
  // Copy Address Button
  // ==========================================================================
  const copyAddressBtn = document.getElementById('copyAddressBtn');
  if (copyAddressBtn) {
    copyAddressBtn.addEventListener('click', () => {
      const address = "SV Conventional Hall & Lawns, NH-65 Vijayawada Highway, Near ORR Exit 11, Pedda Amberpet, Hayathnagar, Rangareddy District, Telangana – 501505";
      navigator.clipboard.writeText(address).then(() => {
        showToast('Venue address copied to clipboard!');
      }).catch(() => {
        showToast('Address: NH-65 Pedda Amberpet');
      });
    });
  }

  // Toast Helper
  function showToast(text) {
    const toast = document.getElementById('toastMessage');
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }
});
