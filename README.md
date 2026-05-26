# SwimApp - Sistema de Autenticação com React Native + Expo

Um aplicativo completo de autenticação desenvolvido com React Native e Expo, incluindo cadastro de usuários com informações pessoais, afiliação a academia de natação e seleção de estilos de nado.

## 🎯 Funcionalidades

- ✅ **Sistema de Autenticação**
  - Login com validação de email e senha
  - Cadastro de novo usuário em 3 seções
  - Armazenamento local de dados

- 👤 **Informações Pessoais**
  - Nome, sobrenome e email
  - Data de nascimento com seletor
  - CPF com validação de dígito verificador
  - Telefone com formatação automática

- 📍 **Endereço**
  - Rua, número
  - Cidade, estado e CEP
  - Formatação automática de CEP

- 🏊 **Informações de Natação**
  - Seleção de academia (dropdown com 8 opções)
  - Múltiplos estilos de nado com checkboxes:
    - Nado Livre
    - Costas
    - Peito
    - Borboleta
    - Medley Individual

- 📱 **Tela de Perfil**
  - Visualização de todos os dados cadastrados
  - Logout com confirmação
  - Design responsivo

## 📋 Requisitos

- Node.js (v20 ou superior)
- npm ou yarn
- Expo CLI

## 🚀 Instalação e Uso

### 1. Instalar dependências

```bash
npm install
```

### 2. Iniciar o projeto

```bash
npm start
```

### 3. Abrir em dispositivo/emulador

- **iOS**: Pressione `i`
- **Android**: Pressione `a`
- **Web**: Pressione `w`

## 🔑 Dados de Demonstração

Para testar o login, use:

- **Email**: demo@swimapp.com
- **Senha**: 123456

> Nota: Crie uma nova conta para testar o cadastro completo

## 📁 Estrutura de Pastas

```
src/
├── components/      # Componentes reutilizáveis
│   ├── Button.tsx
│   ├── InputField.tsx
│   ├── Picker.tsx
│   └── CheckboxGroup.tsx
├── contexts/        # React Context para estado global
│   └── AuthContext.tsx
├── screens/         # Telas da aplicação
│   ├── LoginScreen.tsx
│   ├── SignUpScreen.tsx
│   └── HomeScreen.tsx
├── services/        # Serviços de API/lógica
│   └── authService.ts
├── types/           # Tipos TypeScript
│   └── index.ts
├── utils/           # Funções utilitárias
│   └── validators.ts
└── App.tsx          # Componente principal
```

## 🎨 Componentes Principais

### InputField
Campo de entrada reutilizável com suporte a validação, diferentes tipos de teclado e máscara de entrada.

### Button
Botão versátil com variantes (primary, secondary, danger) e suporte a loading.

### Picker
Seletor customizado para escolher um item de uma lista (academias de natação).

### CheckboxGroup
Grupo de checkboxes para seleção múltipla (estilos de nado).

## 🔐 Validações

- ✅ Email válido
- ✅ CPF com validação de dígito verificador
- ✅ Senha com mínimo 6 caracteres
- ✅ Confirmação de senha
- ✅ Todos os campos obrigatórios

## 💾 Armazenamento de Dados

Os dados são armazenados localmente usando `AsyncStorage`:

- Usuários registrados
- Usuário atualmente autenticado

> Nota: Este é um projeto de demonstração. Em produção, use um backend seguro.

## 🛠️ Tecnologias Utilizadas

- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **TypeScript** - Tipagem estática
- **React Context API** - Gerenciamento de estado
- **AsyncStorage** - Armazenamento local
- **React Native DateTimePicker** - Seletor de data

## 📝 Fluxo de Autenticação

### Cadastro (3 seções)

1. **Seção 1**: Informações pessoais (email, senha, nome, CPF, telefone, data de nascimento)
2. **Seção 2**: Endereço (rua, cidade, estado, CEP)
3. **Seção 3**: Natação (academia, estilos de nado)

### Login

1. Insira email e senha
2. Sistema valida as credenciais
3. Acessa a tela de perfil

### Logout

1. Clique em "Sair" na tela de perfil
2. Confirme a ação
3. Retorna à tela de login

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
