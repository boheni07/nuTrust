@echo off
echo [1/5] .env 파일 생성...
if not exist .env (
    copy .env.example .env
    echo .env 생성 완료
) else (
    echo .env 이미 존재
)

echo [2/5] 패키지 설치...
call npm install

echo [3/5] Docker DB 실행...
docker compose up -d
timeout /t 5 /nobreak > nul

echo [4/5] DB 스키마 적용...
call npx prisma db push

echo [5/5] 시드 데이터 삽입...
call npx tsx prisma/seed.ts

echo.
echo 완료! 아래 명령어로 서버를 시작하세요:
echo   npm run dev
echo.
echo 접속: http://localhost:3000
echo 계정: admin@servicedesk.com / password123
