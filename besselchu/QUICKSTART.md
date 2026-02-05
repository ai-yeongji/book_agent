# 🚀 베셀추 (Bessel-Chu) 빠른 시작 가이드

> 점메추 말고 베셀추! 📚

## OpenAI API 키 발급받기

1. https://platform.openai.com/ 접속
2. 로그인 후 "API keys" 메뉴로 이동
3. "Create new secret key" 클릭
4. 생성된 키를 복사 (sk-로 시작)

---

## 로컬 실행하기

### 1단계: API 키 설정

`.env.local` 파일을 열어서 실제 OpenAI API 키를 입력하세요:

```bash
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

### 2단계: Vercel CLI 설치

```bash
npm install -g vercel
```

권한 오류가 나면:
```bash
sudo npm install -g vercel
```

### 3단계: 앱 실행

Vercel Dev를 사용해서 실행합니다 (서버리스 함수 포함):

```bash
vercel dev
```

또는 일반 개발 모드 (교보문고 크롤링 API가 작동 안 할 수 있음):

```bash
npm run dev
```

### 4단계: 모바일에서 접속

터미널에 표시되는 주소를 확인하세요:

```
✔ Ready! Available at:
  - http://localhost:3000
  - http://192.168.x.x:3000  ← 이 주소를 모바일에서 접속
```

같은 Wi-Fi에 연결된 모바일에서 `http://192.168.x.x:3000`으로 접속!

---

## Vercel에 배포하기 (모바일에서 언제든지 접속)

### 방법 1: Vercel CLI (가장 빠름)

```bash
# 1. 로그인
vercel login

# 2. 배포
vercel

# 3. API 키 설정
vercel env add OPENAI_API_KEY
# → production 선택
# → sk-로 시작하는 OpenAI API 키 입력

# 4. 프로덕션 배포
vercel --prod
```

배포 완료! 제공된 URL (예: https://your-app.vercel.app)로 접속하세요.

---

### 방법 2: GitHub + Vercel 연동 (자동 배포)

1. **GitHub 저장소 생성 및 푸시**
   ```bash
   git init
   git add .
   git commit -m "Initial commit with OpenAI"
   git branch -M main
   git remote add origin https://github.com/your-username/your-repo.git
   git push -u origin main
   ```

2. **Vercel 웹사이트에서 배포**
   - https://vercel.com 접속 후 로그인
   - "Add New" → "Project"
   - GitHub 저장소 연결 및 선택

3. **환경변수 설정**
   - "Environment Variables" 섹션에서:
     - Name: `OPENAI_API_KEY`
     - Value: `sk-your-openai-api-key`
   - "Deploy" 클릭

4. **자동 배포**
   - 이후 GitHub에 푸시할 때마다 자동으로 배포됩니다!

---

## 비용 안내

### OpenAI API 비용 (2024 기준)

- **GPT-4o**: 입력 $2.50/1M 토큰, 출력 $10/1M 토큰
- **DALL-E 3**: 1024x1024 이미지당 $0.040
- **예상 비용**: 책 1개당 콘텐츠 생성 약 $0.05~0.10

### Vercel 호스팅

- **Free Tier**: 월 100GB 대역폭, 서버리스 함수 100GB-시간
- 개인 프로젝트는 무료로 충분히 사용 가능!

---

## 트러블슈팅

### Q: "vercel dev" 명령어를 찾을 수 없어요

```bash
sudo npm install -g vercel
```

### Q: API 키 오류가 나요

`.env.local` 파일에 올바른 OpenAI API 키가 입력되었는지 확인하세요.

### Q: 교보문고 데이터를 못 가져와요

교보문고 웹사이트 구조가 변경되었을 수 있습니다. `api/bestsellers.ts` 파일의 크롤링 로직을 업데이트해야 합니다.

### Q: 모바일에서 접속이 안 돼요

- PC와 모바일이 같은 Wi-Fi에 연결되어 있는지 확인
- 방화벽 설정 확인
- `vercel dev --listen 0.0.0.0:3000` 으로 실행해보세요

---

## 문의 및 피드백

문제가 생기면 GitHub Issues에 올려주세요!
