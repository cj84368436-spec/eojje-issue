# 어제 이슈

아침 1~3분 안에 "어제 사람들이 많이 이야기한 이슈"를 카테고리별로 정리해 주는 App in Toss 미니앱.

```text
어제이슈/
  app/        프론트엔드 (App in Toss 미니앱, Vite + 바닐라 JS)
  pipeline/   매일 뉴스 수집/품질검사/발행 파이프라인 (Node, 외부 의존성 0)
  .github/    매일 자동 갱신 GitHub Actions 워크플로
  docs/       설계/QA 문서
```

## 데이터 흐름

```text
[매일 06:30 KST]
GitHub Actions (또는 로컬 실행)
  → pipeline: 네이버 뉴스 API 수집 (40시간 이내 기사만)
  → 중복 제거 → 카테고리 분류 → 추출형 요약 → 주목도/민감도 산정 → 최종 선별
  → 품질 검사 (차단 경고 시 CI 실패)
  → today-news.json 발행 → GitHub Pages 배포
[앱 실행 시]
앱 → 원격 today-news.json 로드 (실패 시 번들 데이터 fallback)
  → 데이터 날짜가 2일 이상 뒤처지면 "갱신 실패" 배너 표시
```

## 로컬 실행

### 1. 파이프라인 (뉴스 생성)

```powershell
cd pipeline
copy .env.example .env   # NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 입력
node src/run.js          # output/today-news.json + app/public/today-news.json 생성
node src/validate.js     # 발행 데이터 재검증
```

- API 키가 없으면 목업 데이터로 동작한다 (`source: "mock"`).
- 실행 결과: `output/today-news.json`, `output/quality-report.md`, `output/history/news-YYYY-MM-DD.json`

### 2. 앱 (개발 서버)

```powershell
cd app
npm install
npm run dev              # http://localhost:5175
```

배포용 웹 빌드는 `npm run build:web`, App in Toss 패키징은 `npm run build` (ait CLI 필요).

## 매일 자동 갱신 설정 (출시 전 필수)

1. 이 폴더를 GitHub 저장소로 푸시한다.
2. 저장소 Settings → Secrets and variables → Actions 에 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 등록.
3. Settings → Pages → Source 를 **GitHub Actions** 로 설정.
4. Actions 탭에서 `daily-news` 워크플로를 수동 실행해 1회 검증.
5. 발행 URL(`https://<계정>.github.io/<저장소>/today-news.json`)을
   `app/src/config.js` 의 `REMOTE_DATA_URL` 에 넣고 앱을 다시 빌드한다.
6. App in Toss 콘솔에서 해당 도메인을 허용 도메인에 추가한다.

## 품질 기준 (파이프라인이 자동 검사)

- 제목/요약이 `...` 으로 끝나면 발행 차단
- 카테고리당 5개 미만이면 발행 차단
- 헤드라인에 5개 카테고리가 1개씩 없으면 발행 차단
- 사진 캡션/앞 잘린 파편/run-on 요약은 요약에서 제외 (억지 템플릿으로 채우지 않음)
- 같은 인물/사건은 카테고리 내, 헤드라인 간 중복 금지
- 보도자료성/지역 홍보성/인사·동정 기사는 감점으로 후순위
- 민감도(낮음/중간/높음) 산정, "높음"은 헤드라인 제외
