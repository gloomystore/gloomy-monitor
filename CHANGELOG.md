# Changelog

이 프로젝트의 주요 변경 사항을 기록합니다. 형식은 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)를 따릅니다.

## [1.0.0] - 2026-08-14

### Added

- 프로그램(서비스)별 다중 URL 등록 및 주기적 상태 체크
- 상태 변화(정상→비정상, 비정상→정상) 시에만 메일 발송
- 대시보드에서 일/시/분/초 단위로 체크 주기 조정
- 로그인 폼 기반 세션 인증 (`AUTH_USER`/`AUTH_PASSWORD`)
- 첫 실행 시 MySQL 테이블 자동 생성
