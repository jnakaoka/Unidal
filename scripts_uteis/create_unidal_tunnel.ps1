<#
 create_unidal_tunnel_fixed.ps1
 Usage: powershell ./create_unidal_tunnel_fixed.ps1
#>

param(
    [string]$ProjectRoot
)

# 1) Determina raiz do projecto (pai da pasta onde está o script) se não for passado
if (-not $ProjectRoot) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    # assume que o script está em ...\scripts_uteis\ e queres a pasta pai
    $ProjectRoot = (Resolve-Path (Join-Path $scriptDir "..")).ProviderPath
}
$hostDir = Join-Path $ProjectRoot "etc\cloudflared"

# 2) Assegura que a pasta existe
if (-not (Test-Path $hostDir)) {
    Write-Host "Criando pasta: $hostDir"
    New-Item -ItemType Directory -Path $hostDir | Out-Null
}

Write-Host "Usando host dir: $hostDir"

# 3) construir string do mount sem causar ambiguidade no parser
$mountForLogin = $hostDir + ":/home/nonroot/.cloudflared"
$mountForConfig = $hostDir + ":/etc/cloudflared"

# 4) Login (interactivo) - grava cert.pem em hostDir
Write-Host "`n----------------------------------------"
Write-Host "1) Login Cloudflare (isto abre o browser). Segue o fluxo no browser."
Write-Host "Se já tiveres cert.pem em $hostDir podes pular este passo."
Write-Host "----------------------------------------`n"

# Executa o login - vai guardar cert.pem em $hostDir
docker run --rm -it -v $mountForLogin cloudflare/cloudflared:latest login

# verificar cert.pem
$certPathHost = Join-Path $hostDir "cert.pem"
if (-not (Test-Path $certPathHost)) {
    Write-Error "cert.pem não encontrado em $hostDir. Repete 'docker run ... login' e confirma no browser."
    exit 1
}
Write-Host "cert.pem encontrado em: $certPathHost"

# 5) Criar tunnel (vai criar um ficheiro JSON no hostDir)
$tunnelName = "unidal-tunnel"
Write-Host "`n2) Criando tunnel '$tunnelName' (se já existir a CLI dirá)."
docker run --rm -v $mountForLogin cloudflare/cloudflared:latest tunnel create $tunnelName

# localizar ficheiro .json gerado (o mais recente)
$jsonFiles = Get-ChildItem -Path $hostDir -Filter "*.json" | Sort-Object LastWriteTime -Descending
if ($jsonFiles.Count -eq 0) {
    Write-Error "Nenhum ficheiro .json encontrado em $hostDir após 'tunnel create'."
    exit 1
}
$credsFile = $jsonFiles[0].FullName
$tunnelId = [System.IO.Path]::GetFileNameWithoutExtension($credsFile)
Write-Host "Ficheiro de credenciais detectado: $credsFile"
Write-Host "Tunnel ID: $tunnelId"

# 6) Escrever config.yml (substitui se existir)
$configPath = Join-Path $hostDir "config.yml"
$configContent = @"
tunnel: $tunnelId
credentials-file: /etc/cloudflared/$tunnelId.json

ingress:
  - hostname: apontamento.unidal.pt
    service: http://unidal_frontend:80

  - hostname: api.unidal.pt
    service: http://unidal_api:8000

  - service: http_status:404
"@

Set-Content -Path $configPath -Value $configContent -Encoding UTF8
Write-Host "`nWrote config.yml to $configPath"

# 7) Reiniciar/lançar container cloudflared usando config.yml local montado
# Remove container existente (silenciosamente)
Write-Host "`n8) Reiniciando container 'cloudflared' com novo config..."
docker rm -f cloudflared 2>$null | Out-Null

# Ajusta o network name se necessário (ex: 'unidal_proxy' no teu ambiente)
$networkName = "unidal_proxy"

# Executa o container em background, montando ./etc/cloudflared -> /etc/cloudflared
docker run -d --name cloudflared --restart unless-stopped --network $networkName -v $mountForConfig cloudflare/cloudflared:latest tunnel run --config /etc/cloudflared/config.yml

Start-Sleep -Seconds 2
Write-Host "`nContainer cloudflared lançado. Verifica os logs com: docker logs -f cloudflared"

# 8) Criar rotas DNS (pode falhar se registo já existir)
Write-Host "`n9) Tentando criar registos DNS (pode dar erro 'record already exists')"
Write-Host "Tentando apontamento.unidal.pt -> $tunnelName..."
docker run --rm -v $mountForLogin cloudflare/cloudflared:latest tunnel route dns $tunnelName apontamento.unidal.pt

Write-Host "Tentando api.unidal.pt -> $tunnelName..."
docker run --rm -v $mountForLogin cloudflare/cloudflared:latest tunnel route dns $tunnelName api.unidal.pt

Write-Host "`nScript concluído. Verifica: Get-ChildItem $hostDir (deve conter cert.pem, $tunnelId.json, config.yml)."


# # create_unidal_tunnel.ps1
# Set-StrictMode -Version Latest

# $proj = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
# $hostDir = Join-Path $proj "etc\cloudflared"

# if (-not (Test-Path $hostDir)) {
    # New-Item -ItemType Directory -Path $hostDir -Force | Out-Null
    # Write-Host "Criada pasta: $hostDir"
# }

# Write-Host "1) Login no Cloudflare para gerar cert.pem (um browser será aberto)."
# Write-Host "Se já tens cert.pem na pasta, podes ignorar esta etapa."
# docker run --rm -it -v "$hostDir:/home/nonroot/.cloudflared" cloudflare/cloudflared:latest login

# # Espera pequena para o ficheiro aparecer
# Start-Sleep -Seconds 1
# if (-not (Test-Path (Join-Path $hostDir "cert.pem"))) {
    # Write-Warning "cert.pem não encontrado em $hostDir — verifica se fizeste login e se permitiste ao cloudflared guardar o ficheiro."
    # Read-Host "Press Enter to continue (or Ctrl+C to stop)"
# }

# Write-Host "2) Criar tunnel (vai gerar um ficheiro <tunnel-id>.json em $hostDir)."
# $tunnelName = "unidal-tunel"
# $createOut = docker run --rm -v "$hostDir:/home/nonroot/.cloudflared" cloudflare/cloudflared:latest tunnel create $tunnelName 2>&1
# $createOut | ForEach-Object { Write-Host $_ }

# # procura o ficheiro json mais recente na pasta
# $jsonFiles = Get-ChildItem -Path $hostDir -Filter "*.json" | Sort-Object LastWriteTime -Descending
# if ($jsonFiles.Count -eq 0) {
    # Write-Error "Nenhum ficheiro .json encontrado em $hostDir — a criação do tunnel falhou. Vê o output acima."
    # exit 1
# # }

# $credsFile = $jsonFiles[0].Name
# Write-Host "Usando ficheiro de credenciais: $credsFile"

# # extrair tunnel id do output se possível (fallback para nome)
# if ($createOut -match "Created tunnel (.+) \(") {
    # $tunnelId = $matches[1]
# } else {
    # # tenta extrair do nome do ficheiro
    # $tunnelId = [System.IO.Path]::GetFileNameWithoutExtension($credsFile)
# }

# Write-Host "Tunnel ID detectado: $tunnelId"

# Write-Host "3) Gerar config.yml em $hostDir (substitui o existente)."
# $config = @"
# tunnel: $tunnelId
# credentials-file: /etc/cloudflared/$credsFile

# ingress:
  # - hostname: apontamento.unidal.pt
    # service: http://unidal_frontend:80

  # - hostname: api.unidal.pt
    # service: http://unidal_api:8000

  # - service: http_status:404
# "@

# $configPathHost = Join-Path $hostDir "config.yml"
# $config | Out-File -FilePath $configPathHost -Encoding UTF8 -Force
# Write-Host "config.yml escrito."

# Write-Host "4) Criar rotas DNS (CNAMEs) para os hostnames — se existir conflito, o script reporta."
# # Aponta hostname apontamento.unidal.pt e api.unidal.pt para o túnel
# function RunRoute($tunnelName, $hostname) {
    # Write-Host "Criando route DNS para $hostname -> $tunnelName ..."
    # $out = docker run --rm -v "$hostDir:/home/nonroot/.cloudflared" cloudflare/cloudflared:latest tunnel route dns $tunnelName $hostname 2>&1
    # $out | ForEach-Object { Write-Host $_ }
    # if ($out -match "already exists" -or $out -match "already configured") {
        # Write-Warning "$hostname já tem um registo DNS. Abre o painel Cloudflare DNS e apaga o registo existente (ou edita) para permitir criar a route."
    # }
# }

# RunRoute $tunnelName "apontamento.unidal.pt"
# RunRoute $tunnelName "api.unidal.pt"

# Write-Host "5) Arrancar container cloudflared com config.yml"
# # se já existir container em execução -> remove
# $existing = docker ps -a --filter "name=cloudflared" --format "{{.ID}}"
# if ($existing) {
    # Write-Host "Removendo container cloudflared existente..."
    # docker rm -f cloudflared | ForEach-Object { Write-Host $_ }
# }

# # arranca em background mapeando o hostDir para /etc/cloudflared (read-only)
# Write-Host "A executar: docker run -d --name cloudflared --restart unless-stopped --network unidal_proxy -v `"$hostDir:/etc/cloudflared:ro`" cloudflare/cloudflared:latest tunnel run --config /etc/cloudflared/config.yml"
# docker run -d --name cloudflared --restart unless-stopped --network unidal_proxy -v "$hostDir:/etc/cloudflared:ro" cloudflare/cloudflared:latest tunnel run --config /etc/cloudflared/config.yml | ForEach-Object { Write-Host $_ }

# Write-Host "`nFeito. Verificações sugeridas:"
# Write-Host "  docker logs --tail 200 cloudflared"
# Write-Host "  Get-ChildItem $hostDir | Format-Table Name, Length, LastWriteTime -AutoSize"
# Write-Host "  Verifica no painel Cloudflare -> Networks -> Tunnels que o 'unidal-tunel' aparece e está HEALTHY"
