# delete_tunnels_fixed.ps1
# Uso: executar na pasta do projecto (onde existe ./etc/cloudflared)
$hostDir = (Resolve-Path ".\etc\cloudflared").ProviderPath
Write-Host "Host cloudflared dir: $hostDir"

# Monta a mesma pasta para o CLI do cloudflared (para usar o cert.pem)
$mount = "${hostDir}:/home/nonroot/.cloudflared"

Write-Host "Listando túneis (usarás o mesmo mount para delete):"
docker run --rm -v $mount cloudflare/cloudflared:latest tunnel list

# Ajusta os nomes das variáveis abaixo conforme os túneis que queres apagar.
# Se queres apagar todos, substitui a lista pelos nomes que aparecem no 'tunnel list'.
$tunnelsToDelete = @("unidal-tunnel","unidal-tunnel-2") 

foreach ($t in $tunnelsToDelete) {
    Write-Host "Tentando apagar túnel: $t"
    docker run --rm -v $mount cloudflare/cloudflared:latest tunnel delete $t
}
Write-Host "Feito. Reexecuta 'docker run ... tunnel list' se quiseres confirmar."




# # delete_tunnels.ps1
# $hostDir = Join-Path $PSScriptRoot "etc\cloudflared"
# if (-not (Test-Path $hostDir)) { Write-Error "Pasta $hostDir não existe"; exit 1 }

# # nomes dos túneis a apagar
# $tunnelsToDelete = @("unidal-tunnel","unidal-tunnel-2","unidal-tunel") 

# foreach ($t in $tunnelsToDelete) {
    # Write-Host "Tentando apagar tunnel '$t' (se existir)..."
    # docker run --rm -v "$hostDir:/home/nonroot/.cloudflared" cloudflare/cloudflared:latest tunnel delete $t 2>&1 |
      # ForEach-Object { $_ } 
    # Start-Sleep -Seconds 1
# }
# Write-Host "Operação de remoção terminada. Se algum túnel existia, deverá ter sido removido (ou reportado erro). Verifica no painel Cloudflare."
