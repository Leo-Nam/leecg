<template>
  <div class="sky-container">
    <svg class="filter-defs">
      <defs>
        <filter id="cloudy" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="5" seed="1" />
          <feDisplacementMap in="SourceGraphic" scale="15" />
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
    </svg>
    
    <div 
      v-for="(cloud, index) in clouds" 
      :key="index"
      class="cloud"
      :style="getCloudStyle(cloud)"
    ></div>
    
    <button @click="addCloud" class="add-cloud-btn">구름 추가</button>
  </div>
</template>

<script>
export default {
  name: 'NaturalCloudSimulation',
  data() {
    return {
      clouds: [],
      maxClouds: 10,
      containerWidth: window.innerWidth,
      containerHeight: window.innerHeight * 0.7,
      cloudShapes: [
        { parts: 4, sizeVariation: 0.6 },
        { parts: 5, sizeVariation: 0.8 },
        { parts: 3, sizeVariation: 0.4 }
      ]
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize);
    
    // 초기 구름 생성
    for (let i = 0; i < 3; i++) {
      this.addCloud();
    }
    
    // 주기적으로 구름 생성
    this.cloudInterval = setInterval(() => {
      if (this.clouds.length < this.maxClouds) {
        this.addCloud();
      }
    }, 5000);
  },
  unMounted() {
    window.removeEventListener('resize', this.handleResize);
    clearInterval(this.cloudInterval);
  },
  methods: {
    handleResize() {
      this.containerWidth = window.innerWidth;
      this.containerHeight = window.innerHeight;
    },
    getCloudStyle(cloud) {
      return {
        left: cloud.left + 'px',
        top: cloud.top + 'px',
        width: cloud.size + 'px',
        height: cloud.size * 0.5 + 'px',
        opacity: cloud.opacity,
        animationDuration: cloud.speed + 's',
        filter: 'url(#cloudy)',
        '--parts': cloud.parts,
        '--size-variation': cloud.sizeVariation
      }
    },
    addCloud() {
      const baseSize = Math.random() * 150 + 100; // 100~250px
      const speed = Math.random() * 30 + 20; // 20~50초
      const opacity = Math.random() * 0.6 + 0.3; // 0.3~0.9
      const shape = this.cloudShapes[Math.floor(Math.random() * this.cloudShapes.length)];
      
      const newCloud = {
        left: -baseSize * 1.5,
        top: Math.random() * this.containerHeight * 0.7,
        size: baseSize,
        speed: speed,
        opacity: opacity,
        parts: shape.parts,
        sizeVariation: shape.sizeVariation
      };
      
      this.clouds.push(newCloud);
      
      // 애니메이션 종료 후 구름 제거
      setTimeout(() => {
        this.clouds = this.clouds.filter(c => c !== newCloud);
      }, speed * 1000);
    }
  }
}
</script>

<style>
.sky-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(to bottom, #87CEEB, #E0F7FA);
  overflow: hidden;
}

.filter-defs {
  position: absolute;
  width: 0;
  height: 0;
}

.cloud {
  position: absolute;
  background: white;
  border-radius: 50%;
  animation: moveCloud linear forwards;
  filter: url(#cloudy);
}

.cloud::before {
  content: '';
  position: absolute;
  background: white;
  border-radius: 50%;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  filter: url(#cloudy);
}

/* 다중 구름 파트 생성 */
.cloud::after {
  content: '';
  position: absolute;
  background: white;
  border-radius: 50%;
  width: calc(100% * var(--size-variation));
  height: calc(100% * var(--size-variation));
  top: 20%;
  left: 20%;
  filter: url(#cloudy);
}

/* 추가 구름 파트들 */
.cloud .cloud-part {
  position: absolute;
  background: white;
  border-radius: 50%;
  filter: url(#cloudy);
}

@keyframes moveCloud {
  to {
    transform: translateX(calc(100vw + 300px));
  }
}

.add-cloud-btn {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  background: rgba(255,255,255,0.8);
  border: none;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  z-index: 100;
  font-family: Arial, sans-serif;
  font-size: 14px;
}

.add-cloud-btn:hover {
  background: rgba(255,255,255,1);
}
</style>