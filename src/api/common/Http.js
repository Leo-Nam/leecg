// axios를 사용하는데 공통으로 쓸 것들을 모아논 파일
// HTTP Request & Response와 관련된 기본 설정

import axios from 'axios';
import {setInterceptorsWithAuth, setInterceptors} from './interceptors'

function createInstance() {
	const instance = axios.create({
    baseURL: process.env.VUE_APP_API
    // .env 파일에 작성한 환경변수로 baseURL 설정
    // baseURL: process.env.VUE_APP_API
    // baseURL: process.env.VUE_APP_NODEJS_API
  });
  console.log('createInstance')
	return setInterceptors(instance);
}
/**
 * 인증이 필요없는 경우 사용할 기본 axios 인스턴스를 담은 변수
 * api를 요청할 baseUrl을 담고 있음
 */
export const instance = createInstance();

function createInstanceWithAuth() {
	const instance = axios.create({
    baseURL: process.env.VUE_APP_API
    // baseURL: process.env.VUE_APP_NODEJS_API
  });
  //interceptors 사용(accessToken, refreshToken)
  console.log('createInstanceWithAuth')
	return setInterceptorsWithAuth(instance);
}
/**
 * 인증이 필요한 경우 사용할 기본 axios 인스턴스를 담은 변수
 * api를 요청할 baseUrl을 담고 있음
 */
export const instanceWithAuth = createInstanceWithAuth();
