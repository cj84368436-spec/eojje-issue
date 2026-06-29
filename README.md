# 어제이슈

전날 많이 언급된 뉴스를 아침에 빠르게 훑는 App in Toss 미니앱입니다.
핵심 차별점은 단순 뉴스 목록이 아니라, 각 기사마다 `30초 브리핑` 카드뉴스로 맥락을 바로 읽게 하는 것입니다.

```text
어제이슈/
  app/        App in Toss 미니앱 프론트엔드(Vite + vanilla JS)
  pipeline/   매일 뉴스 수집, 분류, 요약, 품질 검증, 발행 파이프라인
  docs/       출시, QA, 디자인 문서
  .github/    매일 자동 갱신 GitHub Actions
```

## 현재 기준

- 기본 카테고리: 정치, 경제, 사회, 문화, 연예
- 선택 카테고리: AI
- 활성 카테고리마다 기사 6개 필요
- AI 소식이 없으면 AI 카테고리는 비어 있어도 앱이 깨지지 않아야 함
- 모든 상세 첫 장은 `30초 브리핑`이어야 함
- `사람들 반응`, `주의할 점` 카드는 사용하지 않음

## 로컬 실행

```powershell
cd app
npm install
npm run dev
```

브라우저는 Vite 서버가 켜진 뒤 `http://127.0.0.1:5173/` 또는 터미널에 표시된 주소로 열어야 합니다.

## 앱 검증

```powershell
cd app
npm run verify:data
npm run verify:ui
npm run verify:story
npm run check
```

- `verify:data`: 현재 데이터와 AI 없는 날의 데이터 계약을 검증
- `verify:ui`: AI 빈 상태, 동적 이슈 개수, AI 탭, 상세 카드 계약을 검증
- `verify:story`: 모든 기사 상세 첫 장이 `30초 브리핑`이고 금지 카드가 없는지 검증
- `check`: 데이터 검증, UI 계약 검증, 스토리 검증, Vite 빌드를 한 번에 실행

## 뉴스 파이프라인

```powershell
cd pipeline
copy .env.example .env
node src/run.js
node src/validate.js
```

원격 배포 데이터까지 확인하려면:

```powershell
cd pipeline
npm run validate:remote
```

기본 원격 주소는 `pipeline/src/validate-url.js`의 기본값을 사용합니다. 다른 주소를 확인하려면 `NEWS_VALIDATE_URL` 환경변수를 지정합니다.

## 출시 파일

App in Toss 콘솔에 올릴 파일:

```text
app/eojje-issue.ait
```

출시 전 최소 확인:

```powershell
cd pipeline
npm run validate
npm run validate:remote

cd ..\app
npm run check
npm run build
```

## 문서

- `docs/qa-checklist.md`: 수동 QA 체크리스트
- `docs/launch-next-steps.md`: App in Toss 콘솔 등록 전 확인 사항
- `docs/release-readiness.md`: 출시 후보 상태와 남은 외부 확인 항목
- `DESIGN.md`: 현재 디자인/제품 방향
