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
5. Reconstrua a imagem de teste e execute `PYTHONPATH=backend python -m pytest --noconftest backend/tests/test_face_engine.py backend/tests/test_face_enrollment_api.py -q` na raiz do repositório, no ambiente Python adequado. Estes testes são isolados e dispensam as fixtures globais de MySQL. Os testes automatizados não substituem um ensaio com fotografias consentidas e dados fictícios.

Se os modelos não estiverem configurados, a API continua a devolver HTTP 503 para o cadastro, em vez de simular reconhecimento.

## Limitações importantes

- Uma captura pode ser mais sensível a mudanças de iluminação e posição. Validar a taxa de reconhecimento com participantes autorizados em condições reais antes de uso operacional. A moldura é uma orientação visual: não é deteção em tempo real nem garantia de nitidez ou iluminação.
- O limiar de consistência (similaridade 0,55), aplicado apenas quando são enviadas várias fotografias, é preliminar; exige calibração, avaliação de falsos positivos/negativos e testes em condições reais.
- Este fluxo **não implementa prova de vida**, verificação 1:N nem controlo de ponto. Não o utilize como mecanismo único de autenticação.
- A chave Fernet deve ser conservada e gerida com controlo de acesso e plano de rotação. Perder a chave torna os templates ilegíveis.
- O modelo e os vetores são dados biométricos sensíveis: é necessário avaliar base legal, proporcionalidade, retenção, transparência e requisitos RGPD antes de recolher dados reais de trabalhadores.
- A baseline criada com `create_all` no banco de testes não valida a sequência histórica das migrations. Não aplicar o mesmo procedimento em produção.
