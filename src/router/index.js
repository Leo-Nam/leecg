import { createRouter, createWebHistory } from 'vue-router';
import authGuard from '@/middleware/authGuard'; // 모듈화된 가드 함수

const routes = [
  {
    path: "/",
    name: "/",
    component: () => import("@/views/IndexView.vue"),
    children: [
      // --- service 라우트 ---
      {
        path: 'service',
        name: 'serviceIndex',
        component: () => import('@/views/services/IndexView.vue'),
        children: [
          {
            path: 'main',
            name: 'serviceMain',
            component: () => import("@/views/services/main/IndexView.vue"),
          },
          {
            path: 'mealMenu',
            name: 'mealMenu',
            component: () => import("@/views/services/mealMenu/IndexView.vue"),
          },
          {
            path: 'timeTable',
            name: 'timeTable',
            component: () => import("@/views/services/timeTable/IndexView.vue"),
          },
          {
            path: 'notifications',
            name: 'notifications',
            component: () => import("@/views/services/notifications/IndexView.vue"),
          },
          {
            path: 'exams',
            name: 'exams',
            component: () => import("@/views/services/exams/IndexView.vue"),
          },
          {
            path: 'gallery',
            name: 'gallery',
            component: () => import("@/views/services/gallery/IndexView.vue"),
          },
          {
            path: 'errorReport',
            name: 'errorReport',
            component: () => import("@/views/services/errorReport/IndexView.vue"),
          },
          {
            path: 'jabDongsani',
            name: 'jabDongsani',
            component: () => import("@/views/services/jabDongsani/IndexView.vue"),
            children: [
              {
                path: 'main',
                name: 'jabDongsaniMain',
                component: () => import("@/views/services/jabDongsani/main/IndexView.vue"),
              },
              {
                path: 'solarSystem',
                name: 'solarSystem',
                component: () => import("@/views/services/jabDongsani/solarSystem/IndexView.vue"),
              },
              {
                path: 'solarSystem_v2',
                name: 'solarSystem_v2',
                component: () => import("@/views/services/jabDongsani/solarSystem_v2/IndexView.vue"),
              },
              {
                path: 'wheelSpinnerGame',
                name: 'wheelSpinnerGame',
                component: () => import("@/views/services/jabDongsani/wheelSpinnerGame/IndexView.vue"),
              },
              {
                path: 'aStarTrackingMaze',
                name: 'aStarTrackingMaze',
                component: () => import("@/views/services/jabDongsani/aStarTrackingMaze/IndexView.vue"),
              },
              {
                path: 'fortRess',
                name: 'fortRess',
                component: () => import("@/views/services/jabDongsani/fortRess/IndexView.vue"),
              },
              {
                path: 'cloudSimul',
                name: 'cloudSimul',
                component: () => import("@/views/services/jabDongsani/cloudSimul/IndexView.vue"),
              },
              {
                path: 'snakeSimul',
                name: 'snakeSimul',
                component: () => import("@/views/services/jabDongsani/snakeSimul/IndexView.vue"),
              },
              {
                path: 'snakeSimul_v2',
                name: 'snakeSimul_v2',
                component: () => import("@/views/services/jabDongsani/snakeSimul_v2/IndexView.vue"),
              },
              {
                path: 'snakeSimul_v3',
                name: 'snakeSimul_v3',
                component: () => import("@/views/services/jabDongsani/snakeSimul_v3/IndexView.vue"),
              },
              {
                path: 'guestBook',
                name: 'guestBook',
                component: () => import("@/views/services/jabDongsani/guestBook/IndexView.vue"),
              },
              {
                path: 'tetris',
                name: 'tetris',
                component: () => import("@/views/services/jabDongsani/tetris/IndexView.vue"),
              },
              {
                path: 'billiards',
                name: 'billiards',
                component: () => import("@/views/services/jabDongsani/billiards/IndexView.vue"),
              },
            ]
          },
        ]
      },
      {
        path: 'privacyPolicy',
        name: 'privacyPolicy',
        component: () => import('@/views/privacyPolicy/IndexView.vue'),
      },
    ]
  },
  // 그 외 라우트가 있다면 여기 추가
];

// Vue Router 인스턴스 생성
const router = createRouter({
  history: createWebHistory(),
  routes
});

// authGuard 등록
router.beforeEach(authGuard);

export default router;
