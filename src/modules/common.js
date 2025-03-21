// import {jwtDecode} from 'jwt-decode' // jwt-decode 라이브러리를 사용
// 8001
import Vue from 'vue'; // Vue 인스턴스 직접 import
import {jwtDecode} from 'jwt-decode'; // require 대신 import
import store from '@/store'; // Vuex 스토어 경로에 맞게 수정
import router from '@/router';

export const callProc = async (store, params, callback) => {
	const response = await store.dispatch(params.caller, params.data)
	const callee = response.data.data.callee
	// console.log({params}, callee, ' in $callProc')
	let data = {}
	if (response.status == 200) {
		if (response.data.state === 0) {
			data = {
				data: response.data.data.data,
				messages: null,
				state: {
					server: response.status,
					db: response.data.state
				},
				params
			}
		} else {
			data = {
				data: response.data.data.data,
				messages: {
					popupMessage: '[' + response.data.state + '] ' + response.data.message,
					messageClass: 'fc-red',
					icon: 'mdi-exclamation-thick'
				},
				state: {
					server: response.status,
					db: response.data.state
				},
				params
			}
		}
	} else {
		data = {
			data: response.data.data.data,
			messages: {
				popupMessage: '[' + response.status + '] 서버통신과정에 오류가 발생했습니다.',
				messageClass: 'fc-red',
				icon: 'mdi-exclamation-thick'
			},
			state: {
				server: response.status,
				db: null
			},
			params
		}
	}
	console.log({data, response}, callee, ' in $callProc')
	return callback(data)
}

export const isRefreshTokenValid = async (token) => {
  // 1. refreshToken이 없는 경우 바로 실패 응답
  if (!token || !token.refreshToken) {
    console.log('refreshToken이 없습니다. 이메일 또는 문자메시지 인증을 이용하여 재발급받으셔야 합니다');
    return {
      data: {
        state_code: 80011003,
        state_message: '토큰을 분실하였습니다. 이메일 또는 문자메시지 인증을 이용하여 재발급받으셔야 합니다',
        resultData: { token },
      },
    };
  }

  try {
    // 2. accessToken 디코드 (jwtDecode 사용)
    const decoded = jwtDecode(token.accessToken);
    const currentTime = Math.floor(Date.now() / 1000); // 현재 시간 (초 단위)
    const decodedExp = decoded.exp;

    console.log({ currentTime, decodedExp }, '현재시간과 accessToken의 만료시간');

    // 3. accessToken 만료 확인
    if (currentTime > decodedExp) {
      console.log('현재 보유한 토큰이 만료되었습니다');
      console.log('토큰을 재발행 받겠습니다3');

      // 3-1. accessToken 만료된 경우 -> Refresh Token을 사용해 새 토큰 발급
      try {
        const response = await store.dispatch('user/issueAccessToken');
        console.log('토큰 재발행 성공:', response);

        // 새로 발행된 Access Token 검사
        const newAccessToken = response.data.resultData?.token?.accessToken;
        if (!newAccessToken) {
          console.error('새로 발행한 accessToken이 존재하지 않습니다');
          return {
            data: {
              state_code: 80011001,
              state_message: '새로운 토큰 발급 로직에서 accessToken이 누락되었습니다.',
              resultData: { token },
            },
          };
        }

        const newAccessTokenDecoded = jwtDecode(newAccessToken);
        const newCurrentTime = Math.floor(Date.now() / 1000);

        if (newCurrentTime > newAccessTokenDecoded.exp) {
          console.log('새로 발행한 토큰이 만료되었습니다');
          return response; 
          // 또는 원하는 구조로 반환
        } else {
          console.log('새로 발행한 토큰은 만료되지 않았습니다');
          return response; 
          // 기존 구조 유지: 재발행 결과를 그대로 반환
        }
      } catch (issueError) {
        console.error('서버로의 서비스 호출에서 오류가 발생했습니다:', issueError);
        return {
          data: {
            token,
            state_code: 80011004,
            state_message: '서버로의 서비스 호출에서 오류가 발생했습니다',
          },
        };
      }
    } else {
      // 3-2. accessToken이 아직 만료되지 않음
      console.log('현재 보유한 토큰은 만료되지 않았습니다');
      return {
        data: {
          state_code: 0,
          state_message: '현재 보유한 토큰은 만료되지 않았습니다',
          resultData: { token },
        },
      };
    }
  } catch (error) {
    // 4. 토큰 decode 단계에서 오류 발생
    console.error('Refresh Token decode error:', error);
    return {
      data: {
        state_code: 80011002,
        state_message: '토큰 decode 오류가 발생했습니다',
        resultData: { token },
      },
    };
  }
};

export const generateDeviceId = async () => {
  // 1. 이미 저장된 deviceId가 있는지 확인
  let deviceId = localStorage.getItem('deviceId');
  if (deviceId) {
    return deviceId; // 저장된 deviceId 반환
  }

  // 2. 저장된 deviceId가 없으면 새로 생성
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const platform = navigator.platform;
  const randomString = Math.random().toString(36).substring(2, 15); // 랜덤 문자열
  const rawId = `${userAgent}-${language}-${platform}-${randomString}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(rawId);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  deviceId = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // 3. 생성된 deviceId를 localStorage에 저장
  localStorage.setItem('deviceId', deviceId);

  return deviceId;
}


export const startSpeechRecognition = (router) => {
  if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('음성 인식 결과:', transcript);

      try {
        const response = await store.dispatch('ai/caller', {
          callee: 'gpt_analyze_command',
          params: { text: transcript }
        });

        const result = response.data.resultData;
        console.log('GPT 분석 결과:', result);

        // 사용자 요구사항을 모달로 표시
        Vue.prototype.$showModal({
          title: '요청 내용',
          message: `요청한 작업: ${result.action}`
        });

        // 분석된 명령어에 따라 동작 수행
        handleAction(result.action, router);
      } catch (error) {
        console.error('GPT 요청 중 오류:', error);
        alert('명령어 처리 중 오류가 발생했습니다.');
      }
    };

    recognition.onerror = (event) => {
      console.error('음성 인식 오류:', event);
      alert('음성 인식 중 오류가 발생했습니다.');
    };

    recognition.start();
  } else {
    alert('이 브라우저는 음성 인식을 지원하지 않습니다.');
  }
};

const handleAction = (action, router) => {
  if (action === 'login') {
    router.push({ name: 'login' });
  } else if (action === 'reset_password') {
    router.push({ path: '/account/findpwd' });
  } else {
    alert('알 수 없는 명령어입니다.');
  }
};
export const askAuthCode = async (req) => {
  const params = {
    user_password: req.user_password,
    user_email: req.user_email,
    store_code: req.store_code,
    verify_user: req.verify_user
  };
  console.log({ params }, 'sp_ask_auth_code module');

  try {
    const response = await store.dispatch('user/caller', {
      callee: 'sp_ask_auth_code',
      params,
      veriyToken: false
    });
    if (response.data) {
      return response.data
    } else {
      console.error('sp_ask_auth_code 에러: 데이타가 존재하지 않습니다.');
    }
  } catch (error) {
    console.error('sp_ask_auth_code 에러:', error);
    throw error; // 오류 발생 시 에러를 던져서 호출한 쪽에서 처리할 수 있도록 함
  }
};

export const goRoute = (routeName) => {
  if (store.state.route.currentRouteName !== routeName) {
    router.push({name: routeName})
    return true
  } else {
    return false
  }
}

export const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
  const day = String(today.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`; // 'YYYY-MM-DD' 형식으로 변환
  return formattedDate
}


export const getCurrentRouteName = () => {
  return store.state.route.currentRouteName;
}


export const getLoginState = () => {
  return store.state.user.isLogin;
}


export const logout = async () => {
  // 입력 값 검증
  console.log('logout')
  // Vuex를 통한 호출
  const requestParams = {
    store_code: store.state.user.user.store_info.store_code,
    user_id: store.state.user.user.id,
    device_id: await generateDeviceId(),
  }
  console.log({requestParams})
  store.dispatch('user/caller', {
    callee: 'sp_user_logout',
    params: requestParams,
    veriyToken: false
  })
  .then(response => {
    console.log('logout-응답:', response);
    if (response && response.data && response.data.state_code === 0) {
      console.log('로그아웃 성공');
      store.commit('user/setLoginState', false);
      goRoute('serviceMain')
    } else {
      alert('[' + response.data.state_code + ']' + response.data.state_message)
      console.log('[', response.data.state_code, ']', response.data.state_message);
    }
    return response.data.state_code
  })
  .catch(error => {
    console.error('에러:', error);
    alert('로그아웃 중 오류가 발생했습니다.');
  });
}