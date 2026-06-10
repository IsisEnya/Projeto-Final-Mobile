# Hydro Pump

Hydro Pump e um aplicativo mobile feito com React Native e Expo para registrar treinos de natacao. A ideia e funcionar como um app de academia, mas focado em nadadores, academias, clubes e professores.

O projeto ainda esta em fase de MVP. A base principal ja permite cadastro, login, registro de treinos, cadastro de piscinas, historico e ranking simples.

## Funcionalidades

- Cadastro como aluno ou academia
- Login com conta local
- Perfil editavel
- Cadastro de piscinas
- Registro de treino com varios exercicios
- Exercicios em piscina ou aguas abertas
- Calculo automatico de distancia em piscina
- Historico de treinos
- Ranking semanal por distancia
- Navegacao inferior com abas

## Como funciona o treino

Um treino e um agrupador com nome, data, tempo total e exercicios.

Em exercicios de piscina, o app calcula a distancia usando:

```text
distancia = chegadas x tamanho da piscina x 2
```

Isso acontece porque, neste projeto, uma chegada representa ida e volta na piscina.

Exemplo:

```text
10 chegadas x piscina de 25m x 2 = 500m
```

## Tecnologias

- React Native
- Expo
- TypeScript
- AsyncStorage

## Requisitos

- Node.js instalado
- npm instalado
- Expo Go no celular, caso queira testar no dispositivo fisico

## Como rodar

Instale as dependencias:

```bash
npm install
```

Inicie o projeto:

```bash
npm run start
```

Se precisar limpar o cache do Expo:

```bash
npm run start -- --clear
```

Depois que o Expo abrir:

- Pressione `w` para abrir no navegador
- Escaneie o QR Code com o Expo Go para abrir no celular
- Pressione `a` para Android/emulador, se estiver configurado
- Pressione `i` para iOS/simulador, se estiver em macOS

## Contas demo

Aluno:

```text
Email: demo@hydropump.com
Senha: 123456
```

Academia:

```text
Email: academia@hydropump.com
Senha: 123456
```

## Estrutura basica

```text
src/
  components/   Componentes reutilizaveis
  contexts/     Contexto de autenticacao
  screens/      Telas principais
  services/     Servicos e persistencia local
  types/        Tipos TypeScript
  utils/        Funcoes utilitarias
```

## Observacao

Este projeto usa armazenamento local com AsyncStorage. Para uma versao de producao, o ideal e integrar com um backend real para autenticacao, usuarios, academias, vinculo entre aluno e academia, treinos e ranking.
