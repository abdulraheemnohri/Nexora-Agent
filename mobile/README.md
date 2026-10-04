# Nexora Mobile

Android companion for the Nexora gateway. The Debian/Linux machine can run the full agent and LiteRT-LM CLI while Android provides chat, notifications, voice/session controls, and future device tools.

## Build

    cd mobile
    ./gradlew :app:assembleDebug

Android Studio can open the `mobile` directory directly.

## Architecture

Android -> authenticated Nexora Gateway -> local LiteRT-LM / cloud providers.

For a real phone, replace the development `10.0.2.2:8000` URL with the gateway's HTTPS address and configure a bearer token. Do not expose an unauthenticated FastAPI development server to the Internet.

## Background behavior

The foreground service is only a foundation for long-running agent status/voice work. Android 12+ restricts background foreground-service starts and Android 14+ adds service-type permission requirements, so the app must request/start the service from an allowed user-visible flow.
