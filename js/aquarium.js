// aquarium.js
// Controls the main simulation, canvas, particle effects, interactions, and UI controls for PhiloFish.

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('aquarium-canvas');
  const ctx = canvas.getContext('2d');
  const container = document.getElementById('canvas-container');

  // UI Elements
  const themeButtons = document.querySelectorAll('.theme-btn');
  const tabButtons = document.querySelectorAll('.philo-tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // New UI Elements for 3 Laws
  const btnModeDay = document.getElementById('btn-mode-day');
  const btnModeNight = document.getElementById('btn-mode-night');
  const timeModeVal = document.getElementById('time-mode-val');
  const oxygenVal = document.getElementById('oxygen-val');
  const oxygenProgress = document.getElementById('oxygen-progress');

  const toxicSlider = document.getElementById('toxic-slider');
  const toxicVal = document.getElementById('toxic-val');
  const btnOverfeed = document.getElementById('btn-overfeed');

  const lifecycleStageVal = document.getElementById('lifecycle-stage-val');
  const btnTimelineForward = document.getElementById('btn-timeline-forward');
  const generationChart = document.getElementById('generation-chart');

  const toggleRays = document.getElementById('toggle-rays');
  const toggleBubbles = document.getElementById('toggle-bubbles');

  const activeQualityState = document.getElementById('active-quality-state');
  const fpsCounter = document.getElementById('fps-counter');

  // Environment Description Widget
  const envDescWidget = document.getElementById('env-desc-widget');
  const envDescIcon = document.getElementById('env-desc-icon');
  const envDescTitle = document.getElementById('env-desc-title');
  const envDescBody = document.getElementById('env-desc-body');

  // Category UI Elements (6 Cặp phạm trù)
  const categoryCards = document.querySelectorAll('.category-card');
  const explanationBox = document.getElementById('category-explanation-box');
  const explanationTitle = document.getElementById('explanation-title');
  const explanationText = document.getElementById('explanation-text');
  const closeExplanationBtn = document.getElementById('btn-close-explanation');

  // 6 Categories Explanations Data
  const categoryExplanations = {
    'rieng-chung': {
      title: "Cái chung, Cái riêng & Cái đơn nhất",
      text: "Mỗi chú cá mang <b>Cái chung</b> (thuộc tính của loài cá: thở bằng mang, sống dưới nước), là một <b>Cái riêng</b> (tổng thể cấu thành nên chú cá đó), và sở hữu <b>Cái đơn nhất</b> (đặc điểm không lặp lại: vết sẹo, cân nặng chính xác lúc này, hay vị trí đang bơi). Ao ô nhiễm thì Cái chung bị phá vỡ, kéo theo sự hủy diệt của mọi Cái riêng và Cái đơn nhất."
    },
    'nguyennhan-ketqua': {
      title: "Nguyên nhân & Kết quả",
      text: "Thức ăn thừa (Nguyên nhân) sinh ra khí độc làm cá bệnh (Kết quả). Cá bệnh lại thải ra nhiều mầm bệnh hơn (Kết quả biến thành Nguyên nhân mới)."
    },
    'tatnhien-ngauhien': {
      title: "Tất nhiên & Ngẫu nhiên",
      text: "Cá đói thì Tất nhiên phải ăn để lớn. Nhưng một trận mưa rào đột ngột làm tụt nhiệt độ ao là Ngẫu nhiên. Người nuôi cá phải quản lý cái tất nhiên nhưng luôn có phương án dự phòng cho cái ngẫu nhiên."
    },
    'noidung-hinhthuc': {
      title: "Nội dung & Hình thức",
      text: "Nội dung là nuôi loài cá dữ, mật độ dày. Hình thức bắt buộc ao phải có lưới cao, hệ thống xả thải mạnh. Nội dung nào thì hình thức ấy."
    },
    'banchat-hientuong': {
      title: "Bản chất & Hiện tượng",
      text: "Cá ngớp trên mặt nước chỉ là Hiện tượng bề nổi. Bản chất là do thiếu Oxy dưới đáy ao. Muốn giải quyết tận gốc phải bật máy sục khí (tác động vào bản chất), chứ không phải vớt cá lên mặt nước."
    },
    'khamang-hienthuc': {
      title: "Khả năng & Hiện thực",
      text: "Cá giống lúc này là Hiện thực. Nó ẩn chứa 2 Khả năng: Trở thành 2 tấn cá thương phẩm mang lại lợi nhuận, hoặc biến thành số 0 nếu ao bị dịch bệnh. Việc chăm sóc của bạn sẽ quyết định khả năng nào thành hiện thực."
    }
  };

  // Trạng thái mô phỏng ao cá
  let width = canvas.width = container.clientWidth;
  let height = canvas.height = container.clientHeight;

  let fishes = [];
  let foods = [];
  let bubbles = [];
  let tailParticles = [];
  let leapParticles = [];
  let silhouettes = []; // Lưu trữ các thế hệ cá cũ đã bị phủ định
  let trajectoryPath = []; // Lưu trữ đường đi xoắn ốc neon của cá
  let clouds = []; // Danh sách các đám mây di động trên bầu trời
  let currentTheme = 'pond';
  let lastTime = performance.now();
  let fps = 60;
  let frameCount = 0;
  let fpsTimer = 0;

  let activeCategory = null; // Cặp phạm trù đang kích hoạt: 'rieng-chung', 'nguyennhan-ketqua',...

  // Thuộc tính mô phỏng cho 3 Quy luật Triết học
  let isDay = true;
  let currentOxygen = 100;
  let targetOxygen = 100;
  let algaeList = [];
  let bacteriaList = [];
  let oxygenParticles = [];

  // Các chỉ số động mô phỏng chu trình sinh thái (Nhiệt độ, Ánh sáng, Quang hợp, Hô hấp)
  let waterTemp = 28;
  let lightIntensity = 95;
  let photosynthesisRate = 90;
  let respirationRate = 40;

  // Các thực thể tương tác cho 6 Cặp phạm trù
  let aerator = { x: 80, y: 0, width: 90, height: 90, angle: 0 };
  let wastePile = { x: 0, y: 0, width: 100, height: 25 };
  let netEnclosure = { x: 0, y: 0, width: 150, height: 150 };
  let seedlingBucket = { x: 0, y: 0, width: 70, height: 70 };
  let weatherState = 'sunny';
  let aeratorOn = false;
  let rainDrops = [];
  let seedlingParticles = [];
  let hoveredObject = null; // Thực thể đang rê chuột qua: 'fish', 'aerator', 'waste', 'net', 'bucket'

  // Theo dõi vị trí của chuột
  const mouse = {
    x: 0,
    y: 0,
    active: false
  };

  // Cập nhật mô tả và bảng chỉ số mô phỏng sinh thái động (Góc trên bên phải)
  function updateEnvDescription() {
    if (!envDescWidget || !envDescIcon || !envDescTitle || !envDescBody) return;

    let icon = "☀";
    let title = "";

    // Tính toán nhiệt độ, ánh sáng và quang hợp dựa trên thời tiết và ngày đêm
    if (isDay) {
      if (weatherState === 'sunny') {
        icon = "☀";
        title = "Chỉ số Sinh thái (Ngày Nắng)";
        waterTemp = 28;
        lightIntensity = 95;
        photosynthesisRate = 90;
      } else {
        icon = "🌧";
        title = "Chỉ số Sinh thái (Ngày Mưa)";
        waterTemp = 22;
        lightIntensity = 40;
        photosynthesisRate = 30;
      }
    } else {
      if (weatherState === 'sunny') {
        icon = "🌙";
        title = "Chỉ số Sinh thái (Đêm Thanh)";
        waterTemp = 24;
        lightIntensity = 10;
        photosynthesisRate = 0;
      } else {
        icon = "🌧";
        title = "Chỉ số Sinh thái (Đêm Mưa)";
        waterTemp = 19;
        lightIntensity = 2;
        photosynthesisRate = 0;
      }
    }

    // Hiệu năng hô hấp của cá tăng vọt khi nồng độ Oxy hòa tan tụt giảm (cá đấu tranh ngớp khí)
    // Thay đổi từ từ: Oxy 100% -> Hô hấp 40%, Oxy 0% -> Hô hấp 90%
    respirationRate = Math.round(40 + (100 - currentOxygen) * 0.5);

    envDescIcon.textContent = icon;
    envDescTitle.textContent = title;

    // Chọn thông điệp và màu sắc sinh thái tương ứng
    let statusText = "";
    let statusColor = "#a5d6a7";
    if (isDay && weatherState === 'sunny') {
      statusText = "Tảo quang hợp mạnh, ao tích lũy Oxy";
      statusColor = "#81c784";
    } else if (weatherState === 'rainy') {
      statusText = "Mưa xáo động mặt hồ, hấp thụ Oxy trực tiếp";
      statusColor = "#4fc3f7";
    } else {
      statusText = "Quang hợp ngừng, sinh vật hô hấp tiêu hao Oxy";
      statusColor = "#ffb74d";
    }

    // Ghi đè HTML tĩnh thành bảng thông tin mô phỏng động trực quan
    const tempPercent = Math.round((waterTemp / 40) * 100);
    const tempColor = '#80deea';

    envDescBody.innerHTML = `
      <div class="env-sim-container">
        <div class="env-sim-row">
          <div class="env-sim-row-header">
            <span class="env-sim-label">🌡 Nhiệt độ nước:</span>
            <span class="env-sim-value" id="sim-val-temp" style="color: ${tempColor};">${waterTemp}°C</span>
          </div>
          <div class="env-sim-bar-bg">
            <div class="env-sim-bar-fill" style="width: ${tempPercent}%; background: ${tempColor}; box-shadow: 0 0 5px ${tempColor}b3;"></div>
          </div>
        </div>
        
        <div class="env-sim-row">
          <div class="env-sim-row-header">
            <span class="env-sim-label">☀ Cường độ sáng:</span>
            <span class="env-sim-value">${lightIntensity}%</span>
          </div>
          <div class="env-sim-bar-bg">
            <div class="env-sim-bar-fill" style="width: ${lightIntensity}%; background: #ffd54f; box-shadow: 0 0 5px #ffd54fb3;"></div>
          </div>
        </div>

        <div class="env-sim-row">
          <div class="env-sim-row-header">
            <span class="env-sim-label">🌿 Quang hợp (Tảo):</span>
            <span class="env-sim-value">${photosynthesisRate}%</span>
          </div>
          <div class="env-sim-bar-bg">
            <div class="env-sim-bar-fill" style="width: ${photosynthesisRate}%; background: #81c784; box-shadow: 0 0 5px #81c784b3;"></div>
          </div>
        </div>

        <div class="env-sim-row">
          <div class="env-sim-row-header">
            <span class="env-sim-label">🐟 Hô hấp (Cá):</span>
            <span class="env-sim-value">${respirationRate}%</span>
          </div>
          <div class="env-sim-bar-bg">
            <div class="env-sim-bar-fill" style="width: ${respirationRate}%; background: #e57373; box-shadow: 0 0 5px #e57373b3;"></div>
          </div>
        </div>

        <div class="env-sim-status" style="color: ${statusColor};">
          <span class="env-sim-status-dot" style="background: ${statusColor}; box-shadow: 0 0 6px 2px ${statusColor}b3;"></span>
          <span>${statusText}</span>
        </div>
      </div>
    `;
  }

  // 1. Khởi tạo các phần tử mô phỏng
  function init() {
    resizeCanvas();

    // Khởi tạo 5 con cá thuộc 5 loài khác nhau (carp, snakehead, tilapia, grass_carp, silver_carp)
    fishes = [];
    const types = ['carp', 'snakehead', 'tilapia', 'grass_carp', 'silver_carp'];
    types.forEach((type, idx) => {
      const fx = (idx + 0.5) * (width / 5) + (Math.random() - 0.5) * 30;
      const fy = (height / 3 + 45) + Math.random() * (height * 2 / 3 - 100);
      const scale = type === 'goldfish' ? 1.2 : 1.4;
      const fish = new Fish(fx, fy, type, scale);

      // Con cá koi đầu tiên làm nổi bật bộ phận theo Quy luật Triết học
      if (idx === 0) {
        fish.highlightedPart = 'head';
      } else {
        fish.highlightedPart = null;
      }
      fishes.push(fish);
    });

    // Khởi tạo bong bóng nước ban đầu
    for (let i = 0; i < 30; i++) {
      bubbles.push(createBubble(true));
    }

    // Khởi tạo các khóm tảo ở đáy ao
    algaeList = [];
    for (let i = 0; i < 4; i++) {
      algaeList.push({
        x: (i + 0.5) * (width / 4) + (Math.random() - 0.5) * 40,
        height: 60 + Math.random() * 40,
        width: 15 + Math.random() * 10,
        swayOffset: Math.random() * 100
      });
    }

    // Khởi tạo vi khuẩn (giới hạn trong 2/3 vùng nước phía dưới)
    bacteriaList = [];
    for (let i = 0; i < 25; i++) {
      bacteriaList.push({
        x: Math.random() * width,
        y: (height / 3) + Math.random() * (height * 2 / 3),
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2 + 1,
        wiggle: Math.random() * 100
      });
    }

    // Khởi tạo hạt Oxy (giới hạn trong 2/3 vùng nước phía dưới)
    oxygenParticles = [];
    for (let i = 0; i < 20; i++) {
      oxygenParticles.push({
        x: Math.random() * width,
        y: (height / 3) + Math.random() * (height * 2 / 3),
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 0.6 - 0.2,
        radius: Math.random() * 2.5 + 1.5,
        alpha: Math.random() * 0.6 + 0.2
      });
    }

    // Khởi tạo hạt mưa (sinh ra ở 1/3 vùng khí quyển phía trên)
    rainDrops = [];
    for (let i = 0; i < 60; i++) {
      rainDrops.push({
        x: Math.random() * width,
        y: Math.random() * (height / 3),
        speed: Math.random() * 5 + 8,
        wind: -1 - Math.random() * 2
      });
    }

    // Khởi tạo mây trôi trên bầu trời
    clouds = [];
    for (let i = 0; i < 5; i++) {
      clouds.push({
        x: Math.random() * width,
        y: Math.random() * (height / 3 - 80) + 35,
        size: Math.random() * 18 + 12,
        speed: Math.random() * 0.15 + 0.05,
        opacity: Math.random() * 0.2 + 0.5
      });
    }

    // Khởi tạo các đường gió lướt qua bầu trời
    windLines = [];
    for (let i = 0; i < 3; i++) {
      windLines.push({
        x: Math.random() * width,
        y: Math.random() * (height / 3 - 60) + 30,
        length: Math.random() * 100 + 80,
        speed: Math.random() * 1.5 + 1.0,
        opacity: Math.random() * 0.15 + 0.05
      });
    }

    // Đăng ký các hàm lắng nghe sự kiện
    window.addEventListener('resize', resizeCanvas);
    setupMouseInteraction();
    setupUIControls();
    setupPhilosophyLeapListener();
    setupEvolutionListener();
    updateEnvDescription();

    // Bắt đầu vòng lặp hoạt ảnh chính
    requestAnimationFrame(loop);
  }

  // 2. Bubble Particle System (Ambient - confined to bottom 2/3 water zone)
  function createBubble(randomY = false) {
    return {
      x: Math.random() * width,
      y: randomY ? (height / 3 + Math.random() * (height * 2 / 3)) : height + 20,
      radius: Math.random() * 4 + 1.5,
      speed: Math.random() * 1.2 + 0.4,
      wiggle: Math.random() * 100,
      wiggleSpeed: Math.random() * 0.04 + 0.01,
      wiggleRange: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.3 + 0.1
    };
  }

  function updateAndDrawBubbles() {
    if (!toggleBubbles.checked) return;

    ctx.save();
    ctx.strokeStyle = currentTheme === 'cyber' ? 'rgba(213, 0, 249, 0.3)' : 'rgba(255, 255, 255, 0.25)';
    ctx.fillStyle = currentTheme === 'cyber' ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    bubbles.forEach((bubble, idx) => {
      bubble.y -= bubble.speed;
      bubble.wiggle += bubble.wiggleSpeed;
      bubble.x += Math.sin(bubble.wiggle) * bubble.wiggleRange;

      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();

      // Bubbles pop when they reach the water surface (height / 3)
      if (bubble.y < height / 3 || bubble.x < -20 || bubble.x > width + 20) {
        bubbles[idx] = createBubble(false);
      }
    });
    ctx.restore();
  }

  // 3. Food Particle System (Thermal Pellets)
  function createFood(x, y, type = 'heat') {
    const isHeat = type === 'heat';
    return {
      x: x,
      y: y,
      type: type, // 'heat' or 'cold'
      radius: 5.5,
      vy: Math.random() * 0.4 + 0.7,
      vx: (Math.random() - 0.5) * 0.2,
      wiggleTime: Math.random() * 100,
      eaten: false,
      dissolveTimer: 240,
      color: isHeat ? '#ff3d00' : '#00e5ff', // Red for heat, Cyan for cold
      glowColor: isHeat ? 'rgba(255, 61, 0, 0.6)' : 'rgba(0, 229, 255, 0.6)'
    };
  }

  function updateAndDrawFood() {
    ctx.save();

    foods.forEach((pellet, idx) => {
      if (pellet.eaten) return;

      if (pellet.y < height - 10) {
        pellet.y += pellet.vy;
        pellet.wiggleTime += 0.05;
        pellet.x += Math.sin(pellet.wiggleTime) * 0.15 + pellet.vx;
      } else {
        pellet.dissolveTimer--;
      }

      ctx.shadowBlur = 6;
      ctx.shadowColor = pellet.glowColor;
      ctx.fillStyle = pellet.color;
      ctx.beginPath();
      ctx.arc(pellet.x, pellet.y, pellet.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pellet.x - 1, pellet.y - 1, pellet.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    });

    foods = foods.filter(p => !p.eaten && p.dissolveTimer > 0);
    ctx.restore();
  }

  // 4. Sun Rays (Caustics Overlay) Effect
  let raysOffset = 0;
  function drawSunRays() {
    if (!toggleRays.checked) return;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    raysOffset += 0.002;
    const rayCount = 5;
    const rayWidth = width / 3.5;

    for (let i = 0; i < rayCount; i++) {
      const angle = -0.12 + Math.sin(raysOffset + i * 1.8) * 0.06;
      const xTop = (i * (width / (rayCount - 1))) + Math.cos(raysOffset * 1.5 + i) * 50;
      const gradient = ctx.createLinearGradient(xTop, 0, xTop + Math.sin(angle) * height, height);

      if (currentTheme === 'cyber') {
        gradient.addColorStop(0, 'rgba(213, 0, 249, 0.15)');
        gradient.addColorStop(0.5, 'rgba(0, 229, 255, 0.04)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (currentTheme === 'pond') {
        gradient.addColorStop(0, 'rgba(128, 222, 234, 0.12)');
        gradient.addColorStop(0.4, 'rgba(77, 182, 172, 0.03)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else { // Ocean
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(0.5, 'rgba(0, 188, 212, 0.03)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(xTop - rayWidth / 2, 0);
      ctx.lineTo(xTop + rayWidth / 2, 0);

      const xBottomL = xTop - rayWidth + Math.sin(angle) * height;
      const xBottomR = xTop + rayWidth + Math.sin(angle) * height;

      ctx.lineTo(xBottomR, height);
      ctx.lineTo(xBottomL, height);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // 5. Water Ripple click effect helper
  function triggerWaterRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.classList.add('ripple');
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    container.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 850);
  }

  // 6. Mouse and Touch Interaction Handlers
  function setupMouseInteraction() {
    const handleMove = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = clientX - rect.left;
      mouse.y = clientY - rect.top;
      mouse.active = true;
    };

    container.addEventListener('mousemove', (e) => {
      handleMove(e.clientX, e.clientY);
    });

    container.addEventListener('mouseleave', () => {
      mouse.active = false;
      fishes.forEach(fish => fish.target = null);
    });

    container.addEventListener('mouseenter', (e) => {
      handleMove(e.clientX, e.clientY);
    });

    container.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    });

    container.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    });

    container.addEventListener('touchend', () => {
      mouse.active = false;
      fishes.forEach(fish => fish.target = null);
    });

    container.addEventListener('click', (e) => {
      if (e.target !== canvas && e.target !== container) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      triggerWaterRipple(e.clientX, e.clientY);

      // Kiểm tra thực thể được nhấp chọn
      let clickedEntity = null;
      let clickedFish = null;
      if (hoveredObject) {
        clickedEntity = hoveredObject;
        if (hoveredObject === 'fish') {
          clickedFish = hoveredFish;
        }
      } else {
        for (let i = 0; i < fishes.length; i++) {
          const fish = fishes[i];
          if (Math.hypot(clickX - fish.x, clickY - fish.y) < 55 * fish.scale) {
            clickedEntity = 'fish';
            clickedFish = fish;
            break;
          }
        }
        if (!clickedEntity) {
          if (clickX >= aerator.x && clickX <= aerator.x + aerator.width &&
            clickY >= aerator.y && clickY <= aerator.y + aerator.height) {
            clickedEntity = 'aerator';
          } else if (clickX >= wastePile.x && clickX <= wastePile.x + wastePile.width &&
            clickY >= wastePile.y && clickY <= wastePile.y + wastePile.height) {
            clickedEntity = 'waste';
          } else if (clickX >= netEnclosure.x && clickX <= netEnclosure.x + netEnclosure.width &&
            clickY >= netEnclosure.y && clickY <= netEnclosure.y + netEnclosure.height) {
            clickedEntity = 'net';
          } else if (clickX >= seedlingBucket.x && clickX <= seedlingBucket.x + seedlingBucket.width &&
            clickY >= seedlingBucket.y && clickY <= seedlingBucket.y + seedlingBucket.height) {
            clickedEntity = 'bucket';
          }
        }
      }

      if (clickedEntity) {
        if (clickedEntity === 'aerator') {
          aeratorOn = !aeratorOn;
        } else if (clickedEntity === 'bucket') {
          // Thả cá con ra bể (Khả năng & Hiện thực)
          for (let i = 0; i < 8; i++) {
            seedlingParticles.push({
              x: seedlingBucket.x + seedlingBucket.width / 2,
              y: seedlingBucket.y + seedlingBucket.height - 5,
              vx: -(Math.random() * 1.8 + 0.8),
              vy: Math.random() * 1.0 + 0.4,
              angle: Math.PI,
              wagTime: Math.random() * 10,
              life: 1.0,
              decay: Math.random() * 0.01 + 0.008,
              size: 4 + Math.random() * 2
            });
          }
        }
        showPhilosophicalPopup(clickedEntity, clickedFish);
        e.stopPropagation();
        return; // Ngăn chặn thả thức ăn
      }

      const randomType = Math.random() > 0.3 ? 'heat' : 'cold';
      const foodY = Math.max(clickY, height / 3);
      foods.push(createFood(clickX, foodY, randomType));
    });
  }

  // 7. Bind UI Controls
  function setupUIControls() {
    // Theme buttons (Worldviews)
    if (themeButtons) {
      themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          themeButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentTheme = btn.dataset.theme;
          document.body.style.background = `var(--bg-${currentTheme})`;
        });
      });
    }

    // 3 Laws tab switch
    if (tabButtons) {
      tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          tabButtons.forEach(b => b.classList.remove('active'));
          if (typeof tabContents !== 'undefined' && tabContents) {
            tabContents.forEach(c => c.classList.remove('active'));
          }

          btn.classList.add('active');
          const tabId = `tab-${btn.dataset.tab}`;
          const tabEl = document.getElementById(tabId);
          if (tabEl) tabEl.classList.add('active');

          // Đặt nổi bật bộ phận xương sống cho con cá đầu tiên (đại diện)
          fishes.forEach((fish, idx) => {
            if (idx === 0) {
              const tabName = btn.dataset.tab;
              fish.highlightedPart = null;
            } else {
              fish.highlightedPart = null;
            }
          });

          // Deselect active category when switching laws to avoid visual clutter
          if (activeCategory) {
            activeCategory = null;
            if (typeof categoryCards !== 'undefined' && categoryCards) categoryCards.forEach(c => c.classList.remove('active'));
            if (typeof explanationBox !== 'undefined' && explanationBox) explanationBox.classList.add('hidden');
          }
        });
      });
    }

    // Day/Night buttons (Mâu thuẫn)
    if (typeof btnModeDay !== 'undefined' && btnModeDay) {
      btnModeDay.addEventListener('click', () => {
        isDay = true;
        btnModeDay.classList.add('active');
        if (typeof btnModeNight !== 'undefined' && btnModeNight) btnModeNight.classList.remove('active');
        if (typeof timeModeVal !== 'undefined' && timeModeVal) timeModeVal.textContent = "Ban Ngày";
        targetOxygen = 100;
        fishes.forEach(fish => fish.struggleFrequency = 3);
        updateEnvDescription();
      });
    }

    if (typeof btnModeNight !== 'undefined' && btnModeNight) {
      btnModeNight.addEventListener('click', () => {
        isDay = false;
        btnModeNight.classList.add('active');
        if (typeof btnModeDay !== 'undefined' && btnModeDay) btnModeDay.classList.remove('active');
        if (typeof timeModeVal !== 'undefined' && timeModeVal) timeModeVal.textContent = "Ban Đêm";
        targetOxygen = 15;
        fishes.forEach(fish => fish.struggleFrequency = 4);
        updateEnvDescription();
      });
    }

    // Slider khí độc (Lượng - Chất)
    if (typeof toxicSlider !== 'undefined' && toxicSlider) {
      toxicSlider.addEventListener('input', () => {
        const val = parseInt(toxicSlider.value);
        if (typeof toxicVal !== 'undefined' && toxicVal) toxicVal.textContent = `${val}%`;
        fishes.forEach(fish => fish.adjustToxicLevel(val - fish.toxicLevel));
      });
    }

    // Nút cho ăn quá tải
    if (typeof btnOverfeed !== 'undefined' && btnOverfeed) {
      btnOverfeed.addEventListener('click', () => {
        fishes.forEach(fish => fish.adjustToxicLevel(20));
        if (fishes[0]) {
          if (typeof toxicSlider !== 'undefined' && toxicSlider) toxicSlider.value = fishes[0].toxicLevel;
          if (typeof toxicVal !== 'undefined' && toxicVal) toxicVal.textContent = `${fishes[0].toxicLevel}%`;
        }
      });
    }

    // Timeline Fast-Forward (Phủ định)
    if (typeof btnTimelineForward !== 'undefined' && btnTimelineForward) {
      btnTimelineForward.addEventListener('click', () => {
        if (fishes.length > 0) {
          const currentStage = fishes[0].lifecycleStage;
          fishes.forEach((fish, idx) => {
            if (currentStage === 'adult') {
              fish.lifecycleStage = 'egg';
              fish.x = (idx + 0.5) * (width / 5) + (Math.random() - 0.5) * 30;
              fish.y = 40 + Math.random() * 20; // Trứng chìm dần từ trên xuống
            } else if (currentStage === 'egg') {
              fish.lifecycleStage = 'fry';
              fish.y = height - 100 + (Math.random() - 0.5) * 20;
              fish.fryParticles = [];
              for (let i = 0; i < 12; i++) {
                fish.fryParticles.push({
                  x: fish.x + (Math.random() - 0.5) * 80,
                  y: fish.y + (Math.random() - 0.5) * 80,
                  vx: (Math.random() - 0.5) * 2,
                  vy: (Math.random() - 0.5) * 2,
                  angle: Math.random() * Math.PI * 2,
                  wagTime: Math.random() * 10
                });
              }
            } else if (currentStage === 'fry') {
              fish.lifecycleStage = 'adult';
              fish.x = (idx + 0.5) * (width / 5);
              fish.y = height / 3 + (height * 2 / 3) / 2;
              fish.vx = (Math.random() - 0.5) * 1.5 + (fish.type === 'goldfish' ? 1.0 : 2.0);
              fish.vy = (Math.random() - 0.5) * 1.0;
              fish.evolveGeneration();
            }
          });

          silhouettes = []; // Xóa các bóng mờ cũ
          trajectoryPath = []; // Xóa vết cũ

          const leadingFish = fishes[0];
          if (typeof lifecycleStageVal !== 'undefined' && lifecycleStageVal) {
            if (leadingFish.lifecycleStage === 'egg') {
              lifecycleStageVal.textContent = `Ổ trứng (F${leadingFish.generation})`;
            } else if (leadingFish.lifecycleStage === 'fry') {
              lifecycleStageVal.textContent = `Cá con (F${leadingFish.generation})`;
            } else {
              lifecycleStageVal.textContent = `Trưởng thành (F${leadingFish.generation})`;

              if (typeof generationChart !== 'undefined' && generationChart) {
                // Thêm cột mới vào biểu đồ thế hệ
                const heightPercent = Math.min(100, 40 + (leadingFish.generation - 1) * 15);
                const newBar = document.createElement('div');
                newBar.className = 'chart-bar-item';
                newBar.innerHTML = `
                  <div class="chart-bar-wrapper">
                    <div class="chart-bar" style="height: ${heightPercent}%;"></div>
                  </div>
                  <div class="chart-bar-label">F${leadingFish.generation}</div>
                `;
                generationChart.appendChild(newBar);
              }
            }
          }
        }
      });
    }

    const btnTimelineReset = document.getElementById('btn-timeline-reset');
    if (typeof btnTimelineReset !== 'undefined' && btnTimelineReset) {
      btnTimelineReset.addEventListener('click', () => {
        if (fishes.length > 0) {
          fishes.forEach((fish, idx) => {
            fish.lifecycleStage = 'adult';
            fish.generation = 1;
            fish.scale = fish.baseScale;
            if (fish.type === 'tilapia') fish.segmentSpacing = 14 * fish.scale;
            else if (fish.type === 'grass_carp') fish.segmentSpacing = 17 * fish.scale;
            else if (fish.type === 'snakehead') fish.segmentSpacing = 19 * fish.scale;
            else if (fish.type === 'silver_carp') fish.segmentSpacing = 16 * fish.scale;
            else fish.segmentSpacing = 15 * fish.scale;
            fish.x = (idx + 0.5) * (width / 5);
            fish.y = height / 3 + (height * 2 / 3) / 2;
            fish.vx = (Math.random() - 0.5) * 1.5 + (fish.type === 'goldfish' ? 1.0 : 2.0);
            fish.vy = (Math.random() - 0.5) * 1.0;
          });

          silhouettes = []; // Xóa bóng mờ
          trajectoryPath = []; // Xóa vết cũ

          if (typeof lifecycleStageVal !== 'undefined' && lifecycleStageVal) {
            lifecycleStageVal.textContent = `Trưởng thành (F1)`;
          }
          if (typeof generationChart !== 'undefined' && generationChart) {
            generationChart.innerHTML = `
              <div class="chart-bar-item">
                <div class="chart-bar-wrapper">
                  <div class="chart-bar" style="height: 40%;" data-height="40"></div>
                </div>
                <div class="chart-bar-label">F1</div>
              </div>
            `;
          }
        }
      });
    }

    // Weather widget click (Tất nhiên & Ngẫu nhiên)
    const weatherWidget = document.getElementById('weather-widget');
    const weatherIcon = document.getElementById('weather-icon');
    const weatherStatusText = document.getElementById('weather-status-text');

    if (weatherWidget) {
      weatherWidget.addEventListener('click', () => {
        weatherState = (weatherState === 'sunny' ? 'rainy' : 'sunny');
        if (weatherState === 'sunny') {
          if (weatherIcon) weatherIcon.textContent = "☀";
          if (weatherStatusText) weatherStatusText.textContent = "Nắng Ráo (28°C)";
        } else {
          if (weatherIcon) weatherIcon.textContent = "🌧";
          if (weatherStatusText) weatherStatusText.textContent = "Mưa Rào (22°C)";
        }
        showPhilosophicalPopup('weather');
        updateEnvDescription();
      });
    }

    // Close floating popup
    const pondPopup = document.getElementById('pond-popup');
    const btnClosePopup = document.getElementById('btn-close-popup');
    if (btnClosePopup) {
      btnClosePopup.addEventListener('click', () => {
        if (pondPopup) pondPopup.classList.add('hidden');
        activeCategory = null;
        if (typeof categoryCards !== 'undefined' && categoryCards) categoryCards.forEach(c => c.classList.remove('active'));
        if (typeof explanationBox !== 'undefined' && explanationBox) explanationBox.classList.add('hidden');
        syncFishHighlightToActiveLaw();
      });
    }

    // 6 Categories interaction handlers
    if (typeof categoryCards !== 'undefined' && categoryCards) {
      categoryCards.forEach(card => {
        card.addEventListener('click', () => {
          const cat = card.dataset.category;

          if (activeCategory === cat) {
            activeCategory = null;
            card.classList.remove('active');
            if (typeof explanationBox !== 'undefined' && explanationBox) explanationBox.classList.add('hidden');
            if (typeof pondPopup !== 'undefined' && pondPopup) pondPopup.classList.add('hidden');
            syncFishHighlightToActiveLaw();
          } else {
            // Find corresponding interactive entity
            let matchedEntity = null;
            if (cat === 'rieng-chung') matchedEntity = 'fish';
            else if (cat === 'banchat-hientuong') matchedEntity = 'aerator';
            else if (cat === 'nguyennhan-ketqua') matchedEntity = 'waste';
            else if (cat === 'tatnhien-ngauhien') matchedEntity = 'weather';
            else if (cat === 'noidung-hinhthuc') matchedEntity = 'net';
            else if (cat === 'khamang-hienthuc') matchedEntity = 'bucket';

            if (matchedEntity) {
              showPhilosophicalPopup(matchedEntity);
            }
          }
        });
      });
    }

    if (typeof closeExplanationBtn !== 'undefined' && closeExplanationBtn) {
      closeExplanationBtn.addEventListener('click', () => {
        activeCategory = null;
        if (typeof categoryCards !== 'undefined' && categoryCards) categoryCards.forEach(c => c.classList.remove('active'));
        if (typeof explanationBox !== 'undefined' && explanationBox) explanationBox.classList.add('hidden');
        if (typeof pondPopup !== 'undefined' && pondPopup) pondPopup.classList.add('hidden');
        syncFishHighlightToActiveLaw();
      });
    }

    // Đóng bảng giải thích khi click ra ngoài
    document.addEventListener('click', (e) => {
      if (e.target.closest('#pond-popup') ||
        e.target.closest('#category-explanation-box') ||
        e.target.closest('.category-card') ||
        e.target.closest('.weather-widget') ||
        e.target.closest('.env-desc-widget') ||
        e.target.closest('.philo-tabs') ||
        e.target.closest('.quick-controls') ||
        e.target.closest('.action-buttons')) {
        return;
      }

      if (activeCategory) {
        activeCategory = null;
        if (typeof pondPopup !== 'undefined' && pondPopup) pondPopup.classList.add('hidden');
        if (typeof explanationBox !== 'undefined' && explanationBox) explanationBox.classList.add('hidden');
        if (typeof categoryCards !== 'undefined' && categoryCards) categoryCards.forEach(c => c.classList.remove('active'));
        syncFishHighlightToActiveLaw();
      }
    });
  }

  function syncFishHighlightToActiveLaw() {
    if (fishes.length === 0) return;
    const activeTabBtn = document.querySelector('.philo-tab-btn.active');
    fishes.forEach((fish, idx) => {
      if (idx === 0 && activeTabBtn) {
        const tabName = activeTabBtn.dataset.tab;
        fish.highlightedPart = null;
      } else {
        fish.highlightedPart = null;
      }
    });
  }

  // 8. Philosophy Leap Listener (State Transitions)
  function setupPhilosophyLeapListener() {
    window.addEventListener('philosophy-leap', (e) => {
      const data = e.detail;

      triggerWaterRipple(data.x, data.y);

      if (fishes[0]) {
        if (typeof toxicSlider !== 'undefined' && toxicSlider) toxicSlider.value = fishes[0].toxicLevel;
        if (typeof toxicVal !== 'undefined' && toxicVal) toxicVal.textContent = `${Math.round(fishes[0].toxicLevel)}%`;
      }

      for (let i = 0; i < 35; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 3;
        leapParticles.push({
          x: data.x,
          y: data.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 5 + 2.5,
          color: data.color,
          alpha: 1.0,
          decay: Math.random() * 0.02 + 0.015
        });
      }

      const container = document.getElementById('canvas-container');
      container.style.boxShadow = `inset 0 0 110px ${data.color}`;
      setTimeout(() => {
        container.style.boxShadow = 'none';
      }, 700);
    });
  }

  // 9. Biological Rebirth Evolution Listener (Silhouette Caching)
  function setupEvolutionListener() {
    window.addEventListener('fish-evolved', (e) => {
      const data = e.detail;

      if (fishes[0]) {
        const fish = fishes[0];
        const segsSnapshot = fish.segments.map(seg => ({ x: seg.x, y: seg.y, angle: seg.angle }));
        const widthsSnapshot = [...fish.widths];
        const stateColor = fish.getWaterState().secondary;

        silhouettes.push({
          segments: segsSnapshot,
          widths: widthsSnapshot,
          scale: fish.scale * 0.92,
          color: stateColor,
          alpha: 0.9,
          generation: fish.generation - 1
        });

        for (let i = 0; i < 40; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * 50;
          const px = fish.x + Math.cos(angle) * dist;
          const py = fish.y + Math.sin(angle) * dist;
          leapParticles.push({
            x: px,
            y: py,
            vx: Math.cos(angle) * (Math.random() * 2 + 1),
            vy: Math.sin(angle) * (Math.random() * 2 + 1),
            radius: Math.random() * 4 + 2,
            color: '#e040fb',
            alpha: 1.0,
            decay: Math.random() * 0.015 + 0.01
          });
        }
      }
    });
  }

  // 10. Resize Canvas Handler
  function resizeCanvas() {
    width = canvas.width = container.clientWidth;
    height = canvas.height = container.clientHeight;

    const targetBubbleCount = Math.floor((width * height) / 28000);
    while (bubbles.length < targetBubbleCount) {
      bubbles.push(createBubble(true));
    }
    while (bubbles.length > targetBubbleCount) {
      bubbles.pop();
    }

    // Update interactive objects coordinates and sizes
    aerator.x = 80;
    aerator.y = height - 150;
    aerator.width = 90;
    aerator.height = 90;

    wastePile.x = width / 2 - 120;
    wastePile.y = height - 40;
    wastePile.width = 160;
    wastePile.height = 40;

    netEnclosure.x = width - 180;
    netEnclosure.y = height - 180;
    netEnclosure.width = 180;
    netEnclosure.height = 180;

    seedlingBucket.x = width - 290;
    seedlingBucket.y = height / 3 - 70; // bucket sits on land right at water line
    seedlingBucket.width = 70;
    seedlingBucket.height = 70;
  }

  // 11. Draw dynamic labels connecting to fish segments (only drawn when NO Category is active to keep screen clean)
  function drawPhilosophyLabels(ctx) {
    if (currentTheme === 'ocean') return; // Duy vật hides conceptual labels
    if (activeCategory || fishes.length === 0) return;
    const fish = fishes[0];
    if (fish.lifecycleStage !== 'adult') return;
    const head = fish.segments[0];
    const body = fish.segments[4];
    const tail = fish.segments[8];

    const stateColors = fish.getWaterState();

    const labels = [
      {
        title: "Quy luật Mâu thuẫn",
        subtitle: "Đấu tranh Đồng hóa - Dị hóa (Đầu)",
        target: head,
        offsetX: -160,
        offsetY: -130,
        color: '#ff1744'
      },
      {
        title: "Quy luật Lượng - Chất",
        subtitle: `Trạng thái: ${stateColors.name} (Thân)`,
        target: body,
        offsetX: 160,
        offsetY: -95,
        color: stateColors.secondary
      },
      {
        title: "Quy luật Phủ định của Phủ định",
        subtitle: `Thế hệ: F${fish.generation} - Quỹ đạo Xoắn ốc (Đuôi)`,
        target: tail,
        offsetX: -180,
        offsetY: 130,
        color: '#e040fb'
      }
    ];

    labels.forEach(label => {
      const lx = label.target.x + label.offsetX;
      const ly = label.target.y + label.offsetY;

      ctx.save();

      ctx.beginPath();
      ctx.moveTo(label.target.x, label.target.y);
      const elbowX = lx + (label.offsetX > 0 ? -25 : 25);
      ctx.lineTo(elbowX, ly);
      ctx.lineTo(lx, ly);
      ctx.strokeStyle = label.color;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 6;
      ctx.shadowColor = label.color;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(label.target.x, label.target.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = label.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const padX = 14;
      ctx.font = "bold 12px 'Outfit', sans-serif";
      const titleWidth = ctx.measureText(label.title).width;
      ctx.font = "10px 'Outfit', sans-serif";
      const subtitleWidth = ctx.measureText(label.subtitle).width;
      const cardW = Math.max(titleWidth, subtitleWidth) + padX * 2;
      const cardH = 38;
      const cardX = lx - (label.offsetX > 0 ? 0 : cardW);
      const cardY = ly - cardH / 2;

      ctx.fillStyle = 'rgba(8, 16, 32, 0.82)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';

      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      if (label.offsetX > 0) {
        ctx.roundRect(cardX, cardY, 4, cardH, [8, 0, 0, 8]);
      } else {
        ctx.roundRect(cardX + cardW - 4, cardY, 4, cardH, [0, 8, 8, 0]);
      }
      ctx.fillStyle = label.color;
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 11.5px 'Outfit', sans-serif";
      ctx.fillText(label.title, cardX + padX, cardY + 16);

      ctx.fillStyle = '#90a4ae';
      ctx.font = "italic 9.5px 'Outfit', sans-serif";
      ctx.fillText(label.subtitle, cardX + padX, cardY + 28);

      ctx.restore();
    });
  }

  // 12. Draw active Category overlays on canvas
  function drawCategoryHighlights(timestamp) {
    if (!activeCategory || fishes.length === 0) return;
    const fish = fishes[0];

    switch (activeCategory) {
      case 'rieng-chung':
        // Highlight Cái chung - Pulsing border around the whole canvas
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
        ctx.lineWidth = 6 + Math.sin(timestamp * 0.005) * 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00e5ff';
        ctx.strokeRect(0, 0, width, height);

        // Draw connecting overlay label pointing to background (centered top)
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#00e5ff';
        ctx.font = "bold 11.5px 'Outfit', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText("AO NƯỚC (CÁI CHUNG) - Môi trường sống bao quát", width / 2, 35);
        ctx.restore();
        break;

      case 'nguyennhan-ketqua':
        // Highlight Nguyên nhân - Draw glowing pulse around all food pellets
        foods.forEach(pellet => {
          ctx.save();
          ctx.strokeStyle = '#ff9100';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 2]);
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ff9100';
          ctx.beginPath();
          ctx.arc(pellet.x, pellet.y, pellet.radius + 8 + Math.sin(timestamp * 0.008) * 3, 0, Math.PI * 2);
          ctx.stroke();

          // Draw text label next to pellet
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffb74d';
          ctx.font = "italic 9px 'Outfit', sans-serif";
          ctx.fillText("Nguyên nhân (Mồi)", pellet.x + 12, pellet.y + 3);
          ctx.restore();
        });

        // Highlight Kết quả - pulse around active fish
        ctx.save();
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(fish.x, fish.y, 45 * fish.scale, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#69f0ae';
        ctx.font = "italic 9px 'Outfit', sans-serif";
        ctx.fillText("Kết quả (Sinh trưởng & Bước nhảy)", fish.x + 45 * fish.scale + 8, fish.y + 3);
        ctx.restore();
        break;

      case 'tatnhien-ngauhien':
        // Highlight boundary reflection (Tất nhiên) - chỉ khoanh vùng nước (2/3 dưới)
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 23, 68, 0.4)';
        ctx.lineWidth = 4;
        const waterY = height / 3;
        ctx.strokeRect(0, waterY, width, height - waterY);
        ctx.fillStyle = 'rgba(255, 23, 68, 0.85)';
        ctx.font = "bold 11.5px 'Outfit', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText("BIÊN AO (TẤT NHIÊN) - Cá chạm vào buộc phải quay lại", width / 2, height - 130);
        ctx.restore();

        // Highlight trajectoryPath neon line (Ngẫu nhiên)
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#e040fb';
        ctx.strokeStyle = '#e040fb';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (trajectoryPath.length > 1) {
          ctx.moveTo(trajectoryPath[0].x, trajectoryPath[0].y);
          for (let i = 1; i < trajectoryPath.length; i++) {
            ctx.lineTo(trajectoryPath[i].x, trajectoryPath[i].y);
          }
        }
        ctx.stroke();

        // Label next to trail
        if (trajectoryPath.length > 15) {
          const pt = trajectoryPath[Math.floor(trajectoryPath.length / 2)];
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ea80fc';
          ctx.font = "italic 9.5px 'Outfit', sans-serif";
          ctx.fillText("Quỹ đạo bơi (Ngẫu nhiên)", pt.x + 12, pt.y);
        }
        ctx.restore();
        break;

      case 'noidung-hinhthuc':
        if (fish.lifecycleStage !== 'adult') break;
        // Draw highlighted backbone/spinal (Nội dung) vs Body sections (Hình thức)
        ctx.save();
        // Highlight backbone
        ctx.beginPath();
        ctx.moveTo(fish.segments[0].x, fish.segments[0].y);
        for (let i = 1; i < fish.numSegments; i++) {
          ctx.lineTo(fish.segments[i].x, fish.segments[i].y);
        }
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6 * fish.scale;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffffff';
        ctx.stroke();

        // Label
        const centerSeg = fish.segments[3];
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = "bold 9px 'Outfit', sans-serif";
        ctx.fillText("NỘI DUNG (Cột xương/Sinh lực)", centerSeg.x + 20, centerSeg.y - 12);
        ctx.restore();
        break;

      case 'banchat-hientuong':
        // Draw mathematical digital matrix grid (Bản chất)
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
        ctx.lineWidth = 1;
        const gridSize = 45;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }
        ctx.restore();
        break;

      case 'khamang-hienthuc':
        // Draw possibility bridge (Dashed line from head to food target)
        if (fish.foodTarget) {
          const target = fish.foodTarget;
          const headSeg = fish.segments[0];
          ctx.save();
          ctx.strokeStyle = '#e040fb';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#e040fb';
          ctx.beginPath();
          ctx.moveTo(headSeg.x, headSeg.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();

          // Text label over path
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ea80fc';
          ctx.font = "italic 9.5px 'Outfit', sans-serif";
          ctx.fillText("Khả năng hấp thụ (Cầu nối)", (headSeg.x + target.x) / 2 + 10, (headSeg.y + target.y) / 2);
          ctx.restore();
        }
        break;
    }
  }

  // 12. Show floating Glassmorphic Popup
  const pondPopup = document.getElementById('pond-popup');
  const popupBadge = document.getElementById('popup-badge');
  const popupTitle = document.getElementById('popup-title');
  const popupText = document.getElementById('popup-text');

  const entityData = {
    'fish': {
      badge: "Cái chung, Cái riêng & Cái đơn nhất",
      title: "Con Cá cụ thể",
      text: "Con cá này là Cái riêng (có cân nặng, vết sẹo đơn nhất). Nhưng nó mang Cái chung của loài cá là phải thở bằng mang. Ao ô nhiễm thì cái riêng hay cái chung đều chịu chung số phận.",
      category: 'rieng-chung',
      x: () => fishes[0] ? fishes[0].x : width / 2,
      y: () => fishes[0] ? fishes[0].y : height / 2
    },
    'aerator': {
      badge: "Bản chất & Hiện tượng",
      title: "Máy sục khí Oxy đang tắt & Cá ngớp nước",
      text: "Cá ngớp trên mặt nước chỉ là Hiện tượng bề nổi. Bản chất là do thiếu Oxy dưới đáy ao. Muốn giải quyết tận gốc phải bật máy sục khí (tác động vào bản chất), chứ không phải vớt cá lên mặt nước.",
      category: 'banchat-hientuong',
      x: () => aerator.x + aerator.width / 2,
      y: () => aerator.y - 40
    },
    'waste': {
      badge: "Nguyên nhân & Kết quả",
      title: "Đống thức ăn thừa đáy ao",
      text: "Thức ăn thừa (Nguyên nhân) sinh ra khí độc làm cá bệnh (Kết quả). Cá bệnh lại thải ra nhiều mầm bệnh hơn (Kết quả biến thành Nguyên nhân mới).",
      category: 'nguyennhan-ketqua',
      x: () => wastePile.x + wastePile.width / 2,
      y: () => wastePile.y - 45
    },
    'weather': {
      badge: "Tất nhiên & Ngẫu nhiên",
      title: "Dự báo thời tiết (Đám mây mưa)",
      text: "Cá đói thì Tất nhiên phải ăn để lớn. Nhưng một trận mưa rào đột ngột làm tụt nhiệt độ ao là Ngẫu nhiên. Người nuôi cá phải quản lý cái tất nhiên nhưng luôn có phương án dự phòng cho cái ngẫu nhiên.",
      category: 'tatnhien-ngauhien',
      x: () => 180,
      y: () => 100
    },
    'net': {
      badge: "Nội dung & Hình thức",
      title: "Lưới quây ao nuôi cá lóc",
      text: "Nội dung là nuôi loài cá dữ, mật độ dày. Hình thức bắt buộc ao phải có lưới cao, hệ thống xả thải mạnh. Nội dung nào thì hình thức ấy.",
      category: 'noidung-hinhthuc',
      x: () => netEnclosure.x - 160,
      y: () => netEnclosure.y + 40
    },
    'bucket': {
      badge: "Khả năng & Hiện thực",
      title: "Thùng cá giống mới thả",
      text: "Cá giống lúc này là Hiện thực. Nó ẩn chứa 2 Khả năng: Trở thành 2 tấn cá thương phẩm mang lại lợi nhuận, hoặc biến thành số 0 nếu ao bị dịch bệnh. Việc chăm sóc của bạn sẽ quyết định khả năng nào thành hiện thực.",
      category: 'khamang-hienthuc',
      x: () => seedlingBucket.x - 180,
      y: () => seedlingBucket.y - 50
    }
  };

  let activePopupFish = null;

  function showPhilosophicalPopup(entity, targetFish = null) {
    const data = entityData[entity];
    if (!data) return;

    activePopupFish = targetFish || fishes[0];

    popupBadge.textContent = data.badge;
    if (entity === 'fish' && activePopupFish) {
      popupTitle.textContent = `Chú ${activePopupFish.colors.name} cụ thể`;
      let text = '';
      if (activePopupFish.type === 'carp') text = "<b>Cái riêng</b> của con Cá Chép này là tổng thể của vảy vàng đồng, cặp râu và lưng gù. <b>Cái đơn nhất</b> là tọa độ dòng nước nó đang bơi và kích thước chính xác của nó.";
      else if (activePopupFish.type === 'snakehead') text = "<b>Cái riêng</b> của con Cá Lóc này là dáng hình ống, hoa văn rằn ri và bản tính rình mồi. <b>Cái đơn nhất</b> là mục tiêu cụ thể mà radar của nó vừa khóa.";
      else if (activePopupFish.type === 'tilapia') text = "<b>Cái riêng</b> của con Cá Rô Phi này là vây lưng có gai nhọn và thân dẹt. <b>Cái đơn nhất</b> là lượng khí độc tuyệt đối mà cơ thể nó đang tích tụ lúc này.";
      else if (activePopupFish.type === 'grass_carp') text = "<b>Cái riêng</b> của Cá Trắm Cỏ này là hình dáng suôn mượt và không râu. <b>Cái đơn nhất</b> là khoảng cách chính xác tính bằng milimet từ nó đến đống thức ăn.";
      else if (activePopupFish.type === 'silver_carp') text = "<b>Cái riêng</b> của con Cá Mè này là chiếc đầu quá khổ và đuôi xẻ sâu. <b>Cái đơn nhất</b> là tọa độ phân bố ngẫu nhiên của từng đốm hoa văn trên thân nó.";
      
      popupText.innerHTML = text + "<br/><br/>Tuy nhiên, nó mang <b>Cái chung</b> của sinh giới: Cần oxy hô hấp và tuần hoàn sinh tử. Nếu ao ô nhiễm, Cái chung bị hủy hoại kéo theo sự tan biến của mọi Cái riêng và Cái đơn nhất.";
    } else {
      popupTitle.textContent = data.title;
      popupText.innerHTML = typeof data.text === 'function' ? data.text() : data.text;
    }

    categoryCards.forEach(card => {
      if (card.dataset.category === data.category) {
        card.classList.add('active');
        activeCategory = data.category;

        const info = categoryExplanations[data.category];
        explanationTitle.textContent = info.title;
        explanationText.innerHTML = info.text;
        explanationBox.classList.remove('hidden');
      } else {
        card.classList.remove('active');
      }
    });

    fishes.forEach(fish => {
      if (data.category === 'rieng-chung') {
        fish.highlightedPart = (fish === activePopupFish) ? 'all' : null;
      } else {
        fish.highlightedPart = null;
      }
    });

    pondPopup.classList.remove('hidden');

    const popWidth = pondPopup.offsetWidth || 340;
    const popHeight = pondPopup.offsetHeight || 180;

    let posX = 0;
    let posY = 0;

    if (entity === 'fish' && activePopupFish) {
      posX = activePopupFish.x - popWidth / 2;
      posY = activePopupFish.y + 60; // Dưới con cá
      if (posY + popHeight > height - 10) {
        posY = activePopupFish.y - popHeight - 60; // Nổi lên trên nếu chạm đáy
      }
    } else if (entity === 'aerator') {
      posX = aerator.x + 120; // Bên phải máy sục khí
      posY = aerator.y + 30;
    } else if (entity === 'waste') {
      posX = wastePile.x + wastePile.width / 2 - popWidth / 2;
      posY = wastePile.y - popHeight - 40; // Nằm hẳn lên trên đống rác
    } else if (entity === 'weather') {
      const weatherWidget = document.getElementById('weather-widget');
      const envWidget = document.getElementById('env-desc-widget');
      if (weatherWidget) {
        // Nằm bên phải của widget thời tiết và bảng sinh thái để không bị che
        const rect = weatherWidget.getBoundingClientRect();
        const containerRect = pondPopup.parentElement.getBoundingClientRect();
        let rightEdge = rect.right;
        if (envWidget) {
          rightEdge = Math.max(rightEdge, envWidget.getBoundingClientRect().right);
        }
        posX = (rightEdge - containerRect.left) + 20;
        posY = (rect.top - containerRect.top);
      } else {
        posX = 300;
        posY = 20;
      }
    } else if (entity === 'net') {
      posX = netEnclosure.x - popWidth - 30; // Hiện bên trái lưới
      posY = netEnclosure.y - 30;
    } else if (entity === 'bucket') {
      posX = seedlingBucket.x - popWidth - 30; // Hiện bên trái thùng cá con
      posY = seedlingBucket.y - 20;
    } else {
      posX = data.x();
      posY = data.y();
    }

    // Đảm bảo không bị tràn khỏi màn hình canvas
    let finalLeft = Math.max(10, Math.min(width - popWidth - 10, posX));
    let finalTop = Math.max(10, Math.min(height - popHeight - 10, posY));

    pondPopup.style.left = `${finalLeft}px`;
    pondPopup.style.top = `${finalTop}px`;
  }

  // Draw 6 Categories Interactive Entities on Canvas
  function drawInteractiveObjects(ctx, timestamp) {
    // 1. Draw Aerator (Máy sục khí)
    ctx.save();
    ctx.fillStyle = 'rgba(55, 71, 79, 0.85)';
    ctx.strokeStyle = aeratorOn ? '#00e5ff' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = aeratorOn ? 10 : 0;
    ctx.shadowColor = '#00e5ff';

    ctx.beginPath();
    ctx.roundRect(aerator.x, aerator.y + 30, 45, 45, 6);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(aerator.x + 45, aerator.y + 52);
    ctx.lineTo(aerator.x + 65, aerator.y + 52);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 4;
    ctx.stroke();

    if (aeratorOn) {
      aerator.angle += 0.12;
      if (Math.random() < 0.45) {
        bubbles.push({
          x: aerator.x + 65 + (Math.random() - 0.5) * 15,
          y: aerator.y + 52,
          radius: Math.random() * 3.5 + 1.5,
          speed: Math.random() * 2 + 1.5,
          wiggle: Math.random() * 100,
          wiggleSpeed: Math.random() * 0.05 + 0.02,
          wiggleRange: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.3
        });
      }
    }

    ctx.translate(aerator.x + 65, aerator.y + 52);
    ctx.rotate(aerator.angle);

    ctx.fillStyle = 'rgba(200,200,200,0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = aeratorOn ? '#00e5ff' : 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 3;
    const blades = 6;
    for (let b = 0; b < blades; b++) {
      const bAng = (b / blades) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(bAng) * 25, Math.sin(bAng) * 25);
      ctx.stroke();

      ctx.fillStyle = aeratorOn ? '#00b0ff' : 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.arc(Math.cos(bAng) * 25, Math.sin(bAng) * 25, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. Draw Food Waste Pile (Đống thức ăn thừa)
    ctx.save();
    ctx.shadowBlur = hoveredObject === 'waste' ? 12 : 6;
    ctx.shadowColor = '#4caf50';
    ctx.fillStyle = 'rgba(109, 76, 65, 0.85)';
    ctx.strokeStyle = 'rgba(76, 175, 80, 0.4)';
    ctx.lineWidth = 1.5;

    const toxicScale = 0.6 + (fishes[0] ? fishes[0].toxicLevel / 100 : 0) * 1.5;

    ctx.beginPath();
    ctx.ellipse(wastePile.x + 48 * toxicScale, height - 16 * toxicScale, 40 * toxicScale, 19 * toxicScale, 0, 0, Math.PI * 2);
    ctx.ellipse(wastePile.x + 112 * toxicScale, height - 11 * toxicScale, 51 * toxicScale, 16 * toxicScale, 0, 0, Math.PI * 2);
    ctx.ellipse(wastePile.x + 80 * toxicScale, height - 21 * toxicScale, 61 * toxicScale, 22 * toxicScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (Math.random() < 0.08) {
      tailParticles.push({
        x: wastePile.x + (40 + Math.random() * 60) * toxicScale,
        y: height - 25 * toxicScale,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.5 - 0.2,
        radius: Math.random() * 2 + 1,
        color: '#4caf50',
        alpha: 0.8,
        decay: 0.012
      });
    }
    ctx.restore();

    // 3. Draw Net Enclosure (Lưới quây ao nuôi cá lóc)
    ctx.save();
    ctx.strokeStyle = hoveredObject === 'net' ? '#ea80fc' : 'rgba(224, 64, 251, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.shadowBlur = hoveredObject === 'net' ? 10 : 0;
    ctx.shadowColor = '#e040fb';

    ctx.beginPath();
    ctx.moveTo(netEnclosure.x, height);
    ctx.lineTo(netEnclosure.x, netEnclosure.y);
    ctx.lineTo(width, netEnclosure.y);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.fillStyle = 'rgba(100,100,100,0.8)';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(netEnclosure.x, height);
    ctx.lineTo(netEnclosure.x, netEnclosure.y - 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(netEnclosure.x, netEnclosure.y - 10, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(224, 64, 251, 0.2)';
    ctx.strokeStyle = 'rgba(224, 64, 251, 0.4)';
    ctx.lineWidth = 1;
    const fishTime = timestamp * 0.001;
    for (let f = 0; f < 8; f++) {
      const col = f % 3;
      const row = Math.floor(f / 3);
      const fx = netEnclosure.x + 40 + col * 45 + Math.sin(fishTime + f * 1.5) * 15;
      const fy = netEnclosure.y + 50 + row * 40 + Math.cos(fishTime * 0.8 + f * 2) * 15;
      const fAng = Math.cos(fishTime + f * 1.5);

      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(fAng * 0.4 + (f === 0 ? Math.PI : 0));

      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(-15, -3);
      ctx.lineTo(-15, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // 4. Draw Seedling Bucket (Thùng cá giống)
    ctx.save();
    ctx.fillStyle = 'rgba(2, 119, 189, 0.8)';
    ctx.strokeStyle = hoveredObject === 'bucket' ? '#00e5ff' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = hoveredObject === 'bucket' ? 10 : 0;
    ctx.shadowColor = '#00e5ff';

    ctx.beginPath();
    ctx.roundRect(seedlingBucket.x, seedlingBucket.y, seedlingBucket.width, seedlingBucket.height, 4);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(seedlingBucket.x, seedlingBucket.y + 20);
    ctx.lineTo(seedlingBucket.x + seedlingBucket.width, seedlingBucket.y + 20);
    ctx.moveTo(seedlingBucket.x, seedlingBucket.y + 50);
    ctx.lineTo(seedlingBucket.x + seedlingBucket.width, seedlingBucket.y + 50);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const bucketTime = timestamp * 0.003;
    for (let f = 0; f < 3; f++) {
      const fryX = seedlingBucket.x + 15 + f * 18 + Math.sin(bucketTime + f) * 3;
      const fryY = seedlingBucket.y + 12 + f * 12 + Math.cos(bucketTime * 0.5 + f) * 2;
      ctx.beginPath();
      ctx.ellipse(fryX, fryY, 5, 2.5, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 5. Active Category pulses
    if (activeCategory) {
      const currentCat = activeCategory;
      let targetObj = null;
      let objColor = '#00e5ff';
      if (currentCat === 'banchat-hientuong') {
        targetObj = aerator;
        objColor = '#ff1744';
      } else if (currentCat === 'nguyennhan-ketqua') {
        targetObj = wastePile;
        objColor = '#ff9100';
      } else if (currentCat === 'noidung-hinhthuc') {
        targetObj = netEnclosure;
        objColor = '#e040fb';
      } else if (currentCat === 'khamang-hienthuc') {
        targetObj = seedlingBucket;
        objColor = '#00e5ff';
      } else if (currentCat === 'tatnhien-ngauhien') {
        const widget = document.getElementById('weather-widget');
        if (widget) {
          widget.style.borderColor = `rgba(0, 229, 255, ${0.5 + Math.sin(timestamp * 0.005) * 0.4})`;
          widget.style.boxShadow = `0 4px 20px rgba(0, 229, 255, 0.3)`;
        }
      }

      if (targetObj) {
        ctx.save();
        ctx.strokeStyle = objColor;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = objColor;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        const pulse = Math.sin(timestamp * 0.005) * 6;
        ctx.roundRect(
          targetObj.x - 6 - pulse / 2,
          targetObj.y - 6 - pulse / 2,
          targetObj.width + 12 + pulse,
          targetObj.height + 12 + pulse,
          8
        );
        ctx.stroke();
        ctx.restore();
      }
    }

    // 6. Draw Hover Tooltips
    if (hoveredObject) {
      let labelText = "";
      let lx = 0, ly = 0;

      if (hoveredObject === 'fish') {
        const fishName = hoveredFish ? hoveredFish.colors.name : "Cá";
        labelText = `${fishName}: Cái chung, Cái riêng & Cái đơn nhất`;
        lx = hoveredFish ? hoveredFish.x : width / 2;
        ly = hoveredFish ? hoveredFish.y - 50 : height / 2;
      } else if (hoveredObject === 'aerator') {
        labelText = aeratorOn ? "Click: Tắt máy sục khí (Bản chất & Hiện tượng)" : "Click: Bật máy sục khí (Bản chất & Hiện tượng)";
        lx = aerator.x + aerator.width / 2;
        ly = aerator.y - 12;
      } else if (hoveredObject === 'waste') {
        labelText = "Đống thức ăn thừa: Nguyên nhân & Kết quả";
        lx = wastePile.x + wastePile.width / 2;
        ly = wastePile.y - 12;
      } else if (hoveredObject === 'net') {
        labelText = "Lưới quây nuôi cá dữ: Nội dung & Hình thức";
        lx = netEnclosure.x + netEnclosure.width / 2;
        ly = netEnclosure.y - 12;
      } else if (hoveredObject === 'bucket') {
        labelText = "Thùng cá giống mới: Khả năng & Hiện thực";
        lx = seedlingBucket.x + seedlingBucket.width / 2;
        ly = seedlingBucket.y - 12;
      }

      if (labelText) {
        ctx.save();
        ctx.font = "500 10.5px 'Outfit', sans-serif";
        const txtW = ctx.measureText(labelText).width;

        ctx.fillStyle = 'rgba(8, 16, 32, 0.85)';
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(lx - txtW / 2 - 8, ly - 18, txtW + 16, 22, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 0;
        ctx.fillText(labelText, lx, ly - 3);
        ctx.restore();
      }
    }
  }

  // Helper to draw Algae plants
  function drawAlgae(timestamp) {
    ctx.save();
    algaeList.forEach(plant => {
      const sway = Math.sin(timestamp * 0.0015 + plant.swayOffset) * 8;
      ctx.strokeStyle = 'rgba(76, 175, 80, 0.6)';
      ctx.lineWidth = plant.width;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#4caf50';

      ctx.beginPath();
      ctx.moveTo(plant.x, height);
      ctx.quadraticCurveTo(plant.x + sway * 0.5, height - plant.height * 0.5, plant.x + sway, height - plant.height);
      ctx.stroke();
    });
    ctx.restore();
  }

  // Cập nhật và vẽ vi khuẩn ở đáy ao (giới hạn trong 2/3 vùng nước phía dưới)
  function updateAndDrawBacteria() {
    ctx.save();

    // Nhiệt độ nước ảnh hưởng trực tiếp đến tốc độ di động và sự dao động của vi khuẩn
    const tempMult = waterTemp / 24;

    bacteriaList.forEach(b => {
      if (!fishes[0] || !fishes[0].isDead) {
        b.x += b.vx * tempMult;
        b.y += b.vy * tempMult;
      }
      b.wiggle += 0.03 * tempMult;
      b.x += Math.sin(b.wiggle) * 0.15;

      if (b.x < 0) b.x = width;
      if (b.x > width) b.x = 0;

      const waterY = height / 3;
      if (b.y < waterY) b.y = height;
      if (b.y > height) b.y = waterY;

      ctx.fillStyle = '#ff9800'; // Màu cam phát sáng phát tín hiệu nhiệt
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#ff9800';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // 15. Vẽ cấu trúc ao hồ (1/3 phía trên là bầu trời, 2/3 phía dưới là nước)
  function drawPondStructure(ctx, timestamp) {
    const waterY = height / 3;

    // 1. Vẽ bầu trời (1/3 phía trên)
    let skyGrad = ctx.createLinearGradient(0, 0, 0, waterY);
    if (currentTheme === 'cyber') {
      skyGrad.addColorStop(0, '#05000a');
      skyGrad.addColorStop(1, '#180227');
    } else if (currentTheme === 'pond') {
      if (isDay) {
        skyGrad.addColorStop(0, '#3a86c8'); // Bầu trời ngày nắng xanh sáng
        skyGrad.addColorStop(1, '#aedcfc');
      } else {
        skyGrad.addColorStop(0, '#020c0a'); // Bầu trời đêm tĩnh lặng tối sẫm
        skyGrad.addColorStop(1, '#0c221a');
      }
    } else { // ocean (Đại dương duy vật)
      skyGrad.addColorStop(0, '#020813');
      skyGrad.addColorStop(1, '#0b1d33');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, waterY);

    // 2. Vẽ Mặt Trời hoặc Mặt Trăng (nếu thuộc thế giới quan Biện chứng hoặc Khoa học)
    if (currentTheme !== 'ocean') {
      ctx.save();
      const sunMoonX = width * 3 / 4;
      const sunMoonY = height / 8;

      if (isDay) {
        // Vẽ Mặt Trời tỏa nắng rực rỡ
        const sunRadius = 24;
        let opacity = weatherState === 'rainy' ? 0.35 : 1.0; // Giảm độ sáng khi trời mưa bão

        ctx.globalAlpha = opacity;
        let sunGrad = ctx.createRadialGradient(sunMoonX, sunMoonY, 2, sunMoonX, sunMoonY, sunRadius * 2.2);
        sunGrad.addColorStop(0, '#ffffff');
        sunGrad.addColorStop(0.2, '#fff176');
        sunGrad.addColorStop(0.5, '#f57c00');
        sunGrad.addColorStop(1, 'rgba(245, 124, 0, 0)');

        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunMoonX, sunMoonY, sunRadius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Vẽ vầng hào quang nhấp nháy nhẹ quanh mặt trời
        if (weatherState !== 'rainy') {
          ctx.beginPath();
          ctx.arc(sunMoonX, sunMoonY, sunRadius + Math.sin(timestamp * 0.003) * 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 253, 231, 0.4)';
          ctx.fill();
        }
      } else {
        // Vẽ Mặt Trăng lưỡi liềm vàng nhạt tỏa sáng dịu mát
        ctx.translate(sunMoonX, sunMoonY);
        ctx.rotate(-0.25);
        ctx.fillStyle = '#fffde7';
        ctx.shadowBlur = weatherState === 'rainy' ? 8 : 20;
        ctx.shadowColor = '#fffde7';
        ctx.globalAlpha = weatherState === 'rainy' ? 0.4 : 1.0;

        ctx.beginPath();
        ctx.arc(0, 0, 18, -Math.PI / 2, Math.PI / 2, false);
        ctx.arc(6, 0, 16, Math.PI / 2, -Math.PI / 2, true);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. Vẽ luồng gió bay ngang bầu trời (chỉ vẽ sinh động khi trời mưa hoặc chế độ Khoa học)
    if (windLines.length > 0) {
      ctx.save();
      windLines.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(line.x - line.length, line.y);

        // Tạo hiệu ứng lướt gió mờ nhạt dần về hai đầu
        let windGrad = ctx.createLinearGradient(line.x - line.length, 0, line.x, 0);
        const opacity = weatherState === 'rainy' ? line.opacity * 2.2 : line.opacity;
        windGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        windGrad.addColorStop(0.5, `rgba(255, 255, 255, ${opacity})`);
        windGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.strokeStyle = windGrad;
        ctx.lineWidth = weatherState === 'rainy' ? 1.5 : 0.8;
        ctx.stroke();
      });
      ctx.restore();
    }

    // 4. Vẽ các đám mây di động trôi bồng bềnh
    if (clouds.length > 0) {
      clouds.forEach(cloud => {
        ctx.save();
        ctx.globalAlpha = weatherState === 'rainy' ? cloud.opacity * 0.95 : cloud.opacity * 0.7;

        let grad = ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.size * 2.5);
        if (weatherState === 'rainy') {
          // Đám mây dông xám xịt tích nhiều hơi nước
          grad.addColorStop(0, 'rgba(90, 95, 115, 0.95)');
          grad.addColorStop(0.5, 'rgba(55, 57, 73, 0.85)');
          grad.addColorStop(1, 'rgba(30, 32, 43, 0)');
        } else {
          // Đám mây trắng ngày nắng thanh bình
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
          grad.addColorStop(0.6, 'rgba(224, 247, 250, 0.75)');
          grad.addColorStop(1, 'rgba(224, 247, 250, 0)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        const s = cloud.size;
        // Ghép nhiều khối tròn nhỏ tạo nét bồng bềnh tự nhiên cho đám mây
        ctx.arc(cloud.x, cloud.y, s, 0, Math.PI * 2);
        ctx.arc(cloud.x - s * 0.8, cloud.y + s * 0.2, s * 0.7, 0, Math.PI * 2);
        ctx.arc(cloud.x + s * 0.8, cloud.y + s * 0.2, s * 0.7, 0, Math.PI * 2);
        ctx.arc(cloud.x - s * 0.4, cloud.y - s * 0.3, s * 0.85, 0, Math.PI * 2);
        ctx.arc(cloud.x + s * 0.4, cloud.y - s * 0.3, s * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    // 5. Vẽ vùng nước ao (2/3 phía dưới)
    let waterGrad = ctx.createLinearGradient(0, waterY, 0, height);
    if (currentTheme === 'cyber') {
      waterGrad.addColorStop(0, 'rgba(32, 4, 43, 0.82)');
      waterGrad.addColorStop(1, 'rgba(2, 0, 5, 0.95)');
    } else if (currentTheme === 'pond') {
      if (isDay) {
        waterGrad.addColorStop(0, 'rgba(15, 61, 50, 0.78)');
        waterGrad.addColorStop(1, 'rgba(2, 12, 9, 0.95)');
      } else {
        waterGrad.addColorStop(0, 'rgba(6, 28, 22, 0.82)');
        waterGrad.addColorStop(1, 'rgba(1, 5, 3, 0.97)');
      }
    } else { // ocean
      waterGrad.addColorStop(0, 'rgba(13, 43, 69, 0.75)');
      waterGrad.addColorStop(1, 'rgba(3, 8, 18, 0.95)');
    }
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, waterY, width, height - waterY);

    // 6. Vẽ cầu tàu bằng gỗ làm điểm đỗ kiên cố cho thùng chứa cá giống (seedlingBucket)
    ctx.save();
    const dockX = seedlingBucket.x - 20;
    const dockY = waterY;
    const dockW = width - dockX;

    // Vẽ ba cột gỗ cắm sâu dưới nước
    ctx.fillStyle = '#4e342e'; // Màu nâu gỗ sẫm
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 1;

    // Cột gỗ 1
    ctx.beginPath();
    ctx.roundRect(dockX + 15, dockY, 8, 40, 2);
    ctx.fill(); ctx.stroke();

    // Cột gỗ 2
    ctx.beginPath();
    ctx.roundRect(dockX + 60, dockY, 8, 45, 2);
    ctx.fill(); ctx.stroke();

    // Cột gỗ 3 (Sát mép phải canvas)
    ctx.beginPath();
    ctx.roundRect(width - 25, dockY, 8, 45, 2);
    ctx.fill(); ctx.stroke();

    // Vẽ ván sàn gỗ cầu tàu nằm ngay mép nước
    ctx.fillStyle = '#8d6e63'; // Màu gỗ ấm sáng
    ctx.beginPath();
    ctx.roundRect(dockX, dockY - 6, dockW + 10, 8, 2);
    ctx.fill();
    ctx.stroke();

    // Vẽ khe ghép các tấm ván gỗ và các lỗ đinh cố định sàn
    ctx.fillStyle = '#5d4037';
    for (let px = dockX + 10; px < width; px += 25) {
      ctx.fillRect(px, dockY - 5, 2, 6);
      ctx.beginPath();
      ctx.arc(px - 6, dockY - 3, 1, 0, Math.PI * 2);
      ctx.arc(px - 6, dockY - 1, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 7. Vẽ đường sóng nước nhấp nhô trên bề mặt
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, waterY);
    for (let x = 0; x <= width; x += 15) {
      const wave = Math.sin(timestamp * 0.0025 + x * 0.02) * 3.5;
      ctx.lineTo(x, waterY + wave);
    }
    ctx.strokeStyle = currentTheme === 'cyber' ? 'rgba(0, 229, 255, 0.6)' : 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2.5;
    if (currentTheme === 'cyber') {
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00e5ff';
    } else {
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#ffffff';
    }
    ctx.stroke();
    ctx.restore();
  }

  // 14. Draw subtle scientific overlay grid and velocity vector (Khoa học theme)
  function drawScientificOverlays(ctx) {
    if (currentTheme !== 'cyber') return;

    // Draw subtle grid (even fainter than active category)
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.04)';
    ctx.lineWidth = 0.5;
    const gridSize = 60;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    ctx.restore();

    // Draw velocity vector at fish's head (if alive and adult)
    if (fishes[0]) {
      const fish = fishes[0];
      if (fish.lifecycleStage === 'adult' && !fish.isDead) {
        ctx.save();
        const head = fish.segments[0];
        const angle = Math.atan2(fish.vy, fish.vx);
        const arrowLength = 40 * fish.scale;
        const ax = head.x + Math.cos(angle) * arrowLength;
        const ay = head.y + Math.sin(angle) * arrowLength;

        ctx.beginPath();
        ctx.moveTo(head.x, head.y);
        ctx.lineTo(ax, ay);
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Arrow head
        ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - 6 * Math.cos(angle - 0.5), ay - 6 * Math.sin(angle - 0.5));
        ctx.lineTo(ax - 6 * Math.cos(angle + 0.5), ay - 6 * Math.sin(angle + 0.5));
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
    }
  }

  // 13. Main Frame Animation Loop
  function loop(timestamp) {
    ctx.clearRect(0, 0, width, height);

    // Draw sky/water split
    drawPondStructure(ctx, timestamp);

    // Tính toán chỉ số khung hình FPS
    frameCount++;
    const dt = timestamp - lastTime;
    fpsTimer += dt;
    lastTime = timestamp;

    if (fpsTimer >= 1000) {
      fps = Math.round((frameCount * 1000) / fpsTimer);
      fpsCounter.textContent = fps;
      frameCount = 0;
      fpsTimer = 0;
    }

    // Cập nhật bảng chỉ số mô phỏng sinh thái định kỳ 15 khung hình một lần để tạo sự mượt mà
    if (frameCount % 15 === 0) {
      updateEnvDescription();
    }

    // 1. Night Mode darkness filter overlay
    if (!isDay) {
      ctx.fillStyle = 'rgba(3, 10, 24, 0.45)';
      ctx.fillRect(0, 0, width, height);
    }

    // Draw Scientific Overlays (Grid and Velocity Vector for Khoa học theme)
    drawScientificOverlays(ctx);

    // Hover detection on every frame
    hoveredObject = null;
    hoveredFish = null;
    if (mouse.active) {
      const mx = mouse.x;
      const my = mouse.y;

      // Kiểm tra xem chuột có hover gần bất kỳ con cá nào không
      for (let i = 0; i < fishes.length; i++) {
        const fish = fishes[i];
        const dist = Math.hypot(mx - fish.x, my - fish.y);
        if (fish.lifecycleStage === 'adult' && dist < 45 * fish.scale) {
          hoveredObject = 'fish';
          hoveredFish = fish;
          break;
        } else if (fish.lifecycleStage === 'fry') {
          let nearFry = false;
          fish.fryParticles.forEach(fry => {
            if (Math.hypot(mx - fry.x, my - fry.y) < 20) nearFry = true;
          });
          if (nearFry) {
            hoveredObject = 'fish';
            hoveredFish = fish;
            break;
          }
        } else if (fish.lifecycleStage === 'egg' && Math.hypot(mx - fish.x, my - fish.y) < 30) {
          hoveredObject = 'fish';
          hoveredFish = fish;
          break;
        }
      }

      if (!hoveredObject) {
        if (mx >= aerator.x && mx <= aerator.x + aerator.width &&
          my >= aerator.y && my <= aerator.y + aerator.height) {
          hoveredObject = 'aerator';
        } else if (mx >= wastePile.x && mx <= wastePile.x + wastePile.width &&
          my >= wastePile.y && my <= wastePile.y + wastePile.height) {
          hoveredObject = 'waste';
        } else if (mx >= netEnclosure.x && mx <= netEnclosure.x + netEnclosure.width &&
          my >= netEnclosure.y && my <= netEnclosure.y + netEnclosure.height) {
          hoveredObject = 'net';
        } else if (mx >= seedlingBucket.x && mx <= seedlingBucket.x + seedlingBucket.width &&
          my >= seedlingBucket.y && my <= seedlingBucket.y + seedlingBucket.height) {
          hoveredObject = 'bucket';
        }
      }
    }
    canvas.style.cursor = hoveredObject ? 'pointer' : 'default';

    // Cập nhật trạng thái hover cho từng con cá
    fishes.forEach(fish => {
      fish.isHovered = (hoveredObject === 'fish' && hoveredFish === fish);
    });

    // Sync toxic controls & quality state footer label in UI on every frame
    if (fishes[0]) {
      const fish = fishes[0];
      if (typeof toxicSlider !== 'undefined' && toxicSlider && document.activeElement !== toxicSlider) {
        toxicSlider.value = fish.toxicLevel;
      }
      if (typeof toxicVal !== 'undefined' && toxicVal) {
        toxicVal.textContent = `${Math.round(fish.toxicLevel)}%`;
      }

      const state = fish.getWaterState();
      activeQualityState.textContent = state.name;
      activeQualityState.style.color = state.secondary;
    }

    // Smooth Oxygen Bar Update - Dynamically recomputed from day/night, weather and aerator status
    if (aeratorOn) {
      targetOxygen = 100;
      if (currentOxygen < targetOxygen) {
        currentOxygen += 0.08; // Tăng dần dần theo tốc độ thực tế (khoảng 4.8% mỗi giây với 60 FPS)
        if (currentOxygen > targetOxygen) currentOxygen = targetOxygen;
      }
    } else {
      if (isDay && weatherState === 'sunny') {
        // Nắng ráo, ban ngày: tảo quang hợp mạnh, duy trì mức oxy tốt (80-100%)
        targetOxygen = 90;
        currentOxygen += (targetOxygen - currentOxygen) * 0.005;
      } else {
        // Mưa hoặc ban đêm: quang hợp yếu, oxy giảm dần
        targetOxygen = 15;
        let decreaseRate = 0.001; // Giảm chậm
        if (!isDay && weatherState === 'rainy') {
          // Mưa + ban đêm: oxy giảm nhanh hơn 1.5 lần
          decreaseRate = 0.0015;
        }
        currentOxygen += (targetOxygen - currentOxygen) * decreaseRate;
      }
    }
    if (typeof oxygenVal !== 'undefined' && oxygenVal) {
      oxygenVal.textContent = `${Math.round(currentOxygen)}%`;
    }
    if (typeof oxygenProgress !== 'undefined' && oxygenProgress) {
      oxygenProgress.style.width = `${currentOxygen}%`;
      if (currentOxygen < 30) {
        oxygenProgress.style.background = '#ff1744';
      } else {
        oxygenProgress.style.background = 'linear-gradient(90deg, #0288d1, #00e5ff)';
      }
    }

    // Cập nhật vị trí các đám mây di động trên bầu trời
    clouds.forEach(cloud => {
      const speedMult = weatherState === 'rainy' ? 2.2 : 1.0;
      cloud.x -= cloud.speed * speedMult;
      if (cloud.x + cloud.size * 3.5 < 0) {
        cloud.x = width + cloud.size * 3.5;
        cloud.y = Math.random() * (height / 3 - 80) + 35;
      }
    });

    // Cập nhật vị trí các đường gió lướt
    windLines.forEach(line => {
      const speedMult = weatherState === 'rainy' ? 3.0 : 1.0;
      line.x -= line.speed * speedMult;
      if (line.x + line.length < 0) {
        line.x = width + 20;
        line.y = Math.random() * (height / 3 - 60) + 30;
      }
    });

    // 2. Vẽ các hiệu ứng nền môi trường (Tia nắng, bọt khí, thức ăn)
    drawSunRays();
    updateAndDrawBubbles();
    updateAndDrawFood();

    // Vẽ hiệu ứng mưa rơi xiên góc theo hướng gió (nếu trời mưa rào)
    if (weatherState === 'rainy') {
      ctx.save();
      ctx.strokeStyle = 'rgba(174, 234, 253, 0.25)';
      ctx.lineWidth = 1.2;

      const windForce = -2.5; // Lực gió thổi ngang làm xiên màn mưa

      rainDrops.forEach(r => {
        r.y += r.speed;
        r.x += windForce * (r.speed / 10);

        const waterY = height / 3;
        const currentWave = Math.sin(timestamp * 0.0025 + r.x * 0.02) * 3.5;

        if (r.y > waterY + currentWave) {
          // Vẽ hiệu ứng giọt bắn nhỏ khi nước mưa chạm mặt ao nhấp nhô
          ctx.beginPath();
          ctx.arc(r.x, waterY + currentWave, 2.5, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
          ctx.stroke();

          r.y = -20;
          r.x = Math.random() * (width + 100); // Sinh mưa xa hơn về bên phải để bù cho độ lệch gió
        }
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + windForce * 1.5, r.y + 12);
        ctx.stroke();
      });
      ctx.restore();
    }

    // Draw Algae, Bacteria, and interactive entities
    drawAlgae(timestamp);
    updateAndDrawBacteria();
    drawInteractiveObjects(ctx, timestamp);

    // Cập nhật và vẽ các hạt Oxy (Oxygen Particles)
    ctx.save();
    oxygenParticles.forEach(p => {
      // Di chuyển hạt Oxy
      p.y += p.vy;
      p.x += p.vx + Math.sin(timestamp * 0.005 + p.y * 0.01) * 0.2;

      const waterY = height / 3;

      // Xử lý khi hạt vượt qua ranh giới mặt nước hoặc đáy ao
      let needsReset = false;
      if (p.vy < 0 && p.y < waterY) {
        needsReset = true;
      } else if (p.vy > 0 && p.y > height - 10) {
        needsReset = true;
      }

      if (needsReset) {
        if (weatherState === 'rainy' && Math.random() < 0.45) {
          // Mưa hòa tan Oxy: hạt sinh ra ở bề mặt nước và chìm dần xuống dưới
          p.x = Math.random() * width;
          p.y = waterY + 5;
          p.vy = Math.random() * 0.4 + 0.2; // Chìm xuống dưới
          p.vx = (Math.random() - 0.5) * 0.3;
          p.alpha = Math.random() * 0.6 + 0.3;
        } else if (photosynthesisRate > 0) {
          // Tảo quang hợp nhả Oxy: hạt sinh ra từ đầu khóm tảo đáy ao và bay dần lên
          const plant = algaeList[Math.floor(Math.random() * algaeList.length)];
          p.x = plant.x + (Math.random() - 0.5) * 15;
          p.y = height - plant.height;
          p.vy = -Math.random() * 0.5 - 0.2; // Bay lên trên
          p.vx = (Math.random() - 0.5) * 0.4;
          p.alpha = Math.random() * 0.6 + 0.2;
        } else {
          // Không có quang hợp (Ban đêm): hạt Oxy ẩn đi hoàn toàn
          p.x = Math.random() * width;
          p.y = height + 10;
          p.vy = -Math.random() * 0.3 - 0.1;
          p.vx = 0;
          p.alpha = 0.0;
        }
      }

      // Chỉ vẽ những hạt Oxy đang hoạt động (alpha > 0)
      if (p.alpha > 0) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        // Hạt hòa tan từ mưa có màu xanh lam nước mát, hạt quang hợp có màu xanh neon rực rỡ
        const color = p.vy > 0 ? 'rgba(128, 222, 234, ' + p.alpha + ')' : 'rgba(0, 229, 255, ' + p.alpha + ')';
        ctx.fillStyle = color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = p.vy > 0 ? '#80deea' : '#00e5ff';
        ctx.fill();
      }
    });
    ctx.restore();

    // Vẽ luồng năng lượng mũi tên Tảo quang hợp (chỉ hiển thị ở chế độ Biện chứng và Khoa học khi có quang hợp)
    if (photosynthesisRate > 0 && currentTheme !== 'ocean') {
      ctx.save();
      const arrowAlpha = photosynthesisRate / 100;
      ctx.strokeStyle = `rgba(0, 230, 118, ${0.45 * arrowAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#00e676';
      algaeList.forEach(plant => {
        const timePhase = (timestamp * 0.002) % 1;
        const startX = plant.x;
        const startY = height - plant.height;

        for (let a = 0; a < 3; a++) {
          const ang = -Math.PI / 2 + (a - 1) * 0.35;
          const dist = 30 + timePhase * 80;
          const ax = startX + Math.cos(ang) * dist;
          const ay = startY + Math.sin(ang) * dist;

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(ax, ay);
          ctx.stroke();

          ctx.fillStyle = `rgba(0, 230, 118, ${0.75 * arrowAlpha})`;
          ctx.beginPath();
          ctx.arc(ax, ay, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.restore();
    }

    // Draw Fish Respiration arrows (Night mode - only shown in Biện chứng & Khoa học)
    if (!isDay && fishes[0] && fishes[0].lifecycleStage !== 'egg' && currentTheme !== 'ocean') {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#00e5ff';
      const fish = fishes[0];
      const timePhase = (timestamp * 0.002) % 1;
      const arrowCount = 8;

      for (let a = 0; a < arrowCount; a++) {
        const angle = (a / arrowCount) * Math.PI * 2 + (timestamp * 0.0004);
        const rStart = 140 - timePhase * 80;
        const rEnd = rStart - 25;

        const sx = fish.x + Math.cos(angle) * rStart;
        const sy = fish.y + Math.sin(angle) * rStart;
        const ex = fish.x + Math.cos(angle) * rEnd;
        const ey = fish.y + Math.sin(angle) * rEnd;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 229, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(ex, ey, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Shading/Turbidity Overlay based on toxic Level (Lượng - Chất)
    if (fishes[0]) {
      const fish = fishes[0];
      if (fish.toxicLevel > 0) {
        const opacity = Math.min(0.92, fish.toxicLevel / 100);
        ctx.save();
        if (fish.toxicLevel >= 80) {
          ctx.fillStyle = `rgba(10, 8, 16, ${opacity})`;
        } else {
          ctx.fillStyle = `rgba(45, 60, 52, ${opacity * 0.7})`;
        }
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    }

    // 3. Draw trajectory travel path (Đường xoắn ốc)
    if (fishes[0] && fishes[0].maxSpeed > 0 && fishes[0].lifecycleStage === 'adult') {
      const head = fishes[0].segments[0];
      trajectoryPath.push({ x: head.x, y: head.y });
      if (trajectoryPath.length > 130) {
        trajectoryPath.shift();
      }
    }

    ctx.save();
    ctx.beginPath();
    if (trajectoryPath.length > 1) {
      ctx.moveTo(trajectoryPath[0].x, trajectoryPath[0].y);
      for (let i = 1; i < trajectoryPath.length; i++) {
        ctx.lineTo(trajectoryPath[i].x, trajectoryPath[i].y);
      }
    }
    ctx.strokeStyle = 'rgba(224, 64, 251, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(224, 64, 251, 0.8)';
    ctx.stroke();
    ctx.restore();

    // 4. Draw Negated Generations (Bóng ma thế hệ cũ)
    ctx.save();
    silhouettes.forEach((sil) => {
      sil.alpha -= 0.0012;
      if (sil.alpha <= 0) return;

      ctx.globalAlpha = sil.alpha;
      ctx.strokeStyle = sil.color;
      ctx.lineWidth = 1;

      sil.segments.forEach((seg, i) => {
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, sil.widths[i] * sil.scale, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
        ctx.fill();
        ctx.stroke();
      });

      const headSeg = sil.segments[0];
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = "italic 9px 'Outfit', sans-serif";
      ctx.shadowBlur = 0;
      ctx.fillText(`Cá tổ tiên F${sil.generation} (Đã phủ định)`, headSeg.x - 30, headSeg.y - 12);
    });
    silhouettes = silhouettes.filter(sil => sil.alpha > 0);
    ctx.restore();

    // 5. Cập nhật và vẽ các hạt đuôi xoắn ốc phản quang cho tất cả các cá bơi
    fishes.forEach(fish => {
      if (fish.lifecycleStage === 'adult' && !fish.isDead) {
        const tail = fish.segments[fish.numSegments - 1];
        const state = fish.getWaterState();

        if (Math.random() < 0.65) {
          tailParticles.push({
            x: tail.x,
            y: tail.y,
            angleOffset: Math.random() * Math.PI * 2,
            radius: Math.random() * 3.5 + 1.5,
            color: state.secondary,
            alpha: 1.0,
            decay: Math.random() * 0.015 + 0.012,
            vx: -Math.cos(tail.angle) * (Math.random() * 0.8 + 0.4),
            vy: -Math.sin(tail.angle) * (Math.random() * 0.8 + 0.4),
            spiralSize: fish.spiralSize
          });
        }
      }
    });

    ctx.save();
    tailParticles.forEach((p) => {
      p.angleOffset += 0.15;
      const spiralScale = p.spiralSize * 1.6;
      p.x += p.vx + Math.sin(p.angleOffset) * spiralScale * 0.4;
      p.y += p.vy + Math.cos(p.angleOffset) * spiralScale * 0.4;
      p.alpha -= p.decay;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fill();
    });
    tailParticles = tailParticles.filter(p => p.alpha > 0);
    ctx.restore();

    // 6. Update and Draw Leap Flash Particles
    ctx.save();
    leapParticles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.alpha -= p.decay;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.color;
      ctx.fill();
    });
    leapParticles = leapParticles.filter(p => p.alpha > 0);
    ctx.restore();

    // Cập nhật vị trí của popup Triết học Cái riêng & Cái chung bám sát theo chú cá đang bơi
    if (!pondPopup.classList.contains('hidden') && activeCategory === 'rieng-chung' && activePopupFish) {
      const popWidth = pondPopup.offsetWidth || 300;
      const popHeight = pondPopup.offsetHeight || 150;
      let finalLeft = Math.max(10, Math.min(width - popWidth - 10, activePopupFish.x));
      let finalTop = Math.max(10, Math.min(height - popHeight - 10, activePopupFish.y));
      pondPopup.style.left = `${finalLeft}px`;
      pondPopup.style.top = `${finalTop}px`;
    }

    // 7. Cập nhật vật lý và vẽ toàn bộ danh sách cá
    fishes.forEach(fish => {
      if (mouse.active) {
        fish.target = mouse;
      } else {
        fish.target = null;
      }

      // Tìm thức ăn gần nhất cho từng chú cá bơi tự do
      if (foods.length > 0) {
        if (!fish.foodTarget || fish.foodTarget.eaten || !foods.includes(fish.foodTarget)) {
          let closestFood = null;
          let minDist = 999999;

          foods.forEach(pellet => {
            if (!pellet.eaten) {
              const dist = Math.hypot(pellet.x - fish.x, pellet.y - fish.y);
              if (dist < minDist) {
                minDist = dist;
                closestFood = pellet;
              }
            }
          });

          if (minDist < 600) {
            fish.foodTarget = closestFood;
          } else {
            fish.foodTarget = null;
          }
        }
      } else {
        fish.foodTarget = null;
      }

      // Cập nhật vị trí uốn lượn tự nhiên, kiểm tra Oxy, nhiệt độ và các chú cá xung quanh để tránh nhau
      fish.update(width, height, currentOxygen, waterTemp, fishes);

      // Giới hạn không cho cá khác lọt vào vùng lưới quây cá lóc
      if (fish.type !== 'snakehead' && fish.lifecycleStage === 'adult') {
        const buffer = 45 * fish.scale;
        if (fish.x > netEnclosure.x - buffer && fish.y > netEnclosure.y - buffer) {
          const overlapX = fish.x - (netEnclosure.x - buffer);
          const overlapY = fish.y - (netEnclosure.y - buffer);
          if (overlapX < overlapY) {
            fish.x = netEnclosure.x - buffer;
            fish.vx = -Math.abs(fish.vx);
            fish.wanderAngle = Math.PI - fish.wanderAngle;
          } else {
            fish.y = netEnclosure.y - buffer;
            fish.vy = -Math.abs(fish.vy);
          }
        }
      }

      // Xử lý khi cá ăn thức ăn
      if (fish.foodTarget && fish.foodTarget.eaten) {
        const pelletType = fish.foodTarget.type;
        fishes.forEach(f => f.adjustToxicLevel(pelletType === 'cold' ? -10 : 5));

        fish.foodTarget = null;

        // Hiệu ứng phình lớn rồi co nhỏ lại khi nuốt mồi
        const originalScale = fish.scale;
        fish.scale = Math.min(fish.scale + 0.12, 2.1);
        setTimeout(() => {
          const shrinkInterval = setInterval(() => {
            if (fish.scale > originalScale) {
              fish.scale -= 0.01;
            } else {
              fish.scale = originalScale;
              clearInterval(shrinkInterval);
            }
          }, 30);
        }, 1200);
      }

      // Vẽ chú cá lên Canvas kèm theo Thế giới quan (theme) hiện tại
      fish.draw(ctx, currentTheme);

      // Thả bong bóng khi cá ngoi thở (Oxy < 40%)
      if (currentOxygen < 40 && !fish.isDead && fish.lifecycleStage === 'adult') {
        const head = fish.segments[0];
        const mouthX = head.x + Math.cos(head.angle) * (fish.widths[0] * fish.scale);
        const mouthY = head.y + Math.sin(head.angle) * (fish.widths[0] * fish.scale);
        if (Math.random() < 0.18) {
          bubbles.push({
            x: mouthX,
            y: mouthY,
            radius: Math.random() * 2.2 + 1.0,
            speed: Math.random() * 1.5 + 1.0,
            wiggle: Math.random() * 100,
            wiggleSpeed: Math.random() * 0.05 + 0.02,
            wiggleRange: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.6 + 0.3
          });
        }
      }
    });

    // Update and draw Seedling Particles (Khả năng & Hiện thực)
    ctx.save();
    seedlingParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx += (Math.random() - 0.5) * 0.25; // wander
      p.vy += (Math.random() - 0.5) * 0.25;

      // restrict seedling particles to stay below water surface
      const waterY = height / 3;
      if (p.y < waterY + 5) {
        p.y = waterY + 5;
        p.vy *= -0.5; // bounce down
      }

      // limit speed
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > 2.5) {
        p.vx = (p.vx / speed) * 2.5;
        p.vy = (p.vy / speed) * 2.5;
      }

      p.angle = Math.atan2(p.vy, p.vx);
      p.wagTime += 0.3;
      p.life -= p.decay;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // Draw tiny seedling body
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 229, 255, ${p.life})`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#00e5ff';
      ctx.fill();

      // Tail wag
      const tailWag = Math.sin(p.wagTime) * 0.5;
      ctx.beginPath();
      ctx.moveTo(-p.size, 0);
      ctx.lineTo(-p.size - 4, tailWag * 3);
      ctx.strokeStyle = `rgba(0, 229, 255, ${p.life})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    });
    seedlingParticles = seedlingParticles.filter(p => p.life > 0);
    ctx.restore();

    // 8. Draw Dynamic Philosophy Labels
    drawPhilosophyLabels(ctx);

    // 9. Draw active Category overlays
    drawCategoryHighlights(timestamp);

    requestAnimationFrame(loop);
  }

  // Start the simulation
  init();
});
