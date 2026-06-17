# AGENTS.md

## Projeto

Hydro Pump e um app mobile feito com React Native + Expo para registro e acompanhamento de treinos de natacao.

O app permite que alunos registrem treinos, cadastrem piscinas, acompanhem historico, usem ranking e se vinculem a academias, clubes ou professores.

## Tecnologias

- React Native
- Expo
- TypeScript
- AsyncStorage
- Expo Symbols
- Componentes proprios

## Como Rodar

Instalar dependencias:

```bash
npm install
```

Iniciar o projeto:

```bash
npm start
```

Rodar no navegador:

```bash
npm run web
```

Rodar no Expo Go:

```bash
npm start
```

Depois, escanear o QR Code com o app Expo Go.

## Estrutura Principal

- `src/screens`: telas principais do app.
- `src/components`: componentes reutilizaveis, como botoes, inputs e pickers.
- `src/services`: regras de negocio e acesso aos dados locais.
- `src/types`: tipos TypeScript do projeto.
- `src/contexts`: contexto de autenticacao.
- `src/utils`: funcoes auxiliares.

## Servicos Importantes

- `authService.ts`: login, cadastro e usuario atual.
- `academyService.ts`: academias, vinculos e notificacoes.
- `rankingService.ts`: calculo do ranking e perfil publico.
- `seedService.ts`: dados de demonstracao.

## Banco de Dados / Armazenamento

Atualmente o app usa `AsyncStorage`, ou seja, os dados ficam salvos localmente no aparelho ou navegador.

Ainda nao existe backend real ou banco externo.

No futuro, o projeto pode migrar para:

- Firebase
- Supabase
- PostgreSQL com API Node.js
- SQLite local

## Regras de Negocio Importantes

### Treinos

Um treino e um agrupador de exercicios.

Para piscina:

```txt
distancia = chegadas x tamanho da piscina x 2
```

Exemplo:

```txt
10 chegadas x 25m x 2 = 500m
```

Para aguas abertas:

- distancia
- tempo
- local

### Ranking

O ranking considera:

- distancia total
- chegadas totais
- tempo total
- quantidade de treinos
- diversidade de estilos de nado

Filtros existentes:

- semana, mes, ano ou geral
- piscina, aguas abertas ou todas
- estilo de nado
- academia
- localizacao

### Academia

Usuarios podem solicitar vinculo com academia.

Fluxo:

```txt
Aluno solicita vinculo
Academia aprova ou recusa
Se aprovado, aparece no perfil do aluno
```

## Padroes de Codigo

- Usar TypeScript.
- Manter tipos em `src/types/index.ts`.
- Colocar regras de negocio em `src/services`.
- Evitar colocar logica pesada diretamente nas telas.
- Manter textos simples e claros em portugues.
- Seguir o visual atual do app: azul, branco, cards arredondados e navegacao inferior.

## Cuidados Antes de Alterar

Antes de modificar muitos arquivos:

1. Entender a estrutura atual.
2. Verificar se ja existe um service para a regra.
3. Preferir reaproveitar componentes existentes.
4. Rodar verificacao TypeScript depois das mudancas:

```bash
npx tsc --noEmit
```

## Funcionalidades Ja Implementadas

- Cadastro de aluno.
- Cadastro de academia.
- Login.
- Perfil editavel.
- Foto de perfil por URL.
- Cadastro de piscina.
- Criacao de treino.
- Exercicios de piscina e aguas abertas.
- Historico de treinos.
- Vinculo aluno-academia.
- Notificacoes internas.
- Ranking com filtros.
- Perfil publico de usuario.
- Navegacao inferior com icones.

## Proximas Melhorias Sugeridas

- Banco de dados real.
- Upload real de foto.
- Login social.
- Painel completo da academia.
- Gamificacao com conquistas.
- Metas semanais.
- Relatorios de evolucao.
- Melhorias de acessibilidade.
