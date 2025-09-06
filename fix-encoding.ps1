# Salve como fix-encoding-force.ps1
$directory = "c:\Users\luizp\Documents\APPs\Poupeja\poupeja-final"

# Lista de arquivos com problemas conhecidos
$problematicFiles = @(
    "$directory\src\pages\RegisterWithPlanPage.tsx",
    "$directory\src\integrations\supabase\types.ts"
    # Adicione outros arquivos problemáticos aqui
)

# Função para corrigir a codificação de um arquivo
function Fix-FileEncoding {
    param (
        [string]$filePath
    )
    
    try {
        # Tenta ler o arquivo com codificação alternativa
        $content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::GetEncoding("ISO-8859-1"))
        
        # Escreve o conteúdo com UTF-8 sem BOM
        $utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($filePath, $content, $utf8NoBomEncoding)
        
        Write-Host "Corrigido: $filePath" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "Erro ao corrigir: $filePath - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

$fixedCount = 0
$errorCount = 0

foreach ($file in $problematicFiles) {
    Write-Host "Corrigindo: $file" -ForegroundColor Yellow
    $success = Fix-FileEncoding -filePath $file
    if ($success) {
        $fixedCount++
    } else {
        $errorCount++
    }
}

Write-Host "\nProcesso concluído!" -ForegroundColor Cyan
Write-Host "Arquivos corrigidos: $fixedCount" -ForegroundColor Green
Write-Host "Erros encontrados: $errorCount" -ForegroundColor Red