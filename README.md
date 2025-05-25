# 🏓 멀티 플레이어 핑퐁 게임

**실시간 1:1 온라인 핑퐁 게임**  
Socket.IO를 이용한 Node.js 기반 멀티플레이 게임으로 브라우저에서 친구와 바로 플레이할 수 있습니다!

---

## 🔗 배포 링크
- 🎮 **[게임 시작하기](https://seong-nyang.github.io/multi-pingpong/)**

---

## 🛠 사용 기술

- **Frontend**: HTML, CSS, JavaScript (Vanilla)  
- **Backend**: Node.js, Express, Socket.IO  
- **배포**: GitHub Pages (프론트엔드) + Heroku (백엔드)

---

## 📦 설치 및 실행 방법 (로컬 개발용)

### 1. 서버 설치
```bash
git clone https://github.com/your-username/multi-pingpong-server.git
cd multi-pingpong-server
npm install
node server.js
```
2. 클라이언트 실행
git clone https://github.com/your-username/multi-pingpong-client.git
cd multi-pingpong-client
# index.html을 브라우저로 열거나 GitHub Pages로 배포

⚠️ .js 코드 내 socket.io 연결 주소는 실제 배포된 서버 주소로 설정되어 있어야 합니다.

---

## 🎮 게임 방법
두 명이 각각 접속하면 자동으로 좌우 플레이어로 배정됩니다.

READY 버튼을 누르면 대기 상태로 진입합니다.

양쪽 모두 READY를 누르면 게임이 시작됩니다.

마우스를 위아래로 움직여 패들을 조작할 수 있습니다..

먼저 10점을 득점한 쪽이 승리합니다!

---

## 📁 파일 구성
```
multi-pingpong-client/
├── index.html          # 메인 HTML
├── style.css           # 게임 UI 스타일
├── game.js             # 클라이언트 로직 및 Socket.IO 통신
└── README.md           # 이 문서
```
---

## 📮 라이선스 & 사용

이 프로젝트는 학습 및 비상업적 목적에 자유롭게 사용할 수 있습니다.  
