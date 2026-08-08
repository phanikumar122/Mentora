@REM ----------------------------------------------------------------------------
@REM Maven Wrapper startup batch script for Windows
@REM ----------------------------------------------------------------------------

@if "%DEBUG%" == "" @echo off
@setlocal

set DIRNAME=%~dp0
if "%DIRNAME%" == "" set DIRNAME=.
set MAIN_CLASS=org.apache.maven.wrapper.MavenWrapperMain

set WRAPPER_JAR=%DIRNAME%\.mvn\wrapper\maven-wrapper.jar
set WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

@REM Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if "%ERRORLEVEL%" == "0" goto execute

echo.
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.
goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE="%JAVA_HOME%\bin\java.exe"

if exist %JAVA_EXE% goto execute

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if "%ERRORLEVEL%" == "0" goto execute

echo.
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.
goto fail

:execute
@REM Download wrapper JAR if it doesn't exist
if exist "%WRAPPER_JAR%" goto run

mkdir "%DIRNAME%\.mvn\wrapper" 2>NUL
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar', '%WRAPPER_JAR%')"

:run
%JAVA_EXE% "-Dmaven.multiModuleProjectDirectory=%DIRNAME:~0,-1%" "-Dmaven.home=%DIRNAME%\.mvn\wrapper" -classpath "%WRAPPER_JAR%" %MAIN_CLASS% %*
if ERRORLEVEL 1 goto fail
goto end

:fail
exit /b 1

:end
exit /b 0
