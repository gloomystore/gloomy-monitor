# Security Policy

## 지원 버전

가장 최근 릴리스만 보안 업데이트를 지원합니다.

## 취약점 제보

보안 취약점을 발견하셨다면 **공개 이슈로 등록하지 마시고**, 아래 방법으로 먼저 알려주세요.

- GitHub의 [Private vulnerability reporting](https://github.com/gloomystore/gloomymonitor/security/advisories/new)을 이용해주세요.

제보에는 다음 내용을 포함해주시면 대응이 빨라집니다.

- 취약점 종류와 영향 범위
- 재현 방법 (가능하면 PoC 포함)
- 영향을 받는 버전

## 알아두실 점

이 프로젝트는 대시보드 접근을 `.env`의 `AUTH_USER`/`AUTH_PASSWORD` 기반 로그인으로 보호합니다.
운영 환경에서는 반드시 다음을 지켜주세요.

- 기본값이 아닌, 충분히 복잡한 비밀번호 사용
- HTTPS 뒤에 배치 (세션 쿠키는 `Secure` 속성이 설정되어 있어 HTTPS가 아니면 로그인이 유지되지 않습니다)
- DB 계정은 이 애플리케이션 전용 계정으로, 필요한 권한만 부여
