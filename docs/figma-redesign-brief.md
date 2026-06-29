# 어제이슈 Figma 리디자인 브리프

## 목표

기존 앱 구현은 유지하고, 별도 Figma 파일에서 사용할 전면 리디자인 기준을 만든다. 방향은 "AI 생성형 카드 UI"가 아니라, 아침에 빠르게 훑는 모바일 뉴스 편집 화면이다.

## 핵심 UX

- 첫 화면에서 활성 카테고리별 대표 이슈를 바로 훑는다. AI 업데이트가 있는 날은 AI 대표 이슈도 포함한다.
- 헤드라인, 카테고리, 저장 탭은 유지한다.
- 뉴스 카드는 클릭하면 상세 바텀시트를 연다.
- 저장 버튼은 보조 행동으로 두고, 제목과 요약 읽기를 우선한다.
- 민감도와 주목도는 과한 배지 대신 작고 신뢰감 있는 지표로 보여준다.

## 리디자인 원칙

- 배경은 베이지 단색 느낌을 줄이고, 차분한 회색 기반의 신문/브리핑 톤으로 바꾼다.
- 카드마다 둥글고 큰 그림자만 반복하는 패턴을 줄인다.
- 첫 헤드라인은 편집장이 고른 리드 기사처럼 넓고 강하게 배치한다.
- 나머지 헤드라인은 리스트 밀도를 높여 뉴스 앱처럼 빠르게 스캔되게 한다.
- 카테고리 색은 면 전체를 칠하지 않고 얇은 라인, 점, 작은 라벨에만 쓴다.
- 버튼과 탭은 유리 효과나 과한 그라데이션보다 명확한 선택 상태를 우선한다.

## 화면 구성

1. Top Bar
   - 작은 날짜/출처 상태
   - 앱명 "어제이슈"
   - 저장 카운트 아이콘 버튼

2. Issue Brief
   - "오늘 아침 먼저 볼 이슈"
   - 리드 기사 1개
   - 주목도, 출처, 시간, 카테고리

3. Category Tabs
   - 헤드라인, 정치, 경제, 사회, 문화, 연예, AI, 저장
   - AI 데이터가 없는 날에도 탭/빈 상태가 깨지지 않아야 함
   - sticky 영역

4. Headline List
   - 리드 외 대표 기사 compact row
   - 순위, 제목, 짧은 요약, 지표

5. Detail Sheet
   - 30초 브리핑
   - 핵심 맥락
   - 오늘 대화 포인트
   - 원문 보기 / 저장

## 디자인 토큰

```text
Canvas: #F4F5F7
Surface: #FFFFFF
Surface muted: #F0F2F5
Ink: #111318
Text secondary: #5A626E
Text tertiary: #8B93A1
Line: #E1E5EA
Accent blue: #2563EB
Accent red: #E5484D
Accent green: #16A34A
Accent violet: #7C3AED
Accent amber: #D97706
Radius small: 10
Radius medium: 16
Radius large: 22
Shadow: 0 16 44 -32 rgba(17, 19, 24, .48)
```

## Figma 제작 메모

- 모바일 프레임 기준: 390 x 844.
- `App / Home / Redesigned` 프레임을 만든다.
- 컴포넌트 후보: AppBar, CategoryTab, LeadIssueCard, HeadlineRow, MetricPill, SaveButton, DetailSheet.
- Auto Layout 기준으로 위에서 아래로 쌓고, 텍스트 길이 변화에도 깨지지 않게 한다.
- 기존 앱의 정보 구조는 유지하되, 시각 언어만 새로 만든다.
