# Netflix Subtitle Extractor

Uma extensão para Chrome que extrai legendas em tempo real enquanto você assiste filmes e séries na Netflix.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![React](https://img.shields.io/badge/React-18-blue)

## 🎬 Funcionalidades

- **Captura em tempo real**: Extrai legendas enquanto você assiste ao conteúdo
- **Múltiplos formatos de exportação**: SRT, VTT e TXT
- **Histórico de sessões**: Salva automaticamente as legendas capturadas
- **Interface intuitiva**: Design inspirado na Netflix
- **Detecção automática**: Identifica título, temporada e episódio

## 📋 Requisitos

- Google Chrome (ou navegador baseado em Chromium)
- Node.js 18+
- pnpm, yarn ou npm

## 🚀 Instalação

### Desenvolvimento

1. Clone ou acesse a pasta do projeto:
```bash
cd /Users/everton/personal/extensions/netflix-subtitle-extractor
```

2. Instale as dependências:
```bash
pnpm install
# ou
yarn install
# ou
npm install
```

3. Execute o build de desenvolvimento:
```bash
pnpm dev
# ou
yarn dev
```

4. Carregue a extensão no Chrome:
   - Acesse `chrome://extensions/`
   - Ative o "Modo do desenvolvedor" (canto superior direito)
   - Clique em "Carregar sem compactação"
   - Selecione a pasta `dist` do projeto

### Produção

```bash
pnpm build
# ou
yarn build
```

A pasta `dist` conterá a extensão pronta para publicação.

## 📖 Como Usar

1. **Abra a Netflix** no seu navegador
2. **Inicie um filme ou série**
3. **Ative as legendas** no idioma desejado (usando os controles do player da Netflix)
4. **Clique no ícone da extensão** na barra de ferramentas do Chrome
5. **Clique em "Iniciar Captura"**
6. **Assista ao conteúdo** - as legendas serão capturadas automaticamente
7. **Clique em "Parar e Salvar"** quando terminar
8. **Baixe as legendas** no formato desejado (SRT, VTT ou TXT)

## 📁 Estrutura do Projeto

```
netflix-subtitle-extractor/
├── manifest.json           # Configuração da extensão Chrome
├── package.json            # Dependências e scripts
├── vite.config.ts          # Configuração do Vite
├── tailwind.config.js      # Configuração do Tailwind CSS
├── tsconfig.json           # Configuração do TypeScript
├── public/
│   └── icons/              # Ícones da extensão
└── src/
    ├── background/
    │   └── index.ts        # Service Worker (gerencia estado e downloads)
    ├── content/
    │   ├── index.ts        # Content Script (extrai legendas)
    │   └── styles.css      # Estilos injetados na Netflix
    ├── popup/
    │   ├── index.html      # HTML do popup
    │   ├── main.tsx        # Entry point React
    │   ├── App.tsx         # Componente principal
    │   └── styles.css      # Estilos do popup
    └── utils/
        ├── types.ts        # Definições de tipos TypeScript
        ├── formatters.ts   # Funções de formatação (SRT, VTT)
        └── storage.ts      # Gerenciamento de storage
```

## 🔧 Tecnologias

- **React 18** - Interface do popup
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **CRXJS** - Plugin Vite para extensões Chrome
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **Chrome Extension Manifest V3** - API de extensões

## 📝 Formatos de Legenda

### SRT (SubRip)
```
1
00:00:01,000 --> 00:00:04,000
Esta é a primeira legenda.

2
00:00:05,000 --> 00:00:08,000
Esta é a segunda legenda.
```

### VTT (WebVTT)
```
WEBVTT

00:00:01.000 --> 00:00:04.000
Esta é a primeira legenda.

00:00:05.000 --> 00:00:08.000
Esta é a segunda legenda.
```

### TXT (Texto simples)
```
Esta é a primeira legenda.
Esta é a segunda legenda.
```

## ⚠️ Avisos Importantes

- **Termos de Serviço**: O uso desta extensão pode violar os Termos de Serviço da Netflix. Use por sua conta e risco.
- **Direitos Autorais**: As legendas são protegidas por direitos autorais. Use apenas para fins pessoais e educacionais.
- **Atualizações da Netflix**: A Netflix pode alterar a estrutura do seu player, o que pode quebrar a funcionalidade da extensão.

## 🐛 Solução de Problemas

### As legendas não estão sendo capturadas
1. Verifique se as legendas estão ativas no player da Netflix
2. Recarregue a página da Netflix
3. Tente desinstalar e reinstalar a extensão

### A extensão não detecta a Netflix
1. Certifique-se de estar em uma URL válida da Netflix (https://www.netflix.com/watch/...)
2. Verifique se a extensão está ativada em `chrome://extensions/`

### Erros de build
```bash
# Limpe o cache e reinstale as dependências
rm -rf node_modules dist
pnpm install
pnpm build
```

## 📜 Licença

Este projeto é apenas para fins educacionais. Não distribua legendas extraídas.

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request.

---

**Nota**: Esta extensão é um projeto independente e não é afiliada à Netflix.
# netflix-subtitle-extractor-chrome-extension
