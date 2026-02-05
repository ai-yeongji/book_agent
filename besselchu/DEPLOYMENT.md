# 베셀추 (Bessel-Chu) 배포 가이드

> 점메추 말고 베셀추!

## 로컬에서 실행하기

### 1. 환경 설정
먼저 `.env.local` 파일에 실제 OpenAI API 키를 입력하세요:
```
OPENAI_API_KEY=your_actual_openai_api_key_here
```

### 2. 패키지 설치 및 실행
```bash
npm install
npm run dev
```

### 3. 모바일에서 접속하기
앱이 실행되면 터미널에 다음과 같은 주소가 표시됩니다:
```
➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
```

**같은 Wi-Fi에 연결된 모바일 기기**에서 `Network` 주소(예: http://192.168.x.x:3000/)로 접속하세요!

---

## Vercel로 배포하기 (모바일에서 언제든지 접속)

### 방법 1: Vercel CLI 사용 (추천)

1. **Vercel CLI 설치**
```bash
npm install -g vercel
```

2. **로그인**
```bash
vercel login
```

3. **배포**
```bash
vercel
```
- 프로젝트 설정을 물어보면 기본값으로 진행 (Enter 계속 누르기)
- 배포가 완료되면 URL이 제공됩니다 (예: https://your-app.vercel.app)

4. **환경변수 설정**
```bash
vercel env add OPENAI_API_KEY
```
- `production` 환경 선택
- OpenAI API 키 입력

5. **재배포** (환경변수 적용)
```bash
vercel --prod
```

### 방법 2: GitHub + Vercel 연동 (자동 배포)

1. **GitHub에 코드 푸시**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

2. **Vercel 웹사이트에서 설정**
   - https://vercel.com 방문 후 로그인
   - "Add New" → "Project" 클릭
   - GitHub 저장소 연결
   - 프로젝트 선택

3. **환경변수 설정**
   - "Environment Variables" 섹션에서:
     - Name: `OPENAI_API_KEY`
     - Value: `your_openai_api_key`
   - "Deploy" 클릭

4. **자동 배포**
   - 이후 GitHub에 푸시할 때마다 자동으로 재배포됩니다!

---

## 주의사항

⚠️ **API 키 보안**
- `.env.local` 파일은 절대 GitHub에 올리지 마세요 (이미 .gitignore에 포함됨)
- Vercel 환경변수를 통해서만 API 키를 설정하세요

⚠️ **클라이언트 사이드 노출**
- 현재 설정상 API 키가 클라이언트에 노출됩니다
- 보안이 중요하다면 백엔드 API를 별도로 구축하는 것을 권장합니다

---

## 배포 후 확인

배포가 완료되면:
1. 제공된 URL을 모바일 브라우저에서 열기
2. 홈 화면에 추가 (앱처럼 사용 가능)
   - Safari: 공유 → 홈 화면에 추가
   - Chrome: 메뉴 → 홈 화면에 추가
