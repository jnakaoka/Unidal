# APK experimental facial (portátil, sem produção)

Este fluxo usa exclusivamente a branch `feature/motor-reconhecimento-facial`, a API de testes e dados fictícios/participantes autorizados. Não publicar nem fazer merge em `main`.

## Preparação

1. No portátil: `git status -sb`, depois `git pull --ff-only origin feature/motor-reconhecimento-facial` **somente se não houver conflitos com alterações locais**. Preservar `mobile/.env`, `backend/app/data/documentos/` e `testes-faciais/`.
2. Confirmar que `.env.face-mobile` continua disponível e protegido. Nunca enviar chaves ao Git. Iniciar apenas o compose facial:
   `docker compose --env-file .env.face-mobile -f docker-compose.face-mobile.yml up -d --build`.
3. Verificar `docker compose --env-file .env.face-mobile -f docker-compose.face-mobile.yml ps` e `curl -I http://127.0.0.1:8001/docs` (o endpoint pode responder 405 a HEAD; preferir `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8001/openapi.json`).
4. **Verificar as tabelas e a migração** antes de cadastrar rostos. O compose não executa migrations automaticamente. Não aplicar `create_all` nem migrations na produção.
5. Criar um administrador e um utilizador fictícios na base isolada, por procedimento controlado. As rotas biométricas exigem autenticação de administrador.

## Acesso pelo Android

A API está publicada apenas em `127.0.0.1:8001` **no portátil**. O telefone não consegue usar esse endereço: `127.0.0.1` no telefone aponta para o próprio telefone. Antes do APK, providenciar um endpoint **HTTPS privado e autenticado**, que encaminhe apenas para a API facial de testes. Não abrir a porta diretamente à Internet nem usar `https://api.unidal.pt`. O URL tem de ser acessível pelo Samsung.

## Gerar APK com Expo EAS

No diretório `mobile`, instalar dependências (`npm ci` se o lockfile estiver consistente), autenticar no Expo (`npx eas-cli login`) e associar/configurar o projeto EAS se necessário. Configurar no ambiente de build `EXPO_PUBLIC_API_BASE_URL` com o **URL HTTPS da API isolada** (nunca a API de produção). O perfil `faceTest` em `eas.json` já define `EXPO_PUBLIC_FACE_BIOMETRICS_ENABLED=true` e saída APK.

Exemplo no Git Bash, substituindo o endereço fictício pelo endpoint privado real:

```bash
export EXPO_PUBLIC_API_BASE_URL="https://SEU-ENDPOINT-PRIVADO-DE-TESTES"
npx eas-cli build --platform android --profile faceTest
```

**Atenção:** builds remotos EAS precisam receber a variável no ambiente de build do EAS; exportar apenas no terminal pode não propagá-la. Configure-a como variável de ambiente no projeto Expo/EAS, no ambiente correto, e confirme que está presente antes de compilar. Não guardar credenciais no APK: variáveis `EXPO_PUBLIC_*` são públicas.

## Validação antes de usar

- Confirmar API de testes ativa e `FACE_BIOMETRICS_ENABLED=true` apenas neste compose.
- Testar login de admin, 3 capturas consentidas, validação, cadastro, consulta de estado e revogação.
- Confirmar que utilizador sem papel admin recebe 403 e que a API de produção não recebe imagens.
- O cadastro **não é reconhecimento 1:N, prova de vida, autenticação ou controlo de ponto**. Não utilizar para registar presença real ainda.
- Se falhar qualquer verificação, não distribuir APK para uso real.

## Próxima fase: localização + equipas

Implementar apenas após revisão funcional e de proteção de dados: permissões de localização explícitas, precisão/idade da leitura GPS, vínculo a obra/equipa, registo auditável e tratamento de falhas de rede. Não confiar apenas em GPS ou biometria para comprovar presença.
