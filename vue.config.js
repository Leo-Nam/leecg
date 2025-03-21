const { defineConfig } = require('@vue/cli-service');
const path = require('path');
const fs = require('fs');

module.exports = defineConfig({
  transpileDependencies: [
    'vuetify'
  ],
  outputDir: path.resolve(__dirname, '../back/dist'), // 빌드 결과물 경로 설정
  pwa: {
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: './public/public-service-worker.js', // 사용자 정의 서비스 워커 경로
      swDest: 'service-worker.js'
    }
  },
  // configureWebpack: {
  //   plugins: [
  //     {
  //       apply: (compiler) => {
  //         compiler.hooks.afterEmit.tap('AddRandomVersionToManifest', () => {
  //           const manifestPath = './public/manifest.json';
  //           if (fs.existsSync(manifestPath)) {
  //             const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  //             const randomVersion = Math.random().toString(36).substring(2, 15); // 랜덤 문자열 생성
  //             manifest.start_url = `/index.html?ver=${randomVersion}`;
  //             fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  //             console.log(`Updated manifest.json with start_url: ${manifest.start_url}`);
  //           } else {
  //             console.error(`Manifest file not found at ${manifestPath}`);
  //           }
  //         });
  //       }
  //     }
  //   ]
  // }  
  configureWebpack: {
    plugins: [
      {
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap('AddRandomVersionToManifest', () => {
            // process.env.NODE_ENV === 'development'이면 실행 안하도록 분기
            if (process.env.NODE_ENV !== 'production') {
              return;
            }

            // 실제 프로덕션 빌드일 때만 manifest.json 수정
            const manifestPath = './public/manifest.json';
            if (fs.existsSync(manifestPath)) {
              const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
              const randomVersion = Math.random().toString(36).substring(2, 15);
              manifest.start_url = `/index.html?ver=${randomVersion}`;
              fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
              console.log(`Updated manifest.json with start_url: ${manifest.start_url}`);
            } else {
              console.error(`Manifest file not found at ${manifestPath}`);
            }
          });
        }
      }
    ]
  }
});
