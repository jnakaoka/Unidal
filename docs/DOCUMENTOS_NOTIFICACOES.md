# Documentos e notificações de edições

## Funcionalidades

O menu Documentos está disponível para admin, operador e motorista. O admin cria categorias, define a visibilidade, publica documentos, envia novas versões e arquiva documentos. Funcionários podem pesquisar, consultar versões e descarregar os ficheiros autorizados.

Cada documento herda as permissões da categoria: todos, perfis selecionados, funcionários selecionados ou apenas admins. Admins ativos têm acesso a todas as categorias. Listagem, versões e download verificam a autorização na API a cada pedido, incluindo após alterar as permissões. Ficheiros não possuem URL pública. Contas inativas não têm acesso.

Downloads são autenticados, como anexos, sem cache. Formatos permitidos: PDF, PNG, JPG/JPEG, DOC/DOCX e XLS/XLSX. O limite padrão é 20 MB por ficheiro. As versões antigas são preservadas. Arquivar retira o documento da consulta e impede downloads, mantendo os ficheiros.

Edições de apontamentos requerem autenticação: admins ativos podem editar qualquer apontamento; os outros utilizadores ativos só podem editar os próprios. O autor é obtido do JWT, ignorando o campo `modificado_por` enviado pelos clientes antigos. O histórico preserva cada campo alterado e os valores antes/depois, incluindo equipa e opções de máquinas. Alteração, histórico e notificações são guardados na mesma transação. Gravar sem mudanças não gera alerta. O histórico permanece após eliminar um apontamento.

Todos os admins ativos recebem uma notificação por edição, inclusive edições feitas por admins. Cada destinatário tem a própria marcação de leitura. O sino e a página de notificações consultam a API a cada 30 segundos enquanto abertos. O histórico completo pode ser consultado a partir da notificação.

Esta versão implementa alertas dentro da plataforma web. Email e telas no aplicativo móvel não estão incluídos. O aplicativo que já envia Bearer JWT ao editar beneficia automaticamente do histórico no backend.

## Aplicação no ambiente

1. Fazer backup do banco e da pasta persistente `backend/app/data`.
2. Aplicar a branch e a migração nova, encadeada no head `f19a6c4e2b71`.
3. Reiniciar API e reconstruir frontend.

Com o Docker Compose existente, na raiz do repositório:

```bash
git fetch origin
git switch feature/documentos-notificacoes
git pull --ff-only
docker compose exec api alembic upgrade head
docker compose up -d --build api frontend
```

A migração não altera apontamentos existentes e começa com categorias, documentos e notificações vazios. Não utiliza `create_all`, stamp ou alterações à rede.

O Compose já monta `backend/app/data` como `/app/data`. Por padrão, os ficheiros são guardados em `/app/data/documentos`, persistindo ao recriar containers. Incluir esta pasta no backup junto com o banco. Nunca disponibilizá-la como pasta pública no Nginx.

Configuração opcional por variáveis de ambiente da API:

- `DOCUMENTOS_DIR`: pasta privada dos ficheiros. Padrão `/app/data/documentos`.
- `DOCUMENTOS_MAX_MB`: limite de ficheiro em MB. Padrão `20`.

Caso exista limite de upload no proxy reverso, ajustá-lo para comportar o ficheiro e o multipart, por exemplo 25 MB para ficheiros de 20 MB. Não é necessário alterar IPv4, IPv6 ou Cloudflare Tunnel.

## Validação

Testes isolados com SQLite, sem acesso ao banco de produção:

```bash
python -m pip install -r backend/requirements-test.txt python-dotenv
python -m pytest tests/test_documentos_notificacoes.py -q
npm ci --prefix frontend
npm run build --prefix frontend
```

Cobertura: categorias públicas/restritas, permissões por perfil e funcionário, revogação de acesso, downloads diretos, utilizadores inativos, uploads e versões, arquivo, limites e limpeza de ficheiros após falha, autoria real via JWT, leitura individual, alterações de equipa, gravação sem mudanças e migração upgrade/downgrade e compilação SQL MySQL.

Os testes de integração preexistentes em `backend/tests` exigem o MySQL dedicado `db-test`; não executá-los sobre produção.
