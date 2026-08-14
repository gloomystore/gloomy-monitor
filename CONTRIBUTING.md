# Contributing to gloomymonitor

이 프로젝트에 관심 가져주셔서 감사합니다. 버그 리포트, 기능 제안, PR 모두 환영합니다.

## 시작하기

```bash
git clone https://github.com/gloomystore/gloomymonitor.git
cd gloomymonitor
npm install
cp .env.example .env   # 값 채우기
npm run dev
```

- MySQL/MariaDB가 필요합니다. 빈 데이터베이스만 만들어두면 테이블은 첫 실행 시 자동 생성됩니다.
- 메일 발송은 시스템에 설치된 `sendmail` 호환 바이너리(postfix, msmtp, ssmtp 등)를 사용합니다.

## 이슈 등록

- 버그를 발견하셨다면 재현 방법, 기대한 동작, 실제 동작, 환경(Node 버전, OS, DB 버전)을 함께 적어주세요.
- 기능 제안은 어떤 문제를 해결하고 싶은지 먼저 설명해주시면 논의가 빨라집니다.

## Pull Request 절차

1. 저장소를 fork 하고 새 브랜치를 만듭니다 (`git checkout -b feat/my-feature`).
2. 변경 사항을 커밋합니다. 커밋 메시지는 무엇을, 왜 바꿨는지 짧게 설명해주세요.
3. `npm run build`와 `npm run lint`가 통과하는지 확인해주세요.
4. PR을 열 때 변경 이유와 테스트 방법을 함께 적어주세요.

## 코드 스타일

- TypeScript, ESLint(`eslint-config-next`) 기본 설정을 따릅니다.
- 불필요한 추상화나 의존성 추가는 지양해주세요 — 이 프로젝트는 의도적으로 작고 단순하게 유지하는 것을 목표로 합니다.

## 행동 강령

이 프로젝트에 참여하는 모든 분은 [Code of Conduct](./CODE_OF_CONDUCT.md)를 따라야 합니다.
