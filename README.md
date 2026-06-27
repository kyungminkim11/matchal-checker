# 맞팔체커

Instagram 데이터 ZIP을 브라우저에서만 분석해 맞팔, 취소 검토 계정과 팔로워만 있는 계정을 확인하는 로컬 분석 웹앱입니다.

- 서비스: https://unfollow.lavalabs.co.kr
- 운영: Lava Labs
- 로그인·비밀번호 입력 없음
- ZIP 및 분석 결과 서버 전송 없음
- 자동 언팔 기능 없음

## 배포 구조

`main` 브랜치에 커밋하면 GitHub Actions가 `v9/part*.txt` 원본을 복원하고, SEO·접근성·PWA 개선을 적용한 일반 정적 사이트를 `dist`에 생성한 뒤 GitHub Pages로 배포합니다.

```text
v9/part*.txt
   ↓ scripts/build-pages.mjs
 dist/index.html + assets + SEO/PWA files
   ↓ GitHub Pages
 https://unfollow.lavalabs.co.kr
```

## 주요 파일

- `scripts/build-pages.mjs`: 운영용 정적 사이트 생성
- `assets/product-improvements.*`: 브랜드, 업로드 검증, 개인정보 UI
- `assets/work-mode-enhancements.js`: 작업 단축키와 아이디 복사
- `assets/pwa-enhancements.js`: 오프라인·설치·오류 처리
- `manifest.webmanifest`, `sw.js`: 설치형 웹앱과 오프라인 캐시
- `robots.txt`, `sitemap.xml`: 검색 엔진 기본 설정

## 개인정보 안내

선택한 ZIP 파일과 분석 결과는 외부 서버로 전송되지 않습니다. 작업 상태와 설정은 사용자의 브라우저 로컬 저장소에 보관됩니다. 맞팔체커는 Instagram 또는 Meta와 제휴하거나 공식적으로 운영되는 서비스가 아닙니다.
