// fish.js
// Quản lý vật lý của từng chú cá, các trạng thái triết học và vẽ cá trên canvas
// === PHIÊN BẢN 2.0: Hệ sinh thái 4 loài 15 con, phân 3 tầng nước rõ rệt ===

class Fish {
  // Các tầng nước (được cập nhật bởi aquarium.js mỗi frame)
  static WATER_Y = 0;   // Ranh giới mặt nước (30% chiều cao canvas)
  static HEIGHT = 600;  // Chiều cao canvas

  constructor(x, y, type = 'carp', scale = 1.4) {
    this.x = x;
    this.y = y;
    // 'carp' = Cá Chép, 'tilapia' = Cá Rô Phi, 'grass_carp' = Cá Trắm Cỏ, 'snakehead' = Cá Lóc
    this.type = type;
    this.baseScale = scale;
    this.scale = scale;

    // Vật lý cơ bản
    this.vx = (Math.random() - 0.5) * 1.5 + 1.5;
    this.vy = (Math.random() - 0.5) * 0.8;
    this.ax = 0;
    this.ay = 0;

    this.numSegments = 10;

    // Cấu hình hình dáng và màu sắc đặc trưng từng loài
    if (type === 'tilapia') {
      // Cá Rô Phi: thân dẹt, lưng nhô cao
      this.widths = [14, 23, 26, 22, 17, 13, 10, 8, 6, 4];
      this.segmentSpacing = 14 * this.scale;
      this.colors = { primary: '#455a64', secondary: '#5e35b1', belly: '#eceff1', name: 'Cá Rô Phi' };
      this.swimSpeedMultiplier = 0.95;
      this.depthZone = 'surface';
    } else if (type === 'grass_carp') {
      // Cá Trắm Cỏ: thân thon dài, hình trụ thuôn đều
      this.widths = [14, 18, 20, 19, 17, 14, 11, 9, 7, 4.5];
      this.segmentSpacing = 17 * this.scale;
      this.colors = { primary: '#33691e', secondary: '#1b5e20', belly: '#dcedc8', name: 'Cá Trắm Cỏ' };
      this.swimSpeedMultiplier = 0.88;
      this.depthZone = 'middle';
    } else if (type === 'snakehead') {
      // Cá Lóc: thân tròn thon dài như ống
      this.widths = [14, 16, 16, 15, 14, 13, 12, 11, 9, 7];
      this.segmentSpacing = 19 * this.scale;
      this.colors = { primary: '#3e2723', secondary: '#1a0c00', belly: '#d7ccc8', name: 'Cá Lóc' };
      this.swimSpeedMultiplier = 1.15;
      this.depthZone = 'middle';
    } else if (type === 'silver_carp') {
      // Cá Mè: đầu cực to, thân thuôn dẹp, vảy nhuyễn mượt bạc
      this.widths = [24, 25, 21, 17, 14, 11, 9, 7, 5, 3];
      this.segmentSpacing = 16 * this.scale;
      this.colors = { primary: '#546e7a', secondary: '#37474f', belly: '#ffffff', name: 'Cá Mè' };
      this.swimSpeedMultiplier = 0.9;
      this.depthZone = 'surface';
    } else { 
      // Cá Chép (carp): thân dày tròn, gù ở lưng, có râu
      this.widths = [16, 22, 24, 20, 16, 13, 11, 9, 7, 5];
      this.segmentSpacing = 15 * this.scale;
      this.colors = { primary: '#d84315', secondary: '#f57f17', belly: '#fff8e1', name: 'Cá Chép' };
      this.swimSpeedMultiplier = 1.0;
      this.depthZone = 'bottom';
    }

    // Khởi tạo các đốt xương sống
    this.segments = [];
    let angle = Math.atan2(this.vy, this.vx);
    for (let i = 0; i < this.numSegments; i++) {
      this.segments.push({
        x: this.x - Math.cos(angle) * i * this.segmentSpacing,
        y: this.y - Math.sin(angle) * i * this.segmentSpacing,
        angle: angle
      });
    }

    this.maxSpeed = 2.4;
    this.maxForce = 0.07;

    this.wagTime = Math.random() * 100;
    this.orbitAngle = Math.random() * Math.PI * 2;

    this.target = null;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.foodTarget = null;

    this.mouthOpen = 0.0;
    this.mouthTimer = 0;

    // Chu kỳ ngoi lên mặt nước thở Oxy
    this.gaspPhase = 'swimming';
    this.gaspCycleTimer = Math.random() * 300 + 100;

    // Triết học
    this.toxicLevel = 0;
    this.struggleFrequency = 3;
    this.wagSpeedMultiplier = 1.0;
    this.spiralSize = 2;
    this.generation = 1;
    this.foodEaten = 0;
    this.leapAnimationTimer = 0;
    this.highlightedPart = null;

    // Vòng đời
    this.lifecycleStage = 'adult';
    this.isDead = false;
    this.deadRotation = 0;

    // Cá con
    this.fryParticles = [];
    for (let i = 0; i < 12; i++) {
      this.fryParticles.push({
        x: x + (Math.random() - 0.5) * 80,
        y: y + (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        angle: Math.random() * Math.PI * 2,
        wagTime: Math.random() * 10
      });
    }

    // ===== Hành vi đặc trưng từng loài =====

    // Cá Chép: ủi bùn đáy ao
    this.mudDigTimer = Math.floor(Math.random() * 200) + 80;
    this.isMudDigging = false;
    this.mudDigPhase = 0; // 0: bơi bình thường, 1: chúc đầu, 2: đào bùn
    this.mudDigDuration = 0;
    this.mudParticles = []; // Hạt bụi bùn

    // Cá Lóc: rình mồi và bứt tốc
    this.stalkTimer = Math.floor(Math.random() * 180) + 60;
    this.isStalking = false;
    this.isDashing = false;
    this.dashTimer = 0;
    this.stalkTarget = null;
    this.fearFactor = 0; // Hệ số hoảng loạn khi bị chim bói cá tấn công

    // Cá Trắm Cỏ: ăn rong tảo
    this.grassTarget = null;
    this.grassEatTimer = 0;
    this.leafParticles = []; // Hạt lá rong
    this.isEatingGrass = false;

    // Cá Rô Phi: hoảng loạn khi bị chim bói cá
    this.scaredTimer = 0;
    this.scaredVx = 0;
    this.scaredVy = 0;

    // Hover tooltip
    this.isHovered = false;
  }

  // --- Ranh giới tầng nước ---
  getLayerBounds(height) {
    const waterY = Fish.WATER_Y;
    const waterH = height - waterY;
    const buf = 30 * this.scale;
    if (this.depthZone === 'surface') {
      // Tầng mặt: 0% → 33% vùng nước
      return { minY: waterY + buf, maxY: waterY + waterH * 0.33 };
    } else if (this.depthZone === 'middle') {
      // Tầng giữa: 33% → 66% vùng nước
      return { minY: waterY + waterH * 0.33 + buf * 0.5, maxY: waterY + waterH * 0.66 };
    } else {
      // Tầng đáy: 66% → 100% vùng nước
      return { minY: waterY + waterH * 0.66 + buf * 0.5, maxY: height - buf };
    }
  }

  getWaterState() {
    if (this.toxicLevel < 80) {
      return {
        name: `Nước Đục (${Math.round(this.toxicLevel)}% Khí Độc)`,
        type: 'turbid',
        primary: '#4d8076',
        secondary: '#00e5ff',
        speed: 2.4 * (1 - this.toxicLevel / 150)
      };
    } else {
      return {
        name: `Nước Nhiễm Độc Đen (${Math.round(this.toxicLevel)}% Khí Độc)`,
        type: 'toxic',
        primary: '#111111',
        secondary: '#ff1744',
        speed: 0
      };
    }
  }

  adjustToxicLevel(amount) {
    const prevToxic = this.toxicLevel;
    this.toxicLevel = Math.max(0, Math.min(100, this.toxicLevel + amount));
    const crossedPoint = (prevToxic < 80 && this.toxicLevel >= 80) || (prevToxic >= 80 && this.toxicLevel < 80);
    if (crossedPoint) { this.triggerLeap(); }
  }

  triggerLeap() {
    this.leapAnimationTimer = 40;
    const state = this.getWaterState();
    const qualityStateLabel = document.getElementById('active-quality-state');
    if (qualityStateLabel) {
      qualityStateLabel.textContent = this.toxicLevel >= 80 ? 'Bể cá nhiễm độc (Cá lật bụng chết)' : 'Nước lỏng';
      qualityStateLabel.style.color = state.secondary;
    }
    if (this.toxicLevel >= 80) {
      this.isDead = true;
      const overlay = document.getElementById('red-flash-overlay');
      if (overlay) {
        overlay.classList.remove('red-flash-active');
        void overlay.offsetWidth;
        overlay.classList.add('red-flash-active');
      }
    } else {
      this.isDead = false;
    }
    window.dispatchEvent(new CustomEvent('philosophy-leap', {
      detail: { x: this.x, y: this.y, stateName: state.name, color: state.secondary }
    }));
  }

  evolveGeneration() {
    this.generation++;
    this.foodEaten = 0;
    this.leapAnimationTimer = 50;
    this.scale = this.baseScale * (1.0 + (this.generation - 1) * 0.08);
    this.segmentSpacing = 16 * this.scale;
    const genLabel = document.getElementById('lifecycle-stage-val');
    if (genLabel) genLabel.textContent = `${this.lifecycleStage === 'fry' ? 'Cá con' : 'Trưởng thành'} (F${this.generation})`;
    window.dispatchEvent(new CustomEvent('fish-evolved', {
      detail: { x: this.x, y: this.y, scale: this.scale, generation: this.generation }
    }));
  }

  // Sợ hãi tức thời khi chim bói cá lao xuống gần
  triggerFear(predatorX, predatorY) {
    if (this.type === 'tilapia') {
      this.scaredTimer = 80 + Math.random() * 40;
      const angle = Math.atan2(this.y - predatorY, this.x - predatorX);
      this.scaredVx = Math.cos(angle) * 6;
      this.scaredVy = Math.sin(angle) * 4;
    }
  }

  // Cập nhật hạt bùn của cá chép
  updateMudParticles() {
    this.mudParticles = this.mudParticles.filter(p => p.life > 0);
    this.mudParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy -= 0.03; // nhẹ dần khi bay lên
      p.life -= p.decay;
    });
  }

  // Cập nhật hạt lá của cá trắm
  updateLeafParticles() {
    this.leafParticles = this.leafParticles.filter(p => p.life > 0);
    this.leafParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04; // rơi xuống
      p.vx *= 0.97;
      p.life -= p.decay;
    });
  }

  update(width, height, currentOxygen, waterTemp, otherFishes, grassNodes) {
    // Cập nhật tĩnh tầng nước toàn cục
    Fish.HEIGHT = height;
    Fish.WATER_Y = height / 3; // Ranh giới mặt nước là 1/3 phía trên

    if (this.leapAnimationTimer > 0) this.leapAnimationTimer--;

    // Cập nhật hạt đặc biệt
    this.updateMudParticles();
    this.updateLeafParticles();

    const state = this.getWaterState();

    if (this.lifecycleStage === 'egg') {
      this.vx = 0; this.vy = 0; this.ax = 0; this.ay = 0;
      if (this.y < height - 25) this.y += 1.5;
      return;
    }

    if (this.lifecycleStage === 'fry') {
      this._updateFry(width, height);
      return;
    }

    if (this.isDead) {
      this._updateDead(height);
      return;
    } else {
      if (this.deadRotation > 0) this.deadRotation -= 0.05;
    }

    // Hành vi hoảng loạn Cá Rô Phi (bị chim bói cá)
    if (this.type === 'tilapia' && this.scaredTimer > 0) {
      this.scaredTimer--;
      this.vx += this.scaredVx * 0.15;
      this.vy += this.scaredVy * 0.15;
      this.scaredVx *= 0.88;
      this.scaredVy *= 0.88;
    }

    let isGasping = false;
    let isDiving = false;

    // Oxygen gasping: vượt tầng lên mặt nước thở
    if (currentOxygen !== undefined && currentOxygen < 40 && !this.isDead && this.lifecycleStage === 'adult') {
      this.gaspPhase = 'gasping';
      isGasping = true;
      isDiving = false;
    } else {
      this.gaspPhase = 'swimming';
      if (!this.isDead && this.lifecycleStage === 'adult' && this.y < this.getLayerBounds(height).minY) {
        isDiving = true;
      }
    }

    // Miệng nhấp nháy
    if (isGasping) {
      this.mouthOpen = 0.45 + Math.sin(this.wagTime * 1.8) * 0.45;
    } else if (this.foodTarget || this.isEatingGrass) {
      const dist = this.foodTarget ? Math.hypot(this.foodTarget.x - this.x, this.foodTarget.y - this.y) : 30;
      this.mouthOpen = dist < 80 ? 0.8 : Math.max(0, this.mouthOpen - 0.05);
    } else {
      this.mouthOpen = Math.max(0, this.mouthOpen - 0.05);
    }

    // Tốc độ tối đa
    if (this.struggleFrequency === 0) {
      this.maxSpeed = 0;
    } else {
      const genMult = 1.0 + (this.generation - 1) * 0.12;
      const struggleMult = 0.6 + (this.struggleFrequency / 5) * 0.6;
      const gaspMult = isGasping ? 0.45 : (isDiving ? 0.65 : 1.0);
      const tempMult = (waterTemp || 25) / 24;
      this.maxSpeed = state.speed * genMult * struggleMult * gaspMult * tempMult * this.swimSpeedMultiplier;
    }

    this.orbitAngle += 0.025 * this.struggleFrequency;
    this.ax = 0;
    this.ay = 0;

    if (this.maxSpeed > 0) {
      // === Hành vi đặc trưng từng loài ===
      if (this.type === 'carp') {
        this._behaviorCarp(width, height, isGasping, isDiving);
      } else if (this.type === 'snakehead') {
        this._behaviorSnakehead(width, height, otherFishes, isGasping, isDiving);
      } else if (this.type === 'grass_carp') {
        this._behaviorGrassCarp(width, height, grassNodes, isGasping, isDiving);
      } else {
        // tilapia: wander bình thường (+ hoảng loạn đã xử lý ở trên)
        if (this.foodTarget) {
          this.seek(this.foodTarget.x, this.foodTarget.y);
        } else if (this.target) {
          this.seek(this.target.x, this.target.y);
        } else {
          this.wander(isGasping, isDiving, height);
        }
      }

      // Tránh va chạm giữa các con cá
      if (otherFishes && this.lifecycleStage === 'adult' && !this.isDead) {
        otherFishes.forEach(other => {
          if (other === this || other.lifecycleStage !== 'adult' || other.isDead) return;
          const dx = this.x - other.x;
          const dy = this.y - other.y;
          const dist = Math.hypot(dx, dy);
          const minDist = 70 * this.scale;
          if (dist < minDist && dist > 0) {
            const force = ((minDist - dist) / minDist) * 0.12;
            this.ax += (dx / dist) * force;
            this.ay += (dy / dist) * force;
          }
        });
      }

      this.vx += this.ax;
      this.vy += this.ay;

      // Lực ngoi / lặn
      if (isGasping) {
        const targetY = Fish.WATER_Y + 12;
        this.vy += (targetY - this.y) * 0.15;
      } else if (isDiving) {
        const { minY, maxY } = this.getLayerBounds(height);
        const midY = (minY + maxY) / 2;
        this.vy += (midY - this.y) * 0.06;
      } else if (!this.isDead && !this.isMudDigging) {
        this.vy += Math.sin(this.wagTime * 0.4) * 0.06;
      }

      // Giới hạn tốc độ
      let currentSpeed = Math.hypot(this.vx, this.vy);
      if (this.isDashing) {
        // Cá Lóc bứt tốc không bị giới hạn
        if (currentSpeed > this.maxSpeed * 3.5) {
          this.vx = (this.vx / currentSpeed) * this.maxSpeed * 3.5;
          this.vy = (this.vy / currentSpeed) * this.maxSpeed * 3.5;
          currentSpeed = this.maxSpeed * 3.5;
        }
      } else {
        if (currentSpeed > this.maxSpeed) {
          this.vx = (this.vx / currentSpeed) * this.maxSpeed;
          this.vy = (this.vy / currentSpeed) * this.maxSpeed;
          currentSpeed = this.maxSpeed;
        }
      }

      this.x += this.vx;
      this.y += this.vy;

      // ---- Giới hạn biên theo tầng ----
      const bufferX = 45 * this.scale;
      if (this.x < bufferX) { this.x = bufferX; this.vx = Math.abs(this.vx); this.wanderAngle = Math.PI - this.wanderAngle; }
      else if (this.x > width - bufferX) { this.x = width - bufferX; this.vx = -Math.abs(this.vx); this.wanderAngle = Math.PI - this.wanderAngle; }

      // Giới hạn Y theo tầng – trừ khi đang ngớp khí
      if (!isGasping && !isDiving) {
        const { minY, maxY } = this.getLayerBounds(height);
        if (this.y < minY) { this.y = minY; this.vy = Math.abs(this.vy) * 0.5; }
        else if (this.y > maxY) { this.y = maxY; this.vy = -Math.abs(this.vy) * 0.5; }
      } else if (isDiving) {
        const { maxY } = this.getLayerBounds(height);
        if (this.y > maxY) { this.y = maxY; this.vy = -Math.abs(this.vy) * 0.5; }
      }

      this.wagTime += (currentSpeed * 0.08 + 0.02) * this.wagSpeedMultiplier * (isGasping ? 1.5 : 1.0);
    } else {
      this.vx = 0; this.vy = 0;
    }

    // Xương sống bám đuôi
    this._updateSpine(isGasping, isDiving);
  }

  // --- Hành vi Cá Chép: ủi bùn đáy ao ---
  _behaviorCarp(width, height, isGasping, isDiving) {
    if (isGasping || isDiving) {
      this.isMudDigging = false;
      this.wander(isGasping, isDiving, height);
      return;
    }

    // Thả thức ăn ưu tiên hơn
    if (this.foodTarget) {
      this.isMudDigging = false;
      this.seek(this.foodTarget.x, this.foodTarget.y);
      return;
    }

    if (this.target) {
      this.isMudDigging = false;
      this.seek(this.target.x, this.target.y);
      return;
    }

    // Ủi bùn
    this.mudDigTimer--;
    if (this.mudDigTimer <= 0 && !this.isMudDigging) {
      this.isMudDigging = true;
      this.mudDigDuration = 90 + Math.random() * 60;
      this.mudDigPhase = 1;
    }

    if (this.isMudDigging) {
      this.mudDigDuration--;
      if (this.mudDigDuration <= 0) {
        this.isMudDigging = false;
        this.mudDigTimer = 160 + Math.floor(Math.random() * 120);
        return;
      }

      // Giai đoạn 1: chúc đầu xuống đáy
      const { maxY } = this.getLayerBounds(height);
      this.vy += (maxY - this.y) * 0.12;
      this.vx *= 0.92;

      // Thải bụi bùn
      if (Math.random() < 0.3) {
        for (let i = 0; i < 2; i++) {
          this.mudParticles.push({
            x: this.x + (Math.random() - 0.5) * 20,
            y: this.y + 10,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -Math.random() * 0.6 - 0.2,
            radius: Math.random() * 3 + 1.5,
            life: 1.0,
            decay: Math.random() * 0.018 + 0.01,
            color: `rgba(${110 + Math.random() * 40}, ${80 + Math.random() * 30}, 40, `
          });
        }
      }
    } else {
      this.wander(false, false, height);
    }
  }

  // --- Hành vi Cá Lóc: ẩn nấp rình mồi ---
  _behaviorSnakehead(width, height, otherFishes, isGasping, isDiving) {
    if (isGasping || isDiving) {
      this.isDashing = false;
      this.isStalking = false;
      this.wander(isGasping, isDiving, height);
      return;
    }

    // Ưu tiên thức ăn
    if (this.foodTarget) {
      this.isDashing = true;
      this.dashTimer = 25;
      this.seek(this.foodTarget.x, this.foodTarget.y);
      return;
    }

    if (this.isDashing) {
      this.dashTimer--;
      if (this.dashTimer <= 0) { this.isDashing = false; }
      if (this.stalkTarget) {
        this.seek(this.stalkTarget.x, this.stalkTarget.y);
        return;
      }
    }

    this.stalkTimer--;

    // Tìm mồi gần (cá rô phi hoặc cá nhỏ)
    if (!this.isStalking && this.stalkTimer <= 0) {
      let nearestPrey = null;
      let nearestDist = 300;
      if (otherFishes) {
        otherFishes.forEach(other => {
          if (other === this || other.type === 'snakehead') return;
          const dist = Math.hypot(other.x - this.x, other.y - this.y);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestPrey = other;
          }
        });
      }

      if (nearestPrey && nearestDist < 200) {
        this.isStalking = true;
        this.stalkTarget = nearestPrey;
      } else {
        this.stalkTimer = 80 + Math.floor(Math.random() * 100);
      }
    }

    if (this.isStalking && this.stalkTarget) {
      const dist = Math.hypot(this.stalkTarget.x - this.x, this.stalkTarget.y - this.y);

      if (dist > 280) {
        // Mất mục tiêu
        this.isStalking = false;
        this.stalkTarget = null;
        this.stalkTimer = 60 + Math.floor(Math.random() * 80);
        this.wander(false, false, height);
      } else if (dist < 55) {
        // Bứt tốc tấn công!
        this.isDashing = true;
        this.dashTimer = 30;
        this.isStalking = false;
        this.seek(this.stalkTarget.x, this.stalkTarget.y);
        // Làm cá mồi hoảng loạn
        if (this.stalkTarget.triggerFear) {
          this.stalkTarget.triggerFear(this.x, this.y);
        }
        this.stalkTarget = null;
      } else {
        // Lướt chậm tiếp cận, tốc độ rất thấp
        const stalkSpeed = this.maxSpeed * 0.3;
        const dx = this.stalkTarget.x - this.x;
        const dy = this.stalkTarget.y - this.y;
        const d = Math.hypot(dx, dy);
        this.ax += (dx / d) * 0.04;
        this.ay += (dy / d) * 0.04;
        // Chờ đến khi đủ gần rồi mới tấn công, không bơi nhanh
        const spd = Math.hypot(this.vx, this.vy);
        if (spd > stalkSpeed) {
          this.vx *= stalkSpeed / spd;
          this.vy *= stalkSpeed / spd;
        }
      }
    } else if (!this.isDashing) {
      if (this.target) {
        this.seek(this.target.x, this.target.y);
      } else {
        this.wander(false, false, height);
      }
    }
  }

  // --- Hành vi Cá Trắm Cỏ: ăn rong tảo ---
  _behaviorGrassCarp(width, height, grassNodes, isGasping, isDiving) {
    if (isGasping || isDiving) {
      this.isEatingGrass = false;
      this.wander(isGasping, isDiving, height);
      return;
    }

    if (this.foodTarget) {
      this.isEatingGrass = false;
      this.seek(this.foodTarget.x, this.foodTarget.y);
      return;
    }
    if (this.target) {
      this.isEatingGrass = false;
      this.seek(this.target.x, this.target.y);
      return;
    }

    // Tìm cụm rong gần nhất
    if (!this.grassTarget && grassNodes && grassNodes.length > 0) {
      let nearest = null;
      let nearestDist = 99999;
      grassNodes.forEach(node => {
        const dist = Math.hypot(node.x - this.x, node.y - this.y);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = node;
        }
      });
      if (nearest && nearestDist < 350) {
        this.grassTarget = nearest;
      }
    }

    if (this.grassTarget) {
      const dist = Math.hypot(this.grassTarget.x - this.x, this.grassTarget.y - this.y);
      if (dist < 35) {
        // Ăn rong tảo
        this.isEatingGrass = true;
        this.grassEatTimer++;
        this.vx *= 0.88;
        this.vy *= 0.88;

        if (this.grassEatTimer % 8 === 0 && Math.random() < 0.6) {
          // Thải ra hạt lá rong
          for (let i = 0; i < 2; i++) {
            this.leafParticles.push({
              x: this.x + (Math.random() - 0.5) * 15,
              y: this.y + (Math.random() - 0.5) * 8,
              vx: (Math.random() - 0.5) * 0.6,
              vy: Math.random() * 0.4 + 0.1,
              life: 1.0,
              decay: Math.random() * 0.02 + 0.012,
              size: Math.random() * 4 + 2
            });
          }
        }

        // Sau một lúc rời rong
        if (this.grassEatTimer > 120 + Math.floor(Math.random() * 80)) {
          this.grassTarget = null;
          this.grassEatTimer = 0;
          this.isEatingGrass = false;
        }
      } else if (dist > 400) {
        this.grassTarget = null;
        this.isEatingGrass = false;
      } else {
        this.isEatingGrass = false;
        this.seek(this.grassTarget.x, this.grassTarget.y);
      }
    } else {
      this.isEatingGrass = false;
      this.wander(false, false, height);
    }
  }

  _updateFry(width, height) {
    const targetX = this.foodTarget ? this.foodTarget.x : (this.target ? this.target.x : this.x);
    const targetY = this.foodTarget ? this.foodTarget.y : (this.target ? this.target.y : this.y);
    let avgX = 0, avgY = 0;

    this.fryParticles.forEach(fry => {
      let dx = targetX - fry.x, dy = targetY - fry.y;
      let dist = Math.hypot(dx, dy);
      if (dist > 15) {
        fry.vx += (dx / dist) * 0.12;
        fry.vy += (dy / dist) * 0.12;
      } else {
        fry.vx += (Math.random() - 0.5) * 0.3;
        fry.vy += (Math.random() - 0.5) * 0.3;
      }

      this.fryParticles.forEach(other => {
        if (other === fry) return;
        let rx = fry.x - other.x, ry = fry.y - other.y;
        let rdist = Math.hypot(rx, ry);
        if (rdist < 22 && rdist > 0) {
          fry.vx += (rx / rdist) * 0.3;
          fry.vy += (ry / rdist) * 0.3;
        }
      });

      let speed = Math.hypot(fry.vx, fry.vy);
      if (speed > 2.4) { fry.vx = (fry.vx / speed) * 2.4; fry.vy = (fry.vy / speed) * 2.4; }

      if (this.isDead) {
        fry.vx = 0; fry.vy = 0;
        const ty = height / 3 + 15;
        if (fry.y > ty) fry.y -= 0.6;
        else if (fry.y < ty) fry.y += 0.6;
      } else {
        fry.x += fry.vx; fry.y += fry.vy;
        fry.angle = Math.atan2(fry.vy, fry.vx);
        fry.wagTime += 0.35;
      }

      if (fry.x < 30) fry.x = 30;
      if (fry.x > width - 30) fry.x = width - 30;
      const waterY = Fish.WATER_Y;
      if (fry.y < waterY + 20) fry.y = waterY + 20;
      if (fry.y > height - 20) fry.y = height - 20;

      avgX += fry.x; avgY += fry.y;
    });

    this.x = avgX / this.fryParticles.length;
    this.y = avgY / this.fryParticles.length;
  }

  _updateDead(height) {
    this.vx = 0; this.vy = 0; this.ax = 0; this.ay = 0;
    const targetY = Fish.WATER_Y + 15;
    if (this.y > targetY) this.y -= 0.6;
    else if (this.y < targetY) this.y += 0.6;
    if (this.deadRotation < Math.PI) this.deadRotation += 0.05;

    let head = this.segments[0];
    head.x = this.x; head.y = this.y; head.angle = 0;
    for (let i = 1; i < this.numSegments; i++) {
      let seg = this.segments[i], prev = this.segments[i - 1];
      let dx = seg.x - prev.x, dy = seg.y - prev.y;
      let angle = Math.atan2(dy, dx);
      seg.x = prev.x + Math.cos(angle) * this.segmentSpacing;
      seg.y = prev.y + Math.sin(angle) * this.segmentSpacing;
      seg.angle = Math.atan2(seg.y - prev.y, seg.x - prev.x);
    }
  }

  _updateSpine(isGasping, isDiving) {
    let head = this.segments[0];
    head.x = this.x; head.y = this.y;

    let targetAngle = Math.atan2(this.vy, this.vx);
    if (isGasping) {
      targetAngle = this.vx >= 0 ? -0.52 : -Math.PI + 0.52;
    } else if (this.isMudDigging) {
      // Chúc đầu xuống khi ủi bùn
      targetAngle = this.vx >= 0 ? 0.9 : -Math.PI - 0.9;
    } else if (isDiving) {
      targetAngle = this.vx >= 0 ? 0.35 : -Math.PI - 0.35;
    }

    let diff = targetAngle - head.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    const maxTurnRate = 0.08 * (isGasping ? 0.5 : 1.0);
    head.angle += Math.max(-maxTurnRate, Math.min(maxTurnRate, diff * 0.15));

    for (let i = 1; i < this.numSegments; i++) {
      let seg = this.segments[i], prev = this.segments[i - 1];
      let dx = seg.x - prev.x, dy = seg.y - prev.y;
      let angle = Math.atan2(dy, dx);
      let wagOffset = 0;
      const currentSpeed = Math.hypot(this.vx, this.vy);
      if (i > 2 && this.maxSpeed > 0) {
        const wagPhase = this.wagTime - i * 0.4;
        const wagFreq = 0.12 * Math.min(1.5, currentSpeed / 2 + 0.2);
        wagOffset = Math.sin(wagPhase) * wagFreq;
      }
      let finalAngle = angle + wagOffset;
      seg.x = prev.x + Math.cos(finalAngle) * this.segmentSpacing;
      seg.y = prev.y + Math.sin(finalAngle) * this.segmentSpacing;
      seg.angle = Math.atan2(seg.y - prev.y, seg.x - prev.x);
    }
  }

  seek(tx, ty) {
    let dx = tx - this.x, dy = ty - this.y;
    let dist = Math.hypot(dx, dy);
    if (dist < 15) {
      if (this.foodTarget) {
        this.foodTarget.eaten = true;
        this.foodEaten++;
        this.foodTarget = null;
        if (this.foodEaten >= 5) this.evolveGeneration();
      } else {
        this.target = null;
      }
      return;
    }
    let speed = this.maxSpeed;
    if (dist < 100) speed = this.maxSpeed * (dist / 100);
    let targetVx = (dx / dist) * speed;
    let targetVy = (dy / dist) * speed;
    let steerX = targetVx - this.vx;
    let steerY = targetVy - this.vy;
    let force = Math.hypot(steerX, steerY);
    if (force > this.maxForce) { steerX = (steerX / force) * this.maxForce; steerY = (steerY / force) * this.maxForce; }
    this.ax += steerX;
    this.ay += steerY;
  }

  wander(isGasping = false, isDiving = false, height = 450) {
    this.wanderAngle += (Math.random() - 0.5) * 0.15;
    let wanderDist = 140;
    let targetX = this.x + Math.cos(this.wanderAngle) * wanderDist;
    let targetY = this.y + Math.sin(this.wanderAngle) * wanderDist;
    if (isGasping) {
      targetY = Fish.WATER_Y + 12 + (Math.random() - 0.5) * 10;
    } else if (isDiving) {
      const { minY, maxY } = this.getLayerBounds(height);
      targetY = (minY + maxY) / 2 + (Math.random() - 0.5) * 35;
    }
    this.seek(targetX, targetY);
  }

  // ===========================================================
  // DRAWING METHODS
  // ===========================================================

  drawEggs(ctx) {
    ctx.save();
    const eggCount = 10;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00e5ff';
    for (let i = 0; i < eggCount; i++) {
      const angle = (i / eggCount) * Math.PI * 2;
      const dist = (i % 2 === 0 ? 5 : 9);
      const ex = this.x + Math.cos(angle) * dist;
      const ey = this.y + Math.sin(angle) * 5;
      const eggRadius = 5.5 * this.scale;
      const grad = ctx.createRadialGradient(ex - 1.5, ey - 1.5, 0.5, ex, ey, eggRadius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, 'rgba(0, 229, 255, 0.7)');
      grad.addColorStop(0.8, 'rgba(2, 136, 209, 0.5)');
      grad.addColorStop(1, 'rgba(2, 136, 209, 0.1)');
      ctx.beginPath();
      ctx.arc(ex, ey, eggRadius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  drawFry(ctx) {
    ctx.save();
    this.fryParticles.forEach(fry => {
      ctx.save();
      ctx.translate(fry.x, fry.y);
      ctx.rotate(fry.angle);
      if (this.isDead) ctx.scale(1, -1);
      const size = 6.0 * this.scale;
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#00e5ff';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00e5ff';
      ctx.fill();
      const tailWag = Math.sin(fry.wagTime) * 0.5;
      ctx.beginPath();
      ctx.moveTo(-size, 0);
      ctx.lineTo(-size - 6, tailWag * 4);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }

  // Vẽ hạt bùn của cá chép
  drawMudParticles(ctx) {
    if (!this.mudParticles.length) return;
    ctx.save();
    this.mudParticles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.life + ')';
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(100,70,30,0.5)';
      ctx.fill();
    });
    ctx.restore();
  }

  // Vẽ hạt lá của cá trắm
  drawLeafParticles(ctx) {
    if (!this.leafParticles.length) return;
    ctx.save();
    this.leafParticles.forEach(p => {
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(76, 175, 80, ${p.life * 0.85})`;
      ctx.shadowBlur = 5;
      ctx.shadowColor = 'rgba(76,175,80,0.5)';
      ctx.fill();
    });
    ctx.restore();
  }

  drawSmoothBody(ctx, state) {
    ctx.save();
    const leftPoints = [], rightPoints = [];
    for (let i = 0; i < this.numSegments; i++) {
      const seg = this.segments[i];
      const r = this.widths[i] * this.scale;
      const normalAngle = seg.angle + Math.PI / 2;
      leftPoints.push({ x: seg.x + Math.cos(normalAngle) * r, y: seg.y + Math.sin(normalAngle) * r });
      rightPoints.push({ x: seg.x - Math.cos(normalAngle) * r, y: seg.y - Math.sin(normalAngle) * r });
    }

    const buildBodyPath = () => {
      ctx.beginPath();
      const head = this.segments[0];
      const snoutR = this.widths[0] * this.scale;
      const snoutX = head.x + Math.cos(head.angle) * snoutR * 1.05;
      const snoutY = head.y + Math.sin(head.angle) * snoutR * 1.05;
      ctx.moveTo(snoutX, snoutY);

      if (leftPoints.length > 1) {
        let xc = (leftPoints[0].x + leftPoints[1].x) / 2, yc = (leftPoints[0].y + leftPoints[1].y) / 2;
        ctx.quadraticCurveTo(leftPoints[0].x, leftPoints[0].y, xc, yc);
        for (let i = 1; i < this.numSegments - 1; i++) {
          let p1 = leftPoints[i], p2 = leftPoints[i + 1];
          xc = (p1.x + p2.x) / 2; yc = (p1.y + p2.y) / 2;
          ctx.bezierCurveTo(p1.x, p1.y, xc, yc, xc, yc);
        }
        ctx.quadraticCurveTo(leftPoints[this.numSegments - 1].x, leftPoints[this.numSegments - 1].y, this.segments[this.numSegments - 1].x, this.segments[this.numSegments - 1].y);
      } else { ctx.lineTo(leftPoints[0].x, leftPoints[0].y); }

      const rightLen = rightPoints.length;
      if (rightLen > 1) {
        let xc = (rightPoints[rightLen - 1].x + rightPoints[rightLen - 2].x) / 2;
        let yc = (rightPoints[rightLen - 1].y + rightPoints[rightLen - 2].y) / 2;
        ctx.quadraticCurveTo(rightPoints[rightLen - 1].x, rightPoints[rightLen - 1].y, xc, yc);
        for (let i = rightLen - 2; i > 0; i--) {
          let p1 = rightPoints[i], p2 = rightPoints[i - 1];
          xc = (p1.x + p2.x) / 2; yc = (p1.y + p2.y) / 2;
          ctx.bezierCurveTo(p1.x, p1.y, xc, yc, xc, yc);
        }
        ctx.quadraticCurveTo(rightPoints[0].x, rightPoints[0].y, snoutX, snoutY);
      } else { ctx.lineTo(rightPoints[0].x, rightPoints[0].y); }
      ctx.closePath();
    };

    buildBodyPath();

    ctx.save();
    ctx.clip();

    const midSeg = this.segments[Math.floor(this.numSegments / 2.5)];
    const lightOffsetX = -Math.sin(midSeg.angle) * 12 * this.scale;
    const lightOffsetY = Math.cos(midSeg.angle) * 12 * this.scale;

    let bodyGrad = ctx.createRadialGradient(
      midSeg.x + lightOffsetX, midSeg.y + lightOffsetY, 0,
      midSeg.x, midSeg.y, 110 * this.scale
    );

    if (this.isDead) {
      bodyGrad.addColorStop(0, '#e0e0e0');
      bodyGrad.addColorStop(0.4, '#b0bec5');
      bodyGrad.addColorStop(1, '#546e7a');
    } else {
      bodyGrad.addColorStop(0, '#ffffff');
      bodyGrad.addColorStop(0.2, this.colors.belly);
      bodyGrad.addColorStop(0.6, this.colors.primary);
      bodyGrad.addColorStop(1, this.colors.secondary);
    }

    ctx.fillStyle = bodyGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 14 * this.scale;
    ctx.shadowBlur = 12 * this.scale;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
    ctx.stroke();

    ctx.shadowBlur = 0;

    if (!this.isDead) {
      if (this.type === 'tilapia') {
        ctx.strokeStyle = 'rgba(38, 50, 56, 0.5)';
        ctx.lineWidth = 4 * this.scale;
        ctx.lineCap = 'round';
        for (let k = 2; k < this.numSegments - 1; k += 1.3) {
          const seg = this.segments[Math.floor(k)];
          const normalAngle = seg.angle + Math.PI / 2;
          const r = this.widths[Math.floor(k)] * this.scale;
          const leftX = seg.x + Math.cos(normalAngle) * r * 0.95;
          const leftY = seg.y + Math.sin(normalAngle) * r * 0.95;
          const rightX = seg.x - Math.cos(normalAngle) * r * 0.95;
          const rightY = seg.y - Math.sin(normalAngle) * r * 0.95;
          const cpX = seg.x - Math.cos(seg.angle) * (r * 0.22);
          const cpY = seg.y - Math.sin(seg.angle) * (r * 0.22);
          ctx.beginPath();
          ctx.moveTo(leftX, leftY);
          ctx.quadraticCurveTo(cpX, cpY, rightX, rightY);
          ctx.stroke();
        }
      } else if (this.type === 'snakehead') {
        ctx.strokeStyle = 'rgba(40, 26, 13, 0.6)';
        ctx.lineWidth = 3.6 * this.scale;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        for (let k = 1; k < this.numSegments - 1; k++) {
          const seg = this.segments[k];
          const r = this.widths[k] * this.scale;
          const normalAngle = seg.angle + Math.PI / 2;
          const leftX = seg.x + Math.cos(normalAngle) * r * 0.9;
          const leftY = seg.y + Math.sin(normalAngle) * r * 0.9;
          const rightX = seg.x - Math.cos(normalAngle) * r * 0.9;
          const rightY = seg.y - Math.sin(normalAngle) * r * 0.9;
          const cpX = seg.x + Math.cos(seg.angle) * (r * 0.45);
          const cpY = seg.y + Math.sin(seg.angle) * (r * 0.45);
          ctx.beginPath();
          ctx.moveTo(leftX, leftY);
          ctx.lineTo(cpX, cpY);
          ctx.lineTo(rightX, rightY);
          ctx.stroke();
        }
      } else if (this.type === 'grass_carp') {
        ctx.strokeStyle = 'rgba(50, 80, 30, 0.45)';
        ctx.lineWidth = 3.0 * this.scale;
        ctx.lineCap = 'round';
        for (let sLine = 0; sLine < 2; sLine++) {
          const offsetRatio = sLine === 0 ? 0.35 : -0.35;
          ctx.beginPath();
          for (let k = 1; k < this.numSegments - 1; k++) {
            const seg = this.segments[k];
            const r = this.widths[k] * this.scale;
            const normalAngle = seg.angle + Math.PI / 2;
            const px = seg.x + Math.cos(normalAngle) * r * offsetRatio;
            const py = seg.y + Math.sin(normalAngle) * r * offsetRatio;
            if (k === 1) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
      } else if (this.type === 'silver_carp') {
        ctx.fillStyle = 'rgba(30, 40, 50, 0.4)';
        for (let k = 1; k < this.numSegments - 2; k++) {
          const seg = this.segments[k];
          const r = this.widths[k] * this.scale;
          const normalAngle = seg.angle + Math.PI / 2;
          // Vẽ đốm (cá mè hoa)
          const dotX1 = seg.x + Math.cos(normalAngle) * r * 0.4;
          const dotY1 = seg.y + Math.sin(normalAngle) * r * 0.4;
          ctx.beginPath(); ctx.arc(dotX1, dotY1, 1.5 * this.scale, 0, Math.PI*2); ctx.fill();
          const dotX2 = seg.x - Math.cos(normalAngle) * r * 0.2;
          const dotY2 = seg.y - Math.sin(normalAngle) * r * 0.2;
          ctx.beginPath(); ctx.arc(dotX2, dotY2, 1.2 * this.scale, 0, Math.PI*2); ctx.fill();
          if (k % 2 === 0) {
            const dotX3 = seg.x + Math.cos(normalAngle) * r * 0.7;
            const dotY3 = seg.y + Math.sin(normalAngle) * r * 0.7;
            ctx.beginPath(); ctx.arc(dotX3, dotY3, 2.0 * this.scale, 0, Math.PI*2); ctx.fill();
          }
        }
      }

      if (this.type !== 'snakehead' && this.type !== 'silver_carp') {
        this.drawProceduralScales(ctx);
      }
    }

    ctx.restore();

    buildBodyPath();
    ctx.strokeStyle = this.isDead ? 'rgba(255,255,255,0.12)' : 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1.0 * this.scale;
    ctx.stroke();
    ctx.restore();
  }

  drawOrganicBlob(ctx, x, y, r, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    const points = 7;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const dist = r * (0.8 + Math.sin(i * 1.8 + y * 0.05) * 0.25);
      const px = x + Math.cos(angle) * dist;
      const py = y + Math.sin(angle) * dist;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawProceduralScales(ctx) {
    if (!Fish.scalePatternCanvas) {
      Fish.scalePatternCanvas = document.createElement('canvas');
      Fish.scalePatternCanvas.width = 16;
      Fish.scalePatternCanvas.height = 16;
      const pCtx = Fish.scalePatternCanvas.getContext('2d');
      pCtx.strokeStyle = 'rgba(255,255,255,0.3)';
      pCtx.lineWidth = 1.2;
      pCtx.beginPath();
      pCtx.moveTo(8, 0); pCtx.lineTo(16, 8); pCtx.lineTo(8, 16); pCtx.lineTo(0, 8); pCtx.closePath();
      pCtx.stroke();
      Fish.scalePattern = pCtx.createPattern(Fish.scalePatternCanvas, 'repeat');
    }

    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';

    const matrix = new DOMMatrix();
    matrix.scaleSelf(this.scale * 0.7, this.scale * 0.7);
    Fish.scalePattern.setTransform(matrix);

    ctx.fillStyle = Fish.scalePattern;

    ctx.beginPath();
    ctx.arc(this.x, this.y, 180 * this.scale, 0, Math.PI * 2);
    ctx.fill();

    let tint = 'rgba(255,255,255,0.08)';
    if (this.type === 'carp') tint = 'rgba(121, 85, 72, 0.15)';
    else if (this.type === 'tilapia') tint = 'rgba(38, 50, 56, 0.15)';
    else if (this.type === 'grass_carp') tint = 'rgba(60, 100, 40, 0.15)';

    ctx.fillStyle = tint;
    ctx.fill();
    ctx.restore();
  }

  draw(ctx, theme = 'ocean') {
    this.drawMudParticles(ctx);
    this.drawLeafParticles(ctx);

    if (this.lifecycleStage === 'egg') { this.drawEggs(ctx); return; }
    if (this.lifecycleStage === 'fry') { this.drawFry(ctx); return; }

    const state = this.getWaterState();
    const isHighlighted = (theme === 'pond') && (this.highlightedPart !== null || this.isHovered);

    if (!this.isDead) {
      ctx.save();
      ctx.translate(0, 35 * this.scale);
      ctx.beginPath();
      const leftPoints = [], rightPoints = [];
      for (let i = 0; i < this.numSegments; i++) {
        const seg = this.segments[i];
        const r = this.widths[i] * this.scale * 0.75;
        const normalAngle = seg.angle + Math.PI / 2;
        leftPoints.push({ x: seg.x + Math.cos(normalAngle) * r, y: seg.y + Math.sin(normalAngle) * r });
        rightPoints.push({ x: seg.x - Math.cos(normalAngle) * r, y: seg.y - Math.sin(normalAngle) * r });
      }
      ctx.moveTo(this.segments[0].x, this.segments[0].y);
      for (let i = 0; i < leftPoints.length; i++) ctx.lineTo(leftPoints[i].x, leftPoints[i].y);
      for (let i = rightPoints.length - 1; i >= 0; i--) ctx.lineTo(rightPoints[i].x, rightPoints[i].y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.fill();
      ctx.restore();
    }

    this.drawFins(ctx, state);
    this.drawSmoothBody(ctx, state);

    if (this.type === 'carp') {
      this.drawBarbels(ctx);
    }

    this.drawMouth(ctx);
    this.drawGillCovers(ctx);
    this.drawEyes(ctx);
    this.drawDorsalFin(ctx, state);

    if (this.type === 'snakehead' && this.isStalking) {
      this._drawStalkIndicator(ctx);
    }

    if (isHighlighted) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.segments[0].x, this.segments[0].y);
      for (let i = 1; i < this.numSegments; i++) ctx.lineTo(this.segments[i].x, this.segments[i].y);
      ctx.strokeStyle = this.toxicLevel >= 80 ? 'rgba(255, 23, 68, 0.65)' : 'rgba(0, 229, 255, 0.55)';
      ctx.lineWidth = 3.5 * this.scale;
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.toxicLevel >= 80 ? '#ff1744' : '#00e5ff';
      ctx.stroke();
      ctx.restore();
      this.drawHeadOrbits(ctx);
      this.drawPhilosophicalSegments(ctx, state);
    }
  }

  _drawStalkIndicator(ctx) {
    const midSeg = this.segments[Math.floor(this.numSegments / 2)];
    const head = this.segments[0];

    const dx = head.x - midSeg.x;
    const dy = head.y - midSeg.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Giảm kích thước vòng radar để ôm sát cá hơn, thẩm mỹ và không trồi lên mặt nước
    const radius = Math.max(70 * this.scale, dist + 20 * this.scale);

    ctx.save();
    ctx.beginPath();
    ctx.arc(midSeg.x, midSeg.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 60, 0, 0.4)';
    ctx.lineWidth = 2.0 * this.scale;
    ctx.setLineDash([8 * this.scale, 10 * this.scale]);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(midSeg.x, midSeg.y, radius + 12 * this.scale, this.wagTime * 0.5, this.wagTime * 0.5 + Math.PI);
    ctx.strokeStyle = 'rgba(255, 60, 0, 0.2)';
    ctx.lineWidth = 4.0 * this.scale;
    ctx.setLineDash([]);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(midSeg.x, midSeg.y, radius + 12 * this.scale, this.wagTime * 0.5 + Math.PI * 1.2, this.wagTime * 0.5 + Math.PI * 1.8);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 60, 0, 0.8)';
    ctx.font = `italic ${12 * this.scale}px Outfit, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('TARGET LOCK', midSeg.x, midSeg.y - radius - 18 * this.scale);
    ctx.restore();
  }

  drawMouth(ctx) {
    ctx.save();
    const head = this.segments[0];
    const r = this.widths[0] * this.scale;
    ctx.translate(head.x, head.y);
    ctx.rotate(head.angle);
    if (this.deadRotation > 0) ctx.scale(1, Math.cos(this.deadRotation));
    
    if (this.type === 'silver_carp') {
      ctx.rotate(-0.2); // Miệng hếch ngược lên
    }

    let lipGrad = ctx.createLinearGradient(r, 0, r + 5 * this.scale, 0);
    lipGrad.addColorStop(0, this.colors.secondary || '#ff5722');
    lipGrad.addColorStop(1, 'rgba(255,255,255,0.5)');

    ctx.fillStyle = lipGrad;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1.0 * this.scale;

    const lipOpenOffset = this.mouthOpen * 5.5 * this.scale;
    let lipR_W = 6.0 * this.scale;
    let lipR_H = 3.8 * this.scale;
    if (this.type === 'silver_carp') {
      lipR_W = 8.5 * this.scale;
      lipR_H = 5.0 * this.scale;
    }

    ctx.beginPath();
    ctx.ellipse(r - 1.0 * this.scale, -lipOpenOffset, lipR_W, lipR_H, 0.15, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(r - 1.0 * this.scale, lipOpenOffset, lipR_W, lipR_H, -0.15, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  drawGillCovers(ctx) {
    ctx.save();
    const seg1 = this.segments[1];
    const r = this.widths[1] * this.scale;
    ctx.translate(seg1.x, seg1.y);
    ctx.rotate(seg1.angle);
    if (this.deadRotation > 0) ctx.scale(1, Math.cos(this.deadRotation));
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.lineWidth = 1.8 * this.scale;
    ctx.beginPath(); ctx.arc(-r * 0.1, r * 0.65, r * 0.45, Math.PI, Math.PI * 1.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(-r * 0.1, -r * 0.65, r * 0.45, Math.PI * 0.5, Math.PI); ctx.stroke();
    ctx.restore();
  }

  drawBarbels(ctx) {
    ctx.save();
    const head = this.segments[0];
    const r = this.widths[0] * this.scale;
    const leftAngle = head.angle + 0.65;
    const rightAngle = head.angle - 0.65;
    const leftBaseX = head.x + Math.cos(leftAngle) * r * 0.75;
    const leftBaseY = head.y + Math.sin(leftAngle) * r * 0.75;
    const rightBaseX = head.x + Math.cos(rightAngle) * r * 0.75;
    const rightBaseY = head.y + Math.sin(rightAngle) * r * 0.75;
    const barbelLen = (this.type === 'grass_carp' ? 10 : 14) * this.scale;
    const waveLeft = Math.sin(this.wagTime * 0.8) * 4 * this.scale;
    const waveRight = Math.sin(this.wagTime * 0.8 + 1.5) * 4 * this.scale;
    ctx.strokeStyle = this.colors.secondary;
    ctx.lineWidth = 1.6 * this.scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(leftBaseX, leftBaseY);
    ctx.quadraticCurveTo(leftBaseX - Math.cos(head.angle) * (barbelLen * 0.5), leftBaseY - Math.sin(head.angle) * (barbelLen * 0.5) + waveLeft, leftBaseX - Math.cos(head.angle) * barbelLen, leftBaseY - Math.sin(head.angle) * barbelLen + waveLeft);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rightBaseX, rightBaseY);
    ctx.quadraticCurveTo(rightBaseX - Math.cos(head.angle) * (barbelLen * 0.5), rightBaseY - Math.sin(head.angle) * (barbelLen * 0.5) + waveRight, rightBaseX - Math.cos(head.angle) * barbelLen, rightBaseY - Math.sin(head.angle) * barbelLen + waveRight);
    ctx.stroke();
    ctx.restore();
  }

  drawHeadOrbits(ctx) {
    if (this.struggleFrequency === 0 || this.isDead) return;
    const head = this.segments[0];
    const headRadius = this.widths[0] * this.scale;
    const orbitRadius = headRadius * 2.2;
    const chargeRadius = 5 * this.scale;
    const orbits = [
      { angleOffset: 0, color: '#00e676', name: 'Đồng hóa' },
      { angleOffset: Math.PI, color: '#ff1744', name: 'Dị hóa' }
    ];
    orbits.forEach(orbit => {
      const finalAngle = this.orbitAngle + orbit.angleOffset;
      const ox = head.x + Math.cos(finalAngle) * orbitRadius;
      const oy = head.y + Math.sin(finalAngle) * orbitRadius;
      ctx.save();
      ctx.shadowBlur = 15 * this.scale;
      ctx.shadowColor = orbit.color;
      ctx.beginPath(); ctx.moveTo(head.x, head.y); ctx.lineTo(ox, oy);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(ox, oy, chargeRadius, 0, Math.PI * 2);
      ctx.fillStyle = orbit.color; ctx.fill();
      ctx.beginPath(); ctx.arc(ox - 1, oy - 1, chargeRadius * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.fillStyle = '#cfd8dc';
      ctx.font = "italic 9px 'Outfit', sans-serif";
      ctx.shadowBlur = 0;
      ctx.fillText(orbit.name, ox + 8, oy + 3);
      ctx.restore();
    });
  }

  drawFins(ctx, state) {
    ctx.save();
    const seg1 = this.segments[1];
    const seg3 = this.segments[3];
    const seg7 = this.segments[7];
    const finLen = 25 * this.scale;

    const hexToRgb = (hex) => {
      let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) : '255,255,255';
    };

    const getFinGradient = (x1, y1, x2, y2) => {
      let grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, state.primary);
      grad.addColorStop(0.5, `rgba(${hexToRgb(state.secondary)}, 0.6)`);
      grad.addColorStop(1, `rgba(${hexToRgb(state.secondary)}, 0)`);
      return grad;
    };

    ctx.save();
    ctx.translate(seg1.x, seg1.y);
    ctx.rotate(seg1.angle);
    if (this.deadRotation > 0) ctx.scale(1, Math.cos(this.deadRotation));
    const turnAngle = this.segments[0].angle - this.segments[1].angle;
    const turnOffset = Math.max(-0.4, Math.min(0.4, turnAngle));
    const swimRhythm = Math.sin(this.wagTime - Math.PI / 4) * 0.25;
    const leftAngle = Math.PI / 2 + swimRhythm - turnOffset * 0.25;
    const rightAngle = -Math.PI / 2 - swimRhythm - turnOffset * 0.25;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(Math.cos(leftAngle - 0.2) * finLen, Math.sin(leftAngle - 0.2) * finLen, Math.cos(leftAngle + 0.3) * finLen, Math.sin(leftAngle + 0.3) * finLen, Math.cos(leftAngle + 0.5) * (finLen * 0.45), Math.sin(leftAngle + 0.5) * (finLen * 0.45));
    ctx.fillStyle = getFinGradient(0, 0, Math.cos(leftAngle) * finLen, Math.sin(leftAngle) * finLen);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 0.6 * this.scale;
    for (let j = -2; j <= 2; j++) {
      ctx.beginPath(); ctx.moveTo(0, 0);
      const rAngle = leftAngle - j * 0.12;
      const rLen = finLen * (0.8 + Math.cos(j * 0.3) * 0.2);
      ctx.quadraticCurveTo(Math.cos(rAngle - 0.1) * rLen * 0.5, Math.sin(rAngle - 0.1) * rLen * 0.5, Math.cos(rAngle) * rLen, Math.sin(rAngle) * rLen);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(Math.cos(rightAngle + 0.2) * finLen, Math.sin(rightAngle + 0.2) * finLen, Math.cos(rightAngle - 0.3) * finLen, Math.sin(rightAngle - 0.3) * finLen, Math.cos(rightAngle - 0.5) * (finLen * 0.45), Math.sin(rightAngle - 0.5) * (finLen * 0.45));
    ctx.fillStyle = getFinGradient(0, 0, Math.cos(rightAngle) * finLen, Math.sin(rightAngle) * finLen);
    ctx.fill();
    for (let j = -2; j <= 2; j++) {
      ctx.beginPath(); ctx.moveTo(0, 0);
      const rAngle = rightAngle - j * 0.12;
      const rLen = finLen * (0.8 + Math.cos(j * 0.3) * 0.2);
      ctx.quadraticCurveTo(Math.cos(rAngle + 0.1) * rLen * 0.5, Math.sin(rAngle + 0.1) * rLen * 0.5, Math.cos(rAngle) * rLen, Math.sin(rAngle) * rLen);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(seg3.x, seg3.y);
    ctx.rotate(seg3.angle);
    if (this.deadRotation > 0) ctx.scale(1, Math.cos(this.deadRotation));
    const pelvicLen = finLen * 0.65;
    const pLeftAngle = Math.PI / 2 + 0.15 + Math.sin(this.wagTime - 0.5) * 0.1;
    const pRightAngle = -Math.PI / 2 - 0.15 - Math.sin(this.wagTime - 0.5) * 0.1;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(Math.cos(pLeftAngle - 0.1) * pelvicLen, Math.sin(pLeftAngle - 0.1) * pelvicLen, Math.cos(pLeftAngle + 0.2) * pelvicLen, Math.sin(pLeftAngle + 0.2) * pelvicLen, Math.cos(pLeftAngle + 0.4) * (pelvicLen * 0.5), Math.sin(pLeftAngle + 0.4) * (pelvicLen * 0.5));
    ctx.fillStyle = getFinGradient(0, 0, Math.cos(pLeftAngle) * pelvicLen, Math.sin(pLeftAngle) * pelvicLen); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(Math.cos(pRightAngle + 0.1) * pelvicLen, Math.sin(pRightAngle + 0.1) * pelvicLen, Math.cos(pRightAngle - 0.2) * pelvicLen, Math.sin(pRightAngle - 0.2) * pelvicLen, Math.cos(pRightAngle - 0.4) * (pelvicLen * 0.5), Math.sin(pRightAngle - 0.4) * (pelvicLen * 0.5));
    ctx.fillStyle = getFinGradient(0, 0, Math.cos(pRightAngle) * pelvicLen, Math.sin(pRightAngle) * pelvicLen); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(seg7.x, seg7.y);
    ctx.rotate(seg7.angle);
    if (this.deadRotation > 0) ctx.scale(1, Math.cos(this.deadRotation));
    const analLen = finLen * 0.75;
    const analAngle = Math.PI - 0.35 + Math.sin(this.wagTime * 1.1) * 0.12;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(Math.cos(analAngle - 0.2) * analLen, Math.sin(analAngle - 0.2) * analLen, Math.cos(analAngle + 0.2) * analLen, Math.sin(analAngle + 0.2) * analLen, 0, 0);
    ctx.fillStyle = getFinGradient(0, 0, Math.cos(analAngle) * analLen, Math.sin(analAngle) * analLen); ctx.fill();
    ctx.restore();

    const tailSeg = this.segments[this.numSegments - 1];
    ctx.save();
    ctx.translate(tailSeg.x, tailSeg.y);
    ctx.rotate(tailSeg.angle);
    if (this.deadRotation > 0) ctx.scale(1, Math.cos(this.deadRotation));
    const tailAngle = 0 + Math.sin(this.wagTime * 1.2) * 0.25;
    const tailLen = 35 * this.scale;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    if (this.type === 'tilapia') {
      ctx.bezierCurveTo(Math.cos(tailAngle - 0.7) * tailLen, Math.sin(tailAngle - 0.7) * tailLen, Math.cos(tailAngle) * (tailLen * 1.3), Math.sin(tailAngle) * (tailLen * 1.3), Math.cos(tailAngle + 0.7) * tailLen, Math.sin(tailAngle + 0.7) * tailLen);
    } else if (this.type === 'snakehead') {
      ctx.bezierCurveTo(Math.cos(tailAngle - 0.55) * tailLen, Math.sin(tailAngle - 0.55) * tailLen, Math.cos(tailAngle) * (tailLen * 1.25), Math.sin(tailAngle) * (tailLen * 1.25), Math.cos(tailAngle + 0.55) * tailLen, Math.sin(tailAngle + 0.55) * tailLen);
    } else if (this.type === 'silver_carp') {
      const tl = tailLen * 1.3;
      ctx.bezierCurveTo(Math.cos(tailAngle - 0.7) * tl, Math.sin(tailAngle - 0.7) * tl, Math.cos(tailAngle - 0.1) * (tl * 1.2), Math.sin(tailAngle - 0.1) * (tl * 1.2), Math.cos(tailAngle) * (tl * 0.35), Math.sin(tailAngle) * (tl * 0.35));
      ctx.bezierCurveTo(Math.cos(tailAngle + 0.1) * (tl * 1.2), Math.sin(tailAngle + 0.1) * (tl * 1.2), Math.cos(tailAngle + 0.7) * tl, Math.sin(tailAngle + 0.7) * tl, 0, 0);
    } else if (this.type === 'grass_carp') {
      const tl = tailLen * 1.12;
      ctx.bezierCurveTo(Math.cos(tailAngle - 0.5) * tl, Math.sin(tailAngle - 0.5) * tl, Math.cos(tailAngle - 0.1) * (tl * 1.25), Math.sin(tailAngle - 0.1) * (tl * 1.25), Math.cos(tailAngle) * (tl * 0.82), Math.sin(tailAngle) * (tl * 0.82));
      ctx.bezierCurveTo(Math.cos(tailAngle + 0.1) * (tl * 1.25), Math.sin(tailAngle + 0.1) * (tl * 1.25), Math.cos(tailAngle + 0.5) * tl, Math.sin(tailAngle + 0.5) * tl, 0, 0);
    } else {
      ctx.bezierCurveTo(Math.cos(tailAngle - 0.5) * tailLen, Math.sin(tailAngle - 0.5) * tailLen, Math.cos(tailAngle - 0.1) * (tailLen * 1.3), Math.sin(tailAngle - 0.1) * (tailLen * 1.3), Math.cos(tailAngle) * (tailLen * 0.8), Math.sin(tailAngle) * (tailLen * 0.8));
      ctx.bezierCurveTo(Math.cos(tailAngle + 0.1) * (tailLen * 1.3), Math.sin(tailAngle + 0.1) * (tailLen * 1.3), Math.cos(tailAngle + 0.5) * tailLen, Math.sin(tailAngle + 0.5) * tailLen, 0, 0);
    }

    let finGrad = ctx.createLinearGradient(0, 0, Math.cos(tailAngle) * tailLen, Math.sin(tailAngle) * tailLen);
    finGrad.addColorStop(0, state.primary);
    finGrad.addColorStop(0.3, state.secondary);
    finGrad.addColorStop(1, `rgba(${hexToRgb(state.secondary)}, 0)`);
    ctx.fillStyle = finGrad; ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 0.8 * this.scale;
    const rayCount = this.type === 'tilapia' ? 12 : 9;
    const spread = this.type === 'tilapia' ? 0.12 : 0.08;
    for (let j = -Math.floor(rayCount / 2); j <= Math.floor(rayCount / 2); j++) {
      ctx.beginPath(); ctx.moveTo(0, 0);
      const rAngle = tailAngle + j * spread;
      const rLen = tailLen * (this.type === 'tilapia' ? 0.92 : 0.8 - Math.abs(j) * 0.05);
      ctx.quadraticCurveTo(Math.cos(rAngle + 0.1) * rLen * 0.5, Math.sin(rAngle + 0.1) * rLen * 0.5, Math.cos(rAngle) * rLen, Math.sin(rAngle) * rLen);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }

  drawDorsalFin(ctx, state) {
    ctx.save();

    const hexToRgb = (hex) => {
      let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) : '255,255,255';
    };

    ctx.beginPath();
    let segStart = this.segments[2];
    ctx.moveTo(segStart.x, segStart.y);
    for (let i = 3; i <= 7; i++) { let seg = this.segments[i]; ctx.lineTo(seg.x, seg.y); }
    for (let i = 7; i >= 2; i--) {
      let seg = this.segments[i];
      let r = this.widths[i] * this.scale;
      let finW = r * 0.35;
      let sway = Math.sin(this.wagTime - i * 0.3) * 0.18;
      let angle = seg.angle + Math.PI / 2 + sway;
      ctx.lineTo(seg.x + Math.cos(angle) * finW, seg.y + Math.sin(angle) * finW);
    }
    ctx.closePath();

    let grad = ctx.createLinearGradient(this.segments[2].x, this.segments[2].y, this.segments[7].x, this.segments[7].y);
    grad.addColorStop(0, state.primary);
    grad.addColorStop(0.5, `rgba(${hexToRgb(state.secondary)}, 0.7)`);
    grad.addColorStop(1, `rgba(${hexToRgb(state.secondary)}, 0)`);
    ctx.fillStyle = grad; ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.8 * this.scale;
    for (let i = 2; i <= 7; i++) {
      let seg = this.segments[i]; let r = this.widths[i] * this.scale;
      let finW = r * 0.35; let sway = Math.sin(this.wagTime - i * 0.3) * 0.18;
      let angle = seg.angle + Math.PI / 2 + sway;
      ctx.beginPath(); ctx.moveTo(seg.x, seg.y);
      ctx.quadraticCurveTo(seg.x + Math.cos(angle - 0.1) * finW * 0.5, seg.y + Math.sin(angle - 0.1) * finW * 0.5, seg.x + Math.cos(angle) * finW, seg.y + Math.sin(angle) * finW);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPhilosophicalSegments(ctx, state) {
    for (let i = 0; i < this.numSegments; i++) {
      ctx.save();
      let seg = this.segments[i];
      let r = this.widths[i] * this.scale;
      ctx.translate(seg.x, seg.y);
      ctx.rotate(seg.angle);
      if (this.deadRotation > 0) ctx.scale(1, Math.cos(this.deadRotation));
      ctx.shadowBlur = 12 * this.scale;

      if (i >= 0 && i <= 2) {
        ctx.shadowColor = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, Math.PI * 2); ctx.fillStyle = 'rgba(0, 230, 118, 0.38)'; ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI); ctx.fillStyle = 'rgba(255, 23, 68, 0.38)'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)'; ctx.lineWidth = 1; ctx.stroke();
      } else if (i >= 3 && i <= 6) {
        if (this.leapAnimationTimer > 0) {
          const hue = (this.leapAnimationTimer * 20) % 360;
          ctx.fillStyle = `hsla(${hue}, 100%, 70%, 0.4)`;
          ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        }
        if (this.leapAnimationTimer === 0) {
          const coreSize = 0.2 + (this.toxicLevel / 100) * 0.5;
          ctx.beginPath(); ctx.arc(0, 0, r * Math.min(0.8, coreSize), 0, Math.PI * 2);
          ctx.fillStyle = this.toxicLevel >= 80 ? 'rgba(255, 23, 68, 0.35)' : 'rgba(255, 255, 255, 0.25)';
          ctx.fill();
        }
      }

      const isPartHighlighted = (this.highlightedPart === 'all');
      if (isPartHighlighted) {
        ctx.save();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
        ctx.beginPath();
        const startAng = (i % 2 === 0 ? this.orbitAngle : -this.orbitAngle) * 0.5;
        ctx.arc(0, 0, r + 8 * this.scale, startAng, startAng + Math.PI * 2);
        ctx.shadowColor = state.secondary; ctx.shadowBlur = 10 * this.scale; ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
  }

  drawEyes(ctx) {
    const head = this.segments[0];
    const headRadius = this.widths[0] * this.scale;
    let eyeRadius = 4.0 * this.scale;
    let pupilRadius = 1.8 * this.scale;
    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(head.angle);
    if (this.deadRotation > 0) ctx.scale(1, Math.cos(this.deadRotation));
    
    let eyeX = Math.cos(0.65) * (headRadius * 0.75);
    let eyeY_L = Math.sin(0.65) * (headRadius * 0.75);
    let eyeY_R = -Math.sin(0.65) * (headRadius * 0.75);

    if (this.type === 'snakehead') {
      eyeRadius = 3.0 * this.scale;
      pupilRadius = 1.2 * this.scale;
      eyeX = Math.cos(0.35) * (headRadius * 0.65);
      eyeY_L = Math.sin(0.35) * (headRadius * 0.65);
      eyeY_R = -Math.sin(0.35) * (headRadius * 0.65);
    } else if (this.type === 'silver_carp') {
      eyeRadius = 3.2 * this.scale;
      pupilRadius = 1.4 * this.scale;
      eyeX = Math.cos(1.0) * (headRadius * 0.85);
      eyeY_L = Math.sin(1.0) * (headRadius * 0.85);
      eyeY_R = -Math.sin(1.0) * (headRadius * 0.85);
    }

    if (this.isDead) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(eyeX - 2, eyeY_L - 2); ctx.lineTo(eyeX + 2, eyeY_L + 2); ctx.moveTo(eyeX + 2, eyeY_L - 2); ctx.lineTo(eyeX - 2, eyeY_L + 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(eyeX - 2, eyeY_R - 2); ctx.lineTo(eyeX + 2, eyeY_R + 2); ctx.moveTo(eyeX + 2, eyeY_R - 2); ctx.lineTo(eyeX - 2, eyeY_R + 2); ctx.stroke();
    } else {
      let irisColor = '#cfd8dc';
      if (this.type === 'carp') irisColor = '#ffb300';
      else if (this.type === 'tilapia') irisColor = '#90a4ae';
      else if (this.type === 'grass_carp') irisColor = '#81c784';
      else if (this.type === 'snakehead') irisColor = '#ff5722';
      const lookOffset = 0.5 * this.scale;

      [eyeY_L, eyeY_R].forEach(eyeY => {
        let irisGrad = ctx.createRadialGradient(eyeX, eyeY, pupilRadius, eyeX, eyeY, eyeRadius);
        irisGrad.addColorStop(0, '#ffffff');
        irisGrad.addColorStop(0.3, irisColor);
        irisGrad.addColorStop(1, '#333333');

        ctx.fillStyle = irisGrad;
        ctx.beginPath(); ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 0.8; ctx.stroke();

        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath(); ctx.arc(eyeX + lookOffset, eyeY, pupilRadius, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath(); ctx.arc(eyeX + lookOffset - 1.0 * this.scale, eyeY - 1.0 * this.scale, 0.8 * this.scale, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath(); ctx.arc(eyeX + lookOffset + 1.2 * this.scale, eyeY + 1.2 * this.scale, 0.4 * this.scale, 0, Math.PI * 2); ctx.fill();
      });
    }
    ctx.restore();
  }
}
