<template>
  <div ref="container" class="dice-container"></div>
  <div class="controls">
    <button @click="rotate('up')">위로 회전</button>
    <button @click="rotate('down')">아래로 회전</button>
    <button @click="rotate('left')">왼쪽으로 회전</button>
    <button @click="rotate('right')">오른쪽으로 회전</button>
    <button @click="randomRotate">무작위 회전</button>
  </div>
</template>

<script>
import * as THREE from 'three';
import { TWEEN } from '@tweenjs/tween.js';
// eslint-disable-next-line no-import-assign
THREE.useLegacyLights = true;  // 프록시 이슈 방지

export default {
  name: 'Dice3D',
  data() {
    return {
      scene: null,
      camera: null,
      renderer: null,
      dice: null,
      isAnimating: false,
    };
  },
  mounted() {
    this.initThreeJS();
    this.animate();
  },
  methods: {
    initThreeJS() {
      // Scene 설정
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xf0f0f0);

      // Camera 설정
      this.camera = new THREE.PerspectiveCamera(
        75,
        this.$refs.container.clientWidth / this.$refs.container.clientHeight,
        0.1,
        1000
      );
      this.camera.position.z = 5;

      // Renderer 설정
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(
        this.$refs.container.clientWidth,
        this.$refs.container.clientHeight
      );
      this.$refs.container.appendChild(this.renderer.domElement);

      // 주사위 생성
      this.createDice();

      // 윈도우 리사이즈 이벤트
      window.addEventListener('resize', this.onWindowResize);
    },
    createDice() {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      
      // 주사위 각 면에 다른 텍스처를 적용하기 위한 재질 배열
      const materials = [
        new THREE.MeshBasicMaterial({ color: 0xffffff }), // 오른쪽 (빨강)
        new THREE.MeshBasicMaterial({ color: 0xffffff }), // 왼쪽 (초록)
        new THREE.MeshBasicMaterial({ color: 0xffffff }), // 위 (파랑)
        new THREE.MeshBasicMaterial({ color: 0xffffff }), // 아래 (노랑)
        new THREE.MeshBasicMaterial({ color: 0xffffff }), // 앞 (흰색)
        new THREE.MeshBasicMaterial({ color: 0xffffff }), // 뒤 (검정)
      ];

      // 주사위 눈 생성
      this.createDiceDots(materials);

      this.dice = new THREE.Mesh(geometry, materials);
      this.scene.add(this.dice);
    },
    createDiceDots(materials) {
      // 각 면에 주사위 눈을 그리는 함수
      const dotColor = 0x000000;
      
      // 1 (앞면)
      materials[4] = this.createDiceFace(1, dotColor);
      
      // 2 (오른쪽)
      materials[0] = this.createDiceFace(2, dotColor);
      
      // 3 (위쪽)
      materials[2] = this.createDiceFace(3, dotColor);
      
      // 4 (아래쪽)
      materials[3] = this.createDiceFace(4, dotColor);
      
      // 5 (왼쪽)
      materials[1] = this.createDiceFace(5, dotColor);
      
      // 6 (뒷면)
      materials[5] = this.createDiceFace(6, dotColor);
    },
    createDiceFace(value, dotColor) {
      // Canvas를 사용하여 주사위 면 텍스처 생성
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const context = canvas.getContext('2d');
      
      // 배경
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // 점 그리기
      context.fillStyle = `#${dotColor.toString(16).padStart(6, '0')}`;
      
      const dotPositions = {
        1: [[0.5, 0.5]],
        2: [[0.25, 0.25], [0.75, 0.75]],
        3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
        4: [[0.25, 0.25], [0.25, 0.75], [0.75, 0.25], [0.75, 0.75]],
        5: [[0.25, 0.25], [0.25, 0.75], [0.5, 0.5], [0.75, 0.25], [0.75, 0.75]],
        6: [[0.25, 0.25], [0.25, 0.5], [0.25, 0.75], [0.75, 0.25], [0.75, 0.5], [0.75, 0.75]]
      };
      
      const positions = dotPositions[value];
      const dotSize = canvas.width / 8;
      
      positions.forEach(pos => {
        context.beginPath();
        context.arc(
          pos[0] * canvas.width,
          pos[1] * canvas.height,
          dotSize,
          0,
          Math.PI * 2
        );
        context.fill();
      });
      
      // Canvas를 텍스처로 변환
      const texture = new THREE.CanvasTexture(canvas);
      return new THREE.MeshBasicMaterial({ map: texture });
    },
    rotate(direction) {
      if (this.isAnimating) return;
      this.isAnimating = true;
      
      const targetRotation = { x: this.dice.rotation.x, y: this.dice.rotation.y };
      const duration = 1000;
      
      switch (direction) {
        case 'up':
          targetRotation.x += Math.PI / 2;
          break;
        case 'down':
          targetRotation.x -= Math.PI / 2;
          break;
        case 'left':
          targetRotation.y += Math.PI / 2;
          break;
        case 'right':
          targetRotation.y -= Math.PI / 2;
          break;
      }
      
      new TWEEN.Tween(this.dice.rotation)
        .to(targetRotation, duration)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => {
          this.isAnimating = false;
        })
        .start();
    },
    randomRotate() {
      if (this.isAnimating) return;
      this.isAnimating = true;
      
      const targetRotation = {
        x: this.dice.rotation.x + (Math.random() * Math.PI * 2 - Math.PI),
        y: this.dice.rotation.y + (Math.random() * Math.PI * 2 - Math.PI),
        z: this.dice.rotation.z + (Math.random() * Math.PI * 2 - Math.PI)
      };
      
      new TWEEN.Tween(this.dice.rotation)
        .to(targetRotation, 2000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => {
          this.isAnimating = false;
        })
        .start();
    },
    onWindowResize() {
      this.camera.aspect = this.$refs.container.clientWidth / this.$refs.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(
        this.$refs.container.clientWidth,
        this.$refs.container.clientHeight
      );
    },
    animate() {
			if (!this.scene || !this.camera || !this.renderer) {
				console.error("Three.js 요소가 초기화되지 않았습니다!");
				return;
			}

			requestAnimationFrame(this.animate);
			
			// TWEEN.update() 호출 전에 TWEEN이 존재하는지 확인
			if (typeof TWEEN !== 'undefined' && TWEEN.update) {
				TWEEN.update();
			}

			this.renderer.render(this.scene, this.camera);
		},
  },
  beforeUnmount() {
		window.removeEventListener('resize', this.onWindowResize);
		
		if (this.renderer) {
			this.renderer.dispose(); // WebGL 리소스 해제
		}
		
		// TWEEN 애니메이션 중지
		if (typeof TWEEN !== 'undefined') {
			TWEEN.removeAll();
		}
	},
};
</script>

<style scoped>
.dice-container {
  width: 100%;
  height: 500px;
  margin: 0 auto;
}

.controls {
  margin-top: 20px;
  text-align: center;
}

button {
  margin: 0 10px;
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background-color: #45a049;
}
</style>