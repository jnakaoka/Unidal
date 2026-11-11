# Motor de reconhecimento facial (ambiente de testes)

O cadastro facial usa **YuNet** para localizar um único rosto e **SFace** para gerar um vetor normalizado. O aplicativo solicita uma única fotografia, validada antes do envio do cadastro e novamente no servidor ao gerar o vetor. O vetor normalizado é cifrado antes de ser guardado em `face_profiles.embedding`. A API mantém o campo multipart `images` e aceita de 1 a 5 fotografias para compatibilidade com aplicativos anteriores; quando recebe várias, compara os vetores entre si e normaliza a média. Os perfis já cadastrados continuam válidos, sem migração nem novo cadastro obrigatório. As fotografias não são gravadas por este fluxo.

## Configuração

1. Obtenha ficheiros ONNX compatíveis com as APIs OpenCV `FaceDetectorYN` (YuNet) e `FaceRecognizerSF` (SFace) a partir de uma fonte confiável. **Verifique as licenças dos pesos e as permissões de utilização comercial antes de qualquer implantação**.
2. Disponibilize os ficheiros dentro do container da API de testes por um volume **somente de leitura**. Não adicione pesos ao Git.
3. Configure no serviço `api-test`:
   - `FACE_YUNET_MODEL=/caminho/no/container/yunet.onnx`
   - `FACE_SFACE_MODEL=/caminho/no/container/sface.onnx`
   - `FACE_EMBEDDING_KEY=<chave Fernet>`
4. Gere uma chave Fernet de forma segura, por exemplo: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`. Guarde-a num secret, nunca no Git. Sem essa chave, o cadastro falha fechado com HTTP 503.
5. Reconstrua a imagem de teste e execute `PYTHONPATH=backend python -m pytest --noconftest backend/tests/test_face_engine.py backend/tests/test_face_enrollment_api.py backend/tests/test_face_verification.py -q` na raiz do repositório, no ambiente Python adequado. Estes testes são isolados e dispensam as fixtures globais de MySQL. Os testes automatizados não substituem um ensaio com fotografias consentidas e dados fictícios.

Se os modelos não estiverem configurados, a API continua a devolver HTTP 503 para o cadastro, em vez de simular reconhecimento.

## Limitações importantes

- Uma captura pode ser mais sensível a mudanças de iluminação e posição. Validar a taxa de reconhecimento com participantes autorizados em condições reais antes de uso operacional. A moldura é uma orientação visual: não é deteção em tempo real nem garantia de nitidez ou iluminação.
- O limiar de consistência (similaridade 0,55), aplicado apenas quando são enviadas várias fotografias, é preliminar; exige calibração, avaliação de falsos positivos/negativos e testes em condições reais.
- Este fluxo **não implementa prova de vida**, verificação 1:N nem controlo de ponto. Não o utilize como mecanismo único de autenticação.
- A chave Fernet deve ser conservada e gerida com controlo de acesso e plano de rotação. Perder a chave torna os templates ilegíveis.
- O modelo e os vetores são dados biométricos sensíveis: é necessário avaliar base legal, proporcionalidade, retenção, transparência e requisitos RGPD antes de recolher dados reais de trabalhadores.
- A baseline criada com `create_all` no banco de testes não valida a sequência histórica das migrations. Não aplicar o mesmo procedimento em produção.


## Desempenho e diagnóstico das capturas

- YuNet recebe uma versão com lado maior limitado a 960 píxeis, sem ampliar fotografias menores. A caixa e os cinco landmarks são reescalados para a fotografia original, que continua a alimentar o alinhamento e o embedding SFace. Os limites de formato, tamanho, resolução, rosto único e enquadramento continuam ativos. A versão do embedding e os perfis existentes não mudam.
- A inferência executa numa thread de trabalho para não bloquear o event loop. Um lock por motor protege os objetos OpenCV partilhados entre capturas e cadastros concorrentes.
- Os logs `face_detection` e `face_embedding` mostram resolução, número de rostos e duração. `face_request` mostra a operação, referência, resultado da inferência e duração; na operação `enroll`, isto é anterior à gravação no banco. Os logs novos não incluem imagens, embeddings, nomes ou emails.
- `/biometrics/capture/check` devolve `processing_ms` e `request_id` em caso de sucesso. Erros do motor incluem o cabeçalho `X-Face-Request-ID`. O tempo medido começa depois da autenticação e leitura do upload e inclui a espera pela thread/lock; não mede todo o percurso de rede.
- O aplicativo distingue tempo excedido, falha de ligação, sessão expirada, permissão e rejeição da fotografia. O limite de espera da validação passa a 60 segundos como margem, não como substituto da otimização. Uma validação que falhe por timeout não grava o cadastro.
- A câmara tem área proporcional e a página permite deslocação com margem para a navegação Android. A pré-visualização só ganha contorno verde depois da resposta válida da API. Não existe deteção contínua antes da captura nem envio automático de fotografias.

Após atualizar a API, repetir a captura no Samsung e comparar os tempos nos logs. Testes com stubs e medições locais não garantem o mesmo desempenho no portátil nem substituem a validação de qualidade com fotografias autorizadas.


## Verificação experimental 1:1

`POST /biometrics/users/{user_id}/verify` recebe uma única imagem no campo multipart `image`. Exige administrador e `FACE_BIOMETRICS_ENABLED=true`, como o cadastro. Extrai a nova captura com YuNet/SFace e compara apenas com o perfil cifrado do ID escolhido. Não altera esse perfil nem grava a selfie no servidor ou cria presença. O perfil deve continuar ativo e usar o mesmo modelo e dimensão do vetor.

A resposta HTTP 200 contém `matched` (verdadeiro ou falso), `user_id`, `user_name`, `similarity`, `threshold`, `model_version`, `verified_at`, `request_id` e `processing_ms`. Não devolve o template. `processing_ms` mede a inferência, não a duração total do upload/comparação. Ausência de rosto ou imagem inválida devolve 422; utilizador inexistente, 404; perfil ausente/revogado/inativo ou modelo incompatível, 409; chave/template ilegível ou configuração inválida, 503. Não correspondência é um resultado normal (200 com `matched=false`), não um erro de autenticação.

A semelhança é o cosseno normalizado entre os vetores, limitado a [-1, 1]. Não é uma percentagem de confiança. O limiar inicial experimental é **0,5**, configurável em `.env.face-mobile` por `FACE_VERIFICATION_THRESHOLD` (valor finito maior que 0 e até 1). O compose facial passa esta variável à API; recriar o serviço após alterá-la. O limiar não é o 0,55 de consistência do cadastro. A [documentação do OpenCV](https://docs.opencv.org/4.12.0/d0/dd4/tutorial_dnn_face.html) apresenta resultados com limiares distintos por conjunto de avaliação; nenhum deles substitui a calibração nas condições reais da Unidal. O valor inicial 0,5 é uma escolha de teste, sem taxa de acerto garantida.

No APK experimental, o administrador encontra **Verificar rosto** na página inicial. Indica o ID já cadastrado, toca em **Capturar e verificar** e vê **Rosto corresponde** ou **Não foi possível confirmar**. A pré-visualização fica verde apenas numa correspondência devolvida pela API. **Nova selfie** repete o teste; mudar o ID limpa o resultado anterior. O ecrã mostra os valores de semelhança/limiar e a referência para diagnosticar os testes, não para validar assiduidade.

### Ensaio no Samsung

Manter o cadastro de referência fixo durante as tentativas; não recadastrar a segunda pessoa sobre o mesmo ID.

| Caso | Resultado a avaliar |
| --- | --- |
| Mesma pessoa, selfie nova, frontal e com boa luz | Correspondência |
| Outra pessoa, comparada com o mesmo ID | Não confirmação |
| Mesma pessoa com pequenas variações naturais e de luz | Medir rejeições e repetir quando necessário |
| Sem rosto, rosto cortado ou várias pessoas | Rejeição da captura |
| Perfil revogado/inativo ou ID inexistente | Erro de perfil, sem correspondência |

Registar apenas caso, resultado, referência e semelhança/limiar numa avaliação consentida. Avaliar falsas aceitações e falsas rejeições antes de decidir um limiar operacional. Os testes automatizados usam vetores sintéticos e SQLite em memória; não medem precisão biométrica com pessoas reais. Este fluxo ainda não fornece prova de vida, identificação 1:N, autenticação autónoma nem registo de ponto.
