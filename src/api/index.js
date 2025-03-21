import { instance, instanceWithAuth } from './common/Http';

/**
 * axios사용시 사용할 공동 모듈
 * @param {string} url axios 통신을 위한 백엔드 주소
 * @param {string} method api 요청 방식(post, get)
 * @param {object} data 백엔드에 보낼 데이터
 * @returns api 요청에 대한 결과값 리턴
 */
function axiosCommon(url, method, data, config) {
  console.log('axiosCommon');
  if (method === 'post') {
    console.log('axiosCommon post');
    return instance.post(url, data, config)
  } else {
    console.log('axiosCommon get');
    return instance.get(url, data, config);
  }
}

/**
 * 토큰 인증을 이용하여 axios사용시 사용할 공동 모듈
 * @param {string} url axios 통신을 위한 백엔드 주소
 * @param {string} method api 요청 방식(post, get)
 * @param {object} data 백엔드에 보낼 데이터
 * @returns api 요청에 대한 결과값 리턴
 */
function axiosCommonWithAuth(url, method, data, config) {
  console.log('axiosCommonWithAuth')
  if(method === 'post') {
    console.log('axiosComaxiosCommonWithAuthmon post');
    return instanceWithAuth.post(url, data, config);
  }
  // method가 get일시 아래 로직 실행
  else {
    console.log('axiosCommonWithAuth get');
    return instanceWithAuth.get(url, data, config)
  }
}

// 만들어논 api export
// api를 사용할 vue 파일에서 import 해서 사용하면 됨
// 예시 로그인 api 사용 -> import {axiosCommon} from '@/api/Index.js'
export {
  axiosCommonWithAuth,
  axiosCommon
}