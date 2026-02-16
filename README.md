# Full Page Screenshot

Extensão para Google Chrome que captura uma screenshot de página inteira (full page) da aba atual com um clique.

## Funcionalidades

- **Captura de Página Inteira**: Rola automaticamente a página para capturar todo o conteúdo, não apenas a área visível.
- **Tratamento Inteligente de Elementos Fixos**: Oculta cabeçalhos e elementos fixos (`position: fixed/sticky`) após a primeira captura para evitar que apareçam repetidos no meio da imagem final.
- **Suporte a Lazy Load**: Aguarda o carregamento de imagens e conteúdos dinâmicos durante a rolagem.
- **Nomeação Automática**: Salva o arquivo com o título da página e data/hora para fácil organização.
- **Controle de Captura**: Botão de "Stop" para interromper o processo a qualquer momento.
- **Barra de Progresso**: Visualização do andamento da captura.

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

1. Navegue até a página que deseja capturar.
2. Clique no ícone da extensão (câmera azul) na barra de ferramentas do Chrome.
3. Clique no botão **Capture Full Page**.
4. A extensão irá rolar a página automaticamente. Uma barra de progresso mostrará o status.
5. Ao finalizar, a screenshot será processada e baixada automaticamente como arquivo PNG.
6. Se desejar cancelar, clique no botão **Stop Capture**.

## Estrutura do projeto

```
fullpage-screenshot/
├── manifest.json   # Configuração da extensão (Manifest V3)
├── popup.html      # Interface do popup
├── popup.css       # Estilos da interface
├── popup.js        # Lógica principal (controle de captura, stitching, download)
├── content.js      # Script injetado na página (rolagem, ocultar elementos)
├── icons/          # Ícones da extensão
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Permissões e Privacidade

A extensão solicita as seguintes permissões mínimas para funcionar:

- **`activeTab`**:
  - Permite acessar o conteúdo da aba **apenas quando você clica no ícone da extensão**.
  - Necessário para capturar a imagem da tela (`captureVisibleTab`) e comunicar com a página.
  - **Não** concede acesso permanente ao seu histórico de navegação.

- **`scripting`**:
  - Necessário para injetar o script (`content.js`) que realiza a rolagem automática e oculta elementos fixos durante a captura.

**Privacidade**: Esta extensão funciona 100% offline no seu navegador. Nenhuma imagem ou dado de navegação é enviado para servidores externos ou coletado.

## Requisitos

- Google Chrome versão 88 ou superior (suporte a Manifest V3)
