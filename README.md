# Full Page Screenshot

Extensão para Google Chrome que captura uma screenshot da aba atual com um clique.

## Funcionalidades

- Captura a área visível da aba atual
- Salva a imagem automaticamente como PNG
- Interface simples e direta
- Permissões mínimas (apenas `activeTab`)

## Como instalar

1. Faça o download ou clone este repositório:
   ```bash
   git clone https://github.com/seu-usuario/fullpage-screenshot.git
   ```

2. Abra o Google Chrome e acesse `chrome://extensions/`

3. Ative o **Modo do desenvolvedor** no canto superior direito

4. Clique em **Carregar sem compactação**

5. Selecione a pasta do projeto (`fullpage-screenshot`)

6. A extensão aparecerá na barra de extensões do Chrome

## Como usar

1. Navegue até a página que deseja capturar
2. Clique no ícone da extensão na barra de ferramentas do Chrome
3. Clique no botão **Capture Current Tab**
4. A screenshot será baixada automaticamente como arquivo PNG

## Estrutura do projeto

```
fullpage-screenshot/
├── manifest.json   # Configuração da extensão (Manifest V3)
├── popup.html      # Interface do popup
├── popup.js        # Lógica de captura da screenshot
├── icons/          # Ícones da extensão
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Permissões

A extensão utiliza apenas a permissão `activeTab`, que concede acesso temporário à aba ativa somente quando o usuário clica no ícone da extensão. Nenhum dado é coletado ou enviado para servidores externos.

## Requisitos

- Google Chrome versão 88 ou superior (suporte a Manifest V3)
