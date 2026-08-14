# gloomymonitor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

여러 웹 서비스(React CSR / Next.js SSR 등)의 URL을 주기적으로 확인하다가, 200이 아닌 응답이 나타나면 메일로 알려주는 간단한 셀프호스팅 업타임 감시 도구입니다.

## 특징

- **다중 URL 체크**: 프로그램(서비스) 하나당 URL을 여러 개 등록할 수 있고, 그중 하나라도 200이 아니면 그 프로그램은 "비정상"으로 표시됩니다.
- **조용한 알림**: 평소에는 메일을 보내지 않다가, 상태가 바뀌는 시점(정상→비정상, 비정상→정상)에만 메일을 보냅니다.
- **CSR 대응**: 정적 셸이 항상 200을 반환하는 CSR 앱의 경우, 실제 백엔드/health 엔드포인트를 URL로 추가로 등록해두면 그것까지 함께 확인합니다.
- **자유로운 체크 주기**: 대시보드에서 일/시/분/초 단위로 바로 조정할 수 있습니다.
- **간단한 인증**: `.env`에 설정한 계정으로 로그인하는 세션 기반 인증. 별도 사용자 관리 없이 admin 계정 하나로 충분한 도구를 지향합니다.
- **제로 설정 DB**: 빈 MySQL/MariaDB 데이터베이스만 있으면 테이블은 첫 실행 시 자동 생성됩니다.
- **가벼운 메일 발송**: SMTP 클라이언트를 직접 구현하지 않고, 시스템에 이미 있는 `sendmail` 호환 바이너리(postfix, msmtp, ssmtp 등)를 그대로 사용합니다.

## 요구 사항

- Node.js 18+
- MySQL / MariaDB
- `sendmail` 호환 바이너리 (postfix, msmtp, ssmtp 등)

## 설치 및 실행

```bash
git clone https://github.com/gloomystore/gloomymonitor.git
cd gloomymonitor
npm install
cp .env.example .env
# .env를 열어 DB 접속 정보, 메일 발신 주소, 로그인 계정을 채워주세요

npm run build
npm start   # 기본 포트는 .env의 PORT
```

pm2로 상시 구동하려면 `ecosystem.config.js`를 참고해 `pm2 start ecosystem.config.js`로 등록하면 됩니다.

## 환경 변수 (.env)

| 변수 | 설명 |
|---|---|
| `PORT` | 서비스 포트 |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASS` / `DB_NAME` | MySQL 접속 정보. `DB_NAME`으로 지정한 데이터베이스는 미리 생성되어 있어야 합니다 |
| `MAIL_FROM` | 알림 메일 발신자 주소 |
| `SENDMAIL_PATH` | `sendmail` 바이너리 경로 (기본값 `sendmail`, PATH에 없으면 절대경로 지정) |
| `AUTH_USER` / `AUTH_PASSWORD` | 대시보드 로그인 계정. 비워두면 인증이 비활성화됩니다 (권장하지 않음) |

## 사용법

1. 대시보드 상단에서 프로그램 이름과 URL(들)을 입력해 등록합니다.
2. 메일 수신자 이메일을 등록합니다.
3. 체크 주기를 원하는 값으로 저장합니다.
4. 이후로는 백그라운드에서 주기적으로 체크하며, 상태가 바뀔 때만 메일이 발송됩니다. "지금 체크" 버튼으로 즉시 확인할 수도 있습니다.

## 기여

버그 리포트, 기능 제안, PR 모두 환영합니다. 자세한 내용은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참고해주세요.
이 프로젝트에 참여하는 모든 분은 [Code of Conduct](./CODE_OF_CONDUCT.md)를 따라야 합니다.

## 보안

취약점을 발견하셨다면 [SECURITY.md](./SECURITY.md)의 절차를 따라 제보해주세요.

## 라이선스

[MIT](./LICENSE)
