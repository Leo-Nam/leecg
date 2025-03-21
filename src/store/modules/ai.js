// // import axios from 'axios';

// export default {
//   namespaced: true,
//   state: {
//     loading: false // 로딩 상태 관리
//   },
//   mutations: {
//     setLoading(state, payload) {
//       state.loading = payload;
//     }
//   },
//   actions: {
//     async caller({ commit }, payload) {
//       commit('setLoading', true); // 로딩 시작
//       try {
//         // 실제 API 호출 부분 (주석 처리)
//         // const url = process.env.VUE_APP_API + '/gpt/analyze'; // GPT API 엔드포인트
//         // const method = 'post';
//         // const data = {
//         //   text: payload.params.text // 사용자가 전달한 명령어 텍스트
//         // };
//         // const response = await axios({ url, method, data });
//         // console.log('GPT API 응답:', response.data);

//         // 딜레이 추가 (1.5초)
//         await new Promise((resolve) => setTimeout(resolve, 1500));

//         // 가상 응답 데이터
//         const response = {
//           data: {
//             resultData: {
//               action: payload.params.text.includes('로그인') ? 'login' : 'reset_password',
//               confidence: 0.95 // 신뢰도 (예시)
//             },
//             state_code: 0,
//             state_message: 'success'
//           }
//         };

//         console.log('가상 GPT API 응답:', response.data);

//         commit('setLoading', false); // 로딩 종료

//         return {
//           data: response.data
//         };
//       } catch (error) {
//         console.error('GPT API 호출 중 오류:', error);
//         commit('setLoading', false); // 로딩 종료 (오류 발생 시)
//         return {
//           data: {
//             resultData: null,
//             state_code: 5001,
//             state_message: 'GPT API 호출 중 오류가 발생했습니다.'
//           }
//         };
//       }
// 		}
//   }
// };

export default {
  namespaced: true,
  state: {
    loading: false, // 로딩 상태
  },
  mutations: {
    setLoading(state, payload) {
      state.loading = payload;
    },
  },
  actions: {
    async caller({ commit }, payload) {
			console.log({payload})
      commit('setLoading', true); // 로딩 시작
      try {
        // GPT API 호출 로직
        const response = await new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: {
                resultData: { action: 'login', confidence: 0.95 },
                state_code: 0,
                state_message: 'success',
              },
            });
          }, 2000); // 테스트용 지연 시간
        });

        console.log('GPT API 응답:', response.data);
        return response;
      } catch (error) {
        console.error('GPT 요청 중 오류:', error);
        throw error;
      } finally {
        commit('setLoading', false); // 로딩 종료
      }
    },
  },
};
