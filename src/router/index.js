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
