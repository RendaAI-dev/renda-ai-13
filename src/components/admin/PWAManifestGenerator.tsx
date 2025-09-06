import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, FileText, Code, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PWAManifestData {
  company_name: string
  company_description: string
  logo_url: string
  theme_color: string
  background_color: string
  files: {
    manifest: {
      filename: string
      content: string
      path: string
    }
    service_worker: {
      filename: string
      content: string
      path: string
    }
  }
  instructions: Record<string, string>
}

export function PWAManifestGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [manifestData, setManifestData] = useState<PWAManifestData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [githubPath, setGithubPath] = useState('')
  const { toast } = useToast()

  const generatePWAManifest = async () => {
    setIsGenerating(true)
    setError(null)
    setManifestData(null)

    try {
      const { supabase } = await import('@/integrations/supabase/client')
      
      const { data, error: functionError } = await supabase.functions.invoke('generate-pwa-manifest')
      
      if (functionError || !data?.success) {
        throw new Error(functionError?.message || 'Erro ao gerar manifest PWA')
      }

      setManifestData(data.data)
      toast({
        title: "Manifest PWA gerado com sucesso!",
        description: "Os arquivos estão prontos para download e implementação.",
        variant: "default"
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast({
        title: "Erro ao gerar manifest PWA",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async (content: string, filename: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast({
        title: "Conteúdo copiado!",
        description: `${filename} foi copiado para a área de transferência.`,
        variant: "default"
      })
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar para a área de transferência.",
        variant: "destructive"
      })
    }
  }

  const openGitHubDirectory = () => {
    if (!githubPath) {
      toast({
        title: "Configuração necessária",
        description: "Preencha o caminho do GitHub primeiro (ex: seu-usuario/seu-repositorio).",
        variant: "destructive"
      })
      return
    }

    // Abrir GitHub no diretório public/ para upload dos arquivos
    const githubUrl = `https://github.com/${githubPath}/tree/main/public`
    window.open(githubUrl, '_blank')
    
    toast({
      title: "GitHub aberto!",
      description: `Navegando para ${githubPath}/public`,
      variant: "default"
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Gerador de Manifest PWA
        </CardTitle>
        <CardDescription>
          Gera manifest.json e service worker personalizados com as configurações de branding da empresa.
          Use esta ferramenta para personalizar o PWA instalado no dispositivo.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Botão de geração */}
        <div className="flex justify-center">
          <Button 
            onClick={generatePWAManifest} 
            disabled={isGenerating}
            size="lg"
            className="min-w-[200px]"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Gerando...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Gerar Manifest PWA
              </>
            )}
          </Button>
        </div>

        {/* Erro */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Resultado */}
        {manifestData && (
          <div className="space-y-6">
            {/* Informações da empresa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">Nome da Empresa</h4>
                <p className="text-lg font-medium">{manifestData.company_name}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">Descrição</h4>
                <p className="text-sm">{manifestData.company_description}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">Logo URL</h4>
                <p className="text-sm text-blue-600 break-all">{manifestData.logo_url}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">Cores</h4>
                <div className="flex gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: manifestData.theme_color }}
                    />
                    Tema: {manifestData.theme_color}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: manifestData.background_color }}
                    />
                    Fundo: {manifestData.background_color}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Arquivos */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Arquivos Gerados</h4>
              
              {/* Manifest */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{manifestData.files.manifest.filename}</span>
                    <Badge variant="secondary">JSON</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(manifestData.files.manifest.content, 'manifest.json')}
                    >
                      Copiar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(manifestData.files.manifest.content, 'manifest.json')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Caminho: <code className="bg-muted px-2 py-1 rounded">{manifestData.files.manifest.path}</code>
                </p>
              </div>

              {/* Service Worker */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{manifestData.files.service_worker.filename}</span>
                    <Badge variant="secondary">JavaScript</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(manifestData.files.service_worker.content, 'sw.js')}
                    >
                      Copiar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(manifestData.files.service_worker.content, 'sw.js')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Caminho: <code className="bg-muted px-2 py-1 rounded">{manifestData.files.service_worker.path}</code>
                </p>
              </div>
            </div>

            <Separator />

            {/* Instruções */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Instruções de Implementação</h4>
              <div className="bg-muted p-4 rounded-lg space-y-3">
                {Object.entries(manifestData.instructions).map(([key, instruction], index) => (
                  <div key={key} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <p className="text-sm">{instruction}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Aviso importante */}
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> Após implementar os arquivos, o PWA instalado no dispositivo 
                será atualizado automaticamente na próxima vez que o usuário acessar o site. 
                Para forçar a atualização, o usuário pode desinstalar e reinstalar o PWA.
              </AlertDescription>
            </Alert>

            {/* Configuração do GitHub */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground">Configuração do GitHub</h4>
              <div className="space-y-2">
                <Label htmlFor="github-path">Caminho do GitHub</Label>
                <Input
                  id="github-path"
                  placeholder="ex: seu-usuario/seu-repositorio"
                  value={githubPath}
                  onChange={(e) => setGithubPath(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Digite o usuário e repositório no formato: USUARIO/REPOSITORIO
                </p>
              </div>
              <div className="flex justify-center">
                <Button
                  onClick={openGitHubDirectory}
                  variant="outline"
                  disabled={!githubPath}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir GitHub - Pasta public/
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 