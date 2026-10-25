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
  // Three.js 360° Live Photo Walkthrough Engine
  // ==========================================================================
  const panoramaWrapper = document.getElementById('panoramaWrapper');
  const canvasContainer = document.getElementById('threeCanvasContainer');
  const panoramaCover = document.getElementById('panoramaCover');
  const startTourBtn = document.getElementById('startTourBtn');
  const toggleAutoRotateBtn = document.getElementById('toggleAutoRotateBtn');
  const toggleGyroBtn = document.getElementById('toggleGyroBtn');
  const toggleFullscreenBtn = document.getElementById('toggleFullscreenBtn');

  // Scene Texture Paths
  const scenes = {
    hall: 'assets/panoramas/hall_360.jpg',
    stage: 'assets/panoramas/stage_360.jpg',
    lawn: 'assets/panoramas/lawn_360.jpg'
  };

  let currentSceneKey = 'hall';
  let scene, camera, renderer, sphereMesh, textureLoader;
  let isTourStarted = false;
  let autoRotate = true;
  let useGyro = false;

  // Orbit & Touch Controls State
  let isUserInteracting = false;
  let onPointerDownPointerX = 0, onPointerDownPointerY = 0;
  let onPointerDownLon = 0, onPointerDownLat = 0;
  let lon = 90, lat = 0;
  let targetLon = 90, targetLat = 0;
  let fov = 75;

  // Initialize Three.js WebGL Scene
  function initThreeTour() {
    const width = canvasContainer.clientWidth || 800;
    const height = canvasContainer.clientHeight || 500;

    // 1. Scene
    scene = new THREE.Scene();

    // 2. Camera
    camera = new THREE.PerspectiveCamera(fov, width / height, 1, 1100);
    camera.target = new THREE.Vector3(0, 0, 0);

    // 3. Renderer with high DPR support
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    canvasContainer.appendChild(renderer.domElement);

    // 4. Inverted Panoramic Sphere Geometry
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    // 5. Load Initial Texture
    textureLoader = new THREE.TextureLoader();
    loadSphereTexture(scenes[currentSceneKey], geometry);

    // 6. Bind Event Listeners
    setupInteractionEvents();
    window.addEventListener('resize', onWindowResize, false);

    // Start Rendering Loop
    animate();
  }

  function loadSphereTexture(url, geometry) {
    textureLoader.load(
      url,
      (texture) => {
        texture.minFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        if (sphereMesh) {
          sphereMesh.material.map = texture;
          sphereMesh.material.needsUpdate = true;
        } else {
          const material = new THREE.MeshBasicMaterial({ map: texture });
          sphereMesh = new THREE.Mesh(geometry, material);
          scene.add(sphereMesh);
        }
      },
      undefined,
      (err) => {
        console.error('Error loading 360 texture:', err);
      }
    );
  }

  function switchScene(sceneKey) {
    if (!scenes[sceneKey] || sceneKey === currentSceneKey) return;
    currentSceneKey = sceneKey;

    // Update active scene button
    document.querySelectorAll('.scene-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-scene') === sceneKey);
    });

    // Load new texture
    loadSphereTexture(scenes[sceneKey]);

    // Update hotspot positions depending on scene
    updateHotspotsForScene(sceneKey);
  }

  function updateHotspotsForScene(sceneKey) {
    const pinStage = document.querySelector('.pin-stage');
    const pinChandeliers = document.querySelector('.pin-chandeliers');
    const pinLawn = document.querySelector('.pin-lawn');

    if (sceneKey === 'hall') {
      if (pinStage) pinStage.style.display = 'flex';
      if (pinChandeliers) pinChandeliers.style.display = 'flex';
      if (pinLawn) pinLawn.style.display = 'flex';
    } else if (sceneKey === 'stage') {
      if (pinStage) pinStage.style.display = 'none';
      if (pinChandeliers) pinChandeliers.style.display = 'flex';
      if (pinLawn) pinLawn.style.display = 'none';
    } else if (sceneKey === 'lawn') {
      if (pinStage) pinStage.style.display = 'none';
      if (pinChandeliers) pinChandeliers.style.display = 'none';
      if (pinLawn) pinLawn.style.display = 'flex';
    }
  }

  function setupInteractionEvents() {
    const el = renderer.domElement;

    // Desktop Mouse Events
    el.addEventListener('mousedown', onPointerDown, false);
    document.addEventListener('mousemove', onPointerMove, false);
    document.addEventListener('mouseup', onPointerUp, false);

    // Mobile Touch Events (with damping)
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onPointerUp, false);

    // Pinch to Zoom
    el.addEventListener('wheel', onDocumentMouseWheel, { passive: true });
  }

  function onPointerDown(event) {
    if (!isTourStarted) return;
    isUserInteracting = true;
    autoRotate = false;
    updateAutoRotateBtn();

    const clientX = event.clientX;
    const clientY = event.clientY;

    onPointerDownPointerX = clientX;
    onPointerDownPointerY = clientY;
    onPointerDownLon = lon;
    onPointerDownLat = lat;
  }

  function onPointerMove(event) {
    if (!isUserInteracting) return;
    targetLon = (onPointerDownPointerX - event.clientX) * 0.18 + onPointerDownLon;
    targetLat = (event.clientY - onPointerDownPointerY) * 0.18 + onPointerDownLat;
  }

  function onPointerUp() {
    isUserInteracting = false;
  }

  let touchStartDist = 0;
  function onTouchStart(event) {
    if (!isTourStarted) return;
    if (event.touches.length === 1) {
      isUserInteracting = true;
      autoRotate = false;
      updateAutoRotateBtn();

      onPointerDownPointerX = event.touches[0].clientX;
      onPointerDownPointerY = event.touches[0].clientY;
      onPointerDownLon = lon;
      onPointerDownLat = lat;
    } else if (event.touches.length === 2) {
      touchStartDist = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );
    }
  }

  function onTouchMove(event) {
    if (!isTourStarted) return;
    event.preventDefault();

    if (event.touches.length === 1 && isUserInteracting) {
      targetLon = (onPointerDownPointerX - event.touches[0].clientX) * 0.22 + onPointerDownLon;
      targetLat = (event.touches[0].clientY - onPointerDownPointerY) * 0.22 + onPointerDownLat;
    } else if (event.touches.length === 2) {
      const dist = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );
      const factor = (touchStartDist - dist) * 0.05;
      fov = Math.max(45, Math.min(95, fov + factor));
      camera.fov = fov;
      camera.updateProjectionMatrix();
      touchStartDist = dist;
    }
  }

  function onDocumentMouseWheel(event) {
    if (!isTourStarted) return;
    fov += event.deltaY * 0.05;
    fov = Math.max(45, Math.min(95, fov));
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }

  function onWindowResize() {
    if (!renderer || !camera || !canvasContainer) return;
    const width = canvasContainer.clientWidth;
    const height = canvasContainer.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // Device Orientation (Phone Gyroscope)
  function handleDeviceOrientation(event) {
    if (!useGyro) return;
    if (event.gamma !== null && event.beta !== null) {
      targetLon += event.gamma * 0.04;
      targetLat = Math.max(-85, Math.min(85, event.beta - 45));
    }
  }

  function enableGyroMode() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            useGyro = true;
            window.addEventListener('deviceorientation', handleDeviceOrientation);
            updateGyroBtn();
            showToast('Phone Motion Sensor Activated');
          } else {
            showToast('Motion permission denied');
          }
        })
        .catch(err => {
          console.error(err);
          showToast('Motion sensor unavailable');
        });
    } else if (window.DeviceOrientationEvent) {
      useGyro = !useGyro;
      if (useGyro) {
        window.addEventListener('deviceorientation', handleDeviceOrientation);
        showToast('Phone Motion Sensor Activated');
      } else {
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
        showToast('Phone Motion Deactivated');
      }
      updateGyroBtn();
    } else {
      showToast('Gyroscope not supported on this device');
    }
  }

  function updateGyroBtn() {
    if (toggleGyroBtn) {
      toggleGyroBtn.classList.toggle('active', useGyro);
    }
  }

  function updateAutoRotateBtn() {
    if (toggleAutoRotateBtn) {
      toggleAutoRotateBtn.classList.toggle('active', autoRotate);
    }
  }

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);

    if (autoRotate && !isUserInteracting && !useGyro) {
      targetLon += 0.08;
    }

    lon += (targetLon - lon) * 0.1;
    lat += (targetLat - lat) * 0.1;
    lat = Math.max(-85, Math.min(85, lat));

    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lon);

    camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
    camera.target.y = 500 * Math.cos(phi);
    camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);

    camera.lookAt(camera.target);
    renderer.render(scene, camera);
  }

  // Start Tour Handler
  function startTour() {
    isTourStarted = true;
    if (panoramaCover) panoramaCover.classList.add('hidden');
    if (panoramaWrapper) panoramaWrapper.classList.add('tour-active');
    if (!scene) {
      initThreeTour();
    }
  }

  if (startTourBtn) {
    startTourBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startTour();
    });
  }

  if (panoramaCover) {
    panoramaCover.addEventListener('click', () => {
      startTour();
    });
  }

  // Auto-Rotate Button
  if (toggleAutoRotateBtn) {
    toggleAutoRotateBtn.addEventListener('click', () => {
      autoRotate = !autoRotate;
      updateAutoRotateBtn();
    });
  }

  // Gyroscope Button
  if (toggleGyroBtn) {
    toggleGyroBtn.addEventListener('click', () => {
      enableGyroMode();
    });
  }

  // Fullscreen Button
  if (toggleFullscreenBtn) {
    toggleFullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        if (panoramaWrapper.requestFullscreen) {
          panoramaWrapper.requestFullscreen();
        } else if (panoramaWrapper.webkitRequestFullscreen) {
          panoramaWrapper.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    });
  }

  // Scene Switching Buttons
  document.querySelectorAll('.scene-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetScene = btn.getAttribute('data-scene');
      startTour();
      switchScene(targetScene);
    });
  });

  // Hotspots and Hotspot Drawer
  const hotspotDrawer = document.getElementById('hotspotDrawer');
  const drawerTitle = document.getElementById('drawerTitle');
  const drawerDesc = document.getElementById('drawerDesc');
  const drawerThumbImg = document.getElementById('drawerThumbImg');
  const drawerInquireBtn = document.getElementById('drawerInquireBtn');
  const drawerClose = document.getElementById('drawerClose');

  document.querySelectorAll('.hotspot-pin').forEach(pin => {
    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      const title = pin.getAttribute('data-title');
      const desc = pin.getAttribute('data-desc');
      const img = pin.getAttribute('data-img');

      if (drawerTitle) drawerTitle.textContent = title;
      if (drawerDesc) drawerDesc.textContent = desc;
      if (drawerThumbImg && img) drawerThumbImg.src = img;

      if (drawerInquireBtn) {
        const text = encodeURIComponent(`Hello SV Conventional Hall, I am interested in inquiring about "${title}". Please share details.`);
        drawerInquireBtn.href = `https://wa.me/919768688889?text=${text}`;
      }

      if (hotspotDrawer) {
        hotspotDrawer.classList.add('open');
      }
    });
  });

  if (drawerClose && hotspotDrawer) {
    drawerClose.addEventListener('click', () => {
      hotspotDrawer.classList.remove('open');
    });
  }

  // Initial launch of 360 tour engine
  if (canvasContainer && window.THREE) {
    initThreeTour();
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
      window.open(`https://wa.me/919768688889?text=${message}`, '_blank');
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
      window.open(`https://wa.me/919768688889?text=${msg}`, '_blank');
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
      window.open(`https://wa.me/919768688889?text=${msg}`, '_blank');
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
