# update_tunnel_cnames.ps1
param(
    [string] $APIToken = "<COLOCA_AQUI_O_SEU_API_TOKEN>",   # precisa DNS:Edit para a zona
    [string] $ZoneName = "unidal.pt",
    [string[]] $FQDNs = @("apontamento.unidal.pt","api.unidal.pt"),
    [string] $TunnelID = "c1c61812-8888-4048-94bd-12a04936e9cc",
    [bool] $Proxied = $true,
    [int] $TTL = 1  # 1 = Auto
)

if ($APIToken -like "<*>" -or $APIToken -eq "") {
    Write-Error "Define um API token com permissão Zone:DNS:Edit e substitui $APIToken."
    exit 1
}

$base = "https://api.cloudflare.com/client/v4"
$headers = @{ "Authorization" = "Bearer $APIToken"; "Content-Type" = "application/json" }

# 1) obter zone id
$zoneResp = Invoke-RestMethod -Method Get -Uri "$base/zones?name=$ZoneName" -Headers $headers
if (-not $zoneResp.success -or $zoneResp.result.Count -eq 0) { Write-Error "Zona $ZoneName não encontrada via API."; exit 1 }
$zoneId = $zoneResp.result[0].id
Write-Host "Zone ID: $zoneId"

# CNAME target
$contentTarget = "$TunnelID.cfargotunnel.com"

foreach ($fqdn in $FQDNs) {
    Write-Host "`nProcessando $fqdn -> $contentTarget"

    # 2) procurar registo CNAME existente
    $query = "$base/zones/$zoneId/dns_records?type=CNAME&name=$fqdn"
    $existing = Invoke-RestMethod -Method Get -Uri $query -Headers $headers

    if ($existing.success -and $existing.result.Count -gt 0) {
        # atualizar o primeiro registo encontrado
        $rec = $existing.result[0]
        $recId = $rec.id
        $payload = @{
            type = "CNAME"
            name = $fqdn
            content = $contentTarget
            proxied = $Proxied
            ttl = $TTL
        } | ConvertTo-Json

        $upd = Invoke-RestMethod -Method Patch -Uri "$base/zones/$zoneId/dns_records/$recId" -Headers $headers -Body $payload
        if ($upd.success) { Write-Host "Atualizado $fqdn (id=$recId) -> $contentTarget" } else { Write-Warning "Falha a atualizar $fqdn"; $upd | Format-List }
    } else {
        # criar novo registo
        $payload = @{
            type = "CNAME"
            name = $fqdn
            content = $contentTarget
            proxied = $Proxied
            ttl = $TTL
        } | ConvertTo-Json

        $create = Invoke-RestMethod -Method Post -Uri "$base/zones/$zoneId/dns_records" -Headers $headers -Body $payload
        if ($create.success) { Write-Host "Criado CNAME $fqdn -> $contentTarget" } else { Write-Warning "Falha a criar $fqdn"; $create | Format-List }
    }
}

