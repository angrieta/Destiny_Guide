# Happy Hour 관리자 갱신

공개 페이지는 읽기 전용입니다. 일정은 GitHub 저장소에 쓰기 권한이 있는 관리자만 갱신할 수 있습니다.

## GitHub에서 갱신

1. 저장소의 **Actions** 탭을 엽니다.
2. **Update Happy Hour Schedule**을 선택하고 **Run workflow**를 누릅니다.
3. `announcement_time`에 Discord 공지 시각을 한국 시각으로 입력합니다. 예: `2026-08-21 15:00`
4. `discord_message`에 Destiny 앱 메시지를 그대로 붙여 넣습니다. 예: `Scheduled Happy Hours active! 179 minutes remaining.`
5. 실행이 끝나면 `landing` 브랜치에 일정 자료가 저장되고 GitHub Pages가 다시 배포됩니다.

위 예시는 공지 시각에 179분이 남았으므로 해당 Happy Hour를 `14:59–17:59`로 계산합니다. 이후 예정 시각은 15시간 30분 간격으로 생성합니다.

## 로컬에서 갱신

```powershell
npm run update:happy-hour -- --at "2026-08-21 15:00" --message "Scheduled Happy Hours active! 179 minutes remaining."
```

생성되는 파일은 `data/happy-hour.json`입니다. 일반 방문자에게는 입력 기능이나 관리자 비밀번호가 전달되지 않습니다.
