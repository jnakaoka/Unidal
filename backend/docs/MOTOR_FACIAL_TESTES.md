# Motor de reconhecimento facial (ambiente de testes)

O cadastro facial usa **YuNet** para localizar um único rosto e **SFace** para gerar um vetor normalizado. São exigidas 3 a 5 fotografias; os vetores são comparados entre si e a média normalizada é cifrada antes de ser guardada em `face_profiles.embedding`. As fotografias não são gravadas por este fluxo.

## Configuração

1. Obtenha ficheiros ONNX compatíveis com as APIs OpenCV `FaceDetectorYN` (YuNet) e `FaceRecognizerSF` (SFace) a partir de uma fonte confiável. **Verifique as licenças dos pesos e as permissões de utilização comercial antes de qualquer implantação**.
2. Disponibilize os ficheiros dentro do container da API de testes por um volume **somente de leitura**. Não adicione pesos ao Git.
3. Configure no serviço `api-test`:
   - `FACE_YUNET_MODEL=/caminho/no/container/yunet.onnx`
   - `FACE_SFACE_MODEL=/caminho/no/container/sface.onnx`
   - `FACE_EMBEDDING_KEY=<chave Fernet>`
4. Gere uma chave Fernet de forma segura, por exemplo: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`. Guarde-a num secret, nunca no Git. Sem essa chave, o cadastro falha fechado com HTTP 503.
5. Reconstrua a imagem de teste e execute `pytest backend/tests/test_face_engine.py` no ambiente Python adequado. Os testes automatizados não substituem um ensaio com fotografias consentidas e dados fictícios.

Se os modelos não estiverem configurados, a API continua a devolver HTTP 503 para o cadastro, em vez de simular reconhecimento.

## Limitações importantes

- O limiar de consistência (similaridade 0,55) é preliminar; exige calibração, avaliação de falsos positivos/negativos e testes em condições reais.
- Este fluxo **não implementa prova de vida**, verificação 1:N nem controlo de ponto. Não o utilize como mecanismo único de autenticação.
- A chave Fernet deve ser conservada e gerida com controlo de acesso e plano de rotação. Perder a chave torna os templates ilegíveis.
- O modelo e os vetores são dados biométricos sensíveis: é necessário avaliar base legal, proporcionalidade, retenção, transparência e requisitos RGPD antes de recolher dados reais de trabalhadores.
- A baseline criada com `create_all` no banco de testes não valida a sequência histórica das migrations. Não aplicar o mesmo procedimento em produção.
