# 기술과 논문을 기록하는 블로그

Astro 7로 만든 한국어 개인 블로그입니다. 흰색 바탕에 검정 글자와 파란 강조색을 사용하며, Markdown 글을 정적 페이지로 생성해 GitHub Pages에 배포합니다.

## 시작하기

Node.js 22.12 이상을 사용하세요. 프로젝트 폴더에서 실행합니다.

```bash
npm ci
npm run dev
```

터미널에 표시되는 로컬 주소를 브라우저에서 엽니다. 배포 결과를 미리 확인하려면 다음 명령을 사용하세요.

```bash
npm run test
npm run build
npm run preview
```

## 새 글 작성하기

글은 `src/content/blog/` 안의 `.md` 또는 `.mdx` 파일입니다. 파일 이름이 주소가 됩니다. 예를 들어 `my-first-post.md`는 `/blog/my-first-post/`로 발행됩니다.

```bash
npm run new -- my-first-post --type tech --title '첫 번째 기술 기록'
npm run new -- paper-reading --type papers --title '논문을 읽으며 남긴 질문'
npm run new -- today-i-learned --type notes --title '오늘 배운 것'
```

`slug`에는 영문 소문자, 숫자, 하이픈을 사용하세요. 명령은 한국 시간 기준 오늘 날짜와 `draft: true`를 넣어 글을 만들고, 같은 이름의 파일이 있으면 덮어쓰지 않습니다. `--type`의 기본값은 `tech`입니다. `--title`을 생략하면 slug가 제목이 됩니다.

`templates/technical.md`와 `templates/paper.md`를 직접 복사해 작성해도 됩니다. 이 폴더는 글 모음에 포함되지 않습니다. 복사한 뒤 제목, 설명, 날짜와 분류를 수정하세요.

### 글 정보

각 글의 맨 위에는 다음과 같은 정보를 적습니다.

```yaml
---
title: '글 제목'
description: '목록과 검색 결과에서 보여 줄 짧은 설명'
pubDate: 2026-09-05
category: tech
tags: ['Astro', '웹']
draft: true
---
```

| 항목 | 의미 |
| --- | --- |
| `title` | 글 제목, 필수 |
| `description` | 짧은 설명, 필수 |
| `pubDate` | 발행 날짜, 필수 |
| `updatedDate` | 내용을 수정한 날짜, 선택 |
| `category` | `tech`(기술), `papers`(논문 노트), `notes`(학습 기록) 중 하나 |
| `tags` | 태그 목록, 생략하면 빈 목록 |
| `draft` | 초안 여부, 생략하면 `false`이므로 작성 중에는 명시적으로 `true` 사용 |

논문 노트에는 원문 정보를 선택적으로 추가할 수 있습니다. `url`은 HTTPS 주소여야 합니다.

```yaml
paper:
  title: '논문 원제'
  authors: '저자명'
  year: 2026
  url: 'https://example.com/paper'
```

### 공개하기

내용을 확인한 뒤 `draft: false`로 바꾸고 `pubDate`를 발행 시점 이전으로 설정합니다. **초안과 미래 날짜의 글은 개발 서버에서도 본문 페이지, 목록, 검색, RSS에서 제외됩니다.** 초안을 로컬에서 확인하려면 잠시 `draft: false`로 바꾸고 미래 날짜도 조정한 뒤, 공개할 준비가 되지 않았다면 커밋 전에 반드시 되돌리세요.

날짜만 적으면 UTC 자정으로 해석되어 한국 시간 오전 9시부터 발행 대상이 됩니다. 시간을 지정하려면 `pubDate: '2026-09-05T00:00:00+09:00'`처럼 시간대를 함께 적으세요. 화면의 날짜와 새 글 명령의 오늘 날짜는 한국 시간을 사용합니다.

정적 사이트이므로 예약 날짜가 지나도 **다시 빌드하고 배포해야** 공개됩니다. 자동 예약 배포 스케줄은 설정되어 있지 않습니다.

### 본문 작성

제목 아래의 본문에는 `##`부터 시작하는 소제목, 목록, 표, 링크를 사용할 수 있습니다. 코드 블록에는 언어를 적으면 문법이 강조됩니다.

````markdown
## 직접 확인한 내용

```typescript
const message = '작은 기록부터 시작하기';
console.log(message);
```
````

인라인 수식은 `$x^2$`, 독립된 수식은 `$$`로 감싸서 작성합니다. KaTeX로 수식을 표시합니다. 제목에 사용한 단어뿐 아니라 설명, 태그, 본문도 검색 대상입니다. 여러 검색어를 입력하면 모든 단어가 포함된 글을 찾습니다.

이미지를 쓰려면 `public/images/`에 파일을 넣고 `![이미지 설명](/images/file-name.png)`으로 연결할 수 있습니다. 논문이나 외부 이미지에는 출처를 함께 남겨 주세요.

## 사이트 설정

사이트 이름, 설명, 작성자 등 표시 정보는 `src/consts.ts`에서 수정합니다. 배포 주소와 Astro 통합 설정은 `astro.config.mjs`, 화면 스타일은 `src/styles/`에 있습니다.

개인 블로그를 소개하는 첫 글만 포함되어 있습니다. 기술 글과 논문 노트는 직접 작성해 채워 나가세요.

## GitHub Pages 배포

`.github/workflows/deploy.yml`은 `master` 브랜치에 푸시하면 사이트를 빌드하고 GitHub Pages에 배포합니다. GitHub 저장소의 **Settings → Pages → Build and deployment → Source**에서 **GitHub Actions**를 선택하세요. 워크플로는 Actions 화면에서도 수동 실행할 수 있습니다.

1. 글 작성 후 `npm run test`와 `npm run build`로 확인합니다.
2. 변경 사항을 커밋하고 `master`에 푸시합니다.
3. 저장소의 Actions에서 배포 성공 여부를 확인합니다.

사용자 사이트(`사용자명.github.io`)를 기준으로 구성되어 있습니다. 저장소 경로 아래에 배포하는 프로젝트 사이트로 옮길 때는 Astro의 `site`·`base` 설정과 사이트 내부 절대 경로를 함께 조정해야 합니다.

## 주요 파일

| 경로 | 역할 |
| --- | --- |
| `src/content/blog/` | 공개 글과 초안 |
| `src/content.config.ts` | 글 정보 검증 규칙 |
| `src/lib/content.mjs` | 발행 판단, 검색, 읽기 시간, 날짜 표시 |
| `src/lib/posts.ts` | 공개 글 조회와 분류 |
| `src/pages/search.json.ts` | 공개 글 검색 데이터 |
| `src/pages/rss.xml.js` | RSS 피드 |
| `templates/` | 기술 글·논문 노트 작성 양식 |
| `scripts/new-post.mjs` | 새 초안 생성 명령 |
| `tests/content.test.mjs` | 콘텐츠 규칙과 새 글 명령 검증 |
