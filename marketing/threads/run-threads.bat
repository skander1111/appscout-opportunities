@echo off
cd /d "C:\Users\aloui\appscout\marketing\threads"
set NODE="C:\Program Files\nodejs\node.exe"
set LOG="C:\Users\aloui\appscout\marketing\threads\scheduler.log"

echo [%date% %time%] Running Threads automation >> %LOG%

REM English account
%NODE% generateThreadsPosts.js --lang en >> %LOG% 2>&1
%NODE% threadsPublisher.js --next --lang en >> %LOG% 2>&1

REM German account (DACH)
%NODE% generateThreadsPosts.js --lang de >> %LOG% 2>&1
%NODE% threadsPublisher.js --next --lang de >> %LOG% 2>&1

echo [%date% %time%] Done >> %LOG%
