# Unidal Mobile

Aplicativo Android da plataforma operacional Unidal.

## Arquitetura

- Expo + React Native para login, sessão segura e navegação mobile.
- `expo-secure-store` para access e refresh tokens.
- Módulos da plataforma carregados autenticados dentro do aplicativo, usando a mesma API e base de dados do web.
- Acesso por perfil igual ao web: administrador, operador e motorista.

## Executar em desenvolvimento

```bash
npm install
npx expo start
```

## Gerar APK instalável

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

O perfil `preview` de `eas.json` gera um APK para instalação direta. O perfil `production` gera AAB para publicação na Google Play.

## Endereços

- API: `https://api.unidal.pt`
- Plataforma: `https://apontamento.unidal.pt`

Podem ser substituídos em desenvolvimento pelas variáveis `EXPO_PUBLIC_API_BASE_URL` e `EXPO_PUBLIC_WEB_BASE_URL`.
