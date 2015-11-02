@echo off
rem
rem (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved.
rem
rem Run the SailPoint IdentityIQ application launcher.
rem
rem The script will try to find the IdentityIQ installation directory
rem automatically by looking relative to the location of this script.  The
rem SPHOME environment variable can be used if this logic does not work or
rem to force a specific installation directory.
rem
rem A supported Java runtime must be in the PATH.
rem The sun.lang.ClassLoader.allowArraySyntax option is necessary 
rem if you want to use JDK 1.6.
rem

setlocal

set JAVA_OPTS=-Xms128m -Xmx256m -Dsun.lang.ClassLoader.allowArraySyntax=true

if "%SPHOME%" == "" goto CalculateSPHome

if exist "%SPHOME%\WEB-INF\lib\identityiq.jar" goto SPHomeComplete
if exist "%SPHOME%\WEB-INF\classes\sailpoint\launch\Launcher.class" goto SPHomeComplete

echo SPHOME is set, but is not valid.  Attempting to determine the correct value.

:CalculateSPHome

set SPHOME=%~dp0..\..
if exist "%SPHOME%\WEB-INF\lib\identityiq.jar" goto SPHomeComplete
if exist "%SPHOME%\WEB-INF\classes\sailpoint\launch\Launcher.class" goto SPHomeComplete

set SPHOME=.
if exist "%SPHOME%\WEB-INF\lib\identityiq.jar" goto SPHomeComplete
if exist "%SPHOME%\WEB-INF\classes\sailpoint\launch\Launcher.class" goto SPHomeComplete

set SPHOME=..
if exist "%SPHOME%\WEB-INF\lib\identityiq.jar" goto SPHomeComplete
if exist "%SPHOME%\WEB-INF\classes\sailpoint\launch\Launcher.class" goto SPHomeComplete

set SPHOME=%~dp0..\..\build
if exist "%SPHOME%\WEB-INF\lib\identityiq.jar" goto SPHomeComplete
if exist "%SPHOME%\WEB-INF\classes\sailpoint\launch\Launcher.class" goto SPHomeComplete

echo SPHOME is not set or is incorrect and unable to determine the correct value.
goto end

:SPHomeComplete

rem  parse any command line arguments specific to this script
set DEBUG=
if not "%1" == "-d" goto debugCheckComplete
set DEBUG=-d
shift

:debugCheckComplete

rem Move all of the command line arguments to one variable so that we can
rem have a variable number of arguments
set ARGS=%1
if [%1] == [] goto argsComplete
shift
:parseArgs
if [%1] == [] goto argsComplete
set ARGS=%ARGS% %1
shift
goto parseArgs

:argsComplete

rem Set a bootstrap CLASSPATH.  A special classloader will be used to
rem add the rest of our CLASSPATH.
if not "%CLASSPATH%" == "" set CLASSPATH=%CLASSPATH%;
set CLASSPATH=%CLASSPATH%%SPHOME%\WEB-INF\classes
set CLASSPATH=%CLASSPATH%;%SPHOME%\WEB-INF\lib\identityiq.jar

rem Clear SPHOME to make sure it does not interfere with application home
rem calculation in Java code.
set SPHOME=

set COMMAND_LINE=java %JAVA_OPTS% sailpoint.launch.Launcher %DEBUG% %ARGS%

if not "%DEBUG%" == "" echo %COMMAND_LINE%
%COMMAND_LINE%

:end

endlocal
