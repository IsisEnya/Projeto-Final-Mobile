# SwimApp - Instruções de Desenvolvimento

## Visão Geral do Projeto

SwimApp é um aplicativo de autenticação completo com React Native e Expo que gerencia dados de usuários de natação, incluindo informações pessoais, endereço e preferências de estilos de nado.

## Estrutura do Projeto

### Diretórios Principais

- **src/components**: Componentes UI reutilizáveis (Button, InputField, Picker, CheckboxGroup)
- **src/screens**: Telas da aplicação (Login, SignUp, Home)
- **src/contexts**: Context API para gerenciamento de estado (AuthContext)
- **src/services**: Lógica de autenticação e persistência (authService, seedService)
- **src/types**: Definições de tipos TypeScript
- **src/utils**: Funções utilitárias de validação e formatação

## Stack Técnico

- React Native 0.85.3
- Expo 56.0.4
- TypeScript 6.0.3
- React Context API
- AsyncStorage (armazenamento local)
- React Native DateTimePicker

## Como Executar

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm start
```

Selecione o ambiente (iOS, Android ou Web)

### Testes

Para testar o login:
- Email: `demo@swimapp.com`
- Senha: `123456`

## Fluxo de Autenticação

1. **Splash/Loading**: Verifica usuário autenticado
2. **Login**: Email e senha
3. **SignUp**: 3 etapas (informações pessoais → endereço → natação)
4. **Home**: Visualização do perfil e logout

## Dados do Usuário

O tipo `User` contém:
- Informações pessoais: firstName, lastName, email, CPF, phone, dateOfBirth
- Endereço: address, city, state, postalCode
- Natação: swimmingAcademy, swimmingStyles[]

## Tipos de Nado Suportados

- Freestyle (Nado Livre)
- Backstroke (Costas)
- Breaststroke (Peito)
- Butterfly (Borboleta)
- Individual Medley (Medley Individual)

## Academias Disponíveis

- Academia Natação Olímpica
- Centro de Treinamento Aquático
- Escola de Natação Infantil
- Academia Aqua Plus
- Natação Pro
- Instituto de Natação Brasil
- Academia Splash
- Outra

## Validações Implementadas

- Email (RFC 5322)
- CPF (com dígito verificador)
- Senha (mínimo 6 caracteres)
- Telefone (formatação)
- CEP (formatação)
- Campos obrigatórios

## Armazenamento Local

AsyncStorage é usado para:
- Armazenar lista de usuários registrados
- Manter sessão do usuário autenticado

Chaves:
- `users_data`: Array de usuários
- `current_user`: Usuário atualmente logado

## Guia de Desenvolvimento

### Adicionar Nova Validação

Edite `src/utils/validators.ts` com novas funções de validação.

### Adicionar Novo Campo de Usuário

1. Atualize o tipo `User` em `src/types/index.ts`
2. Adicione o campo ao `SignUpData`
3. Crie input na tela apropriada
4. Atualize a validação

### Adicionar Novo Estilo de Nado

Atualize `SWIMMING_STYLES` em `src/types/index.ts`:

```typescript
{ value: 'novo-estilo', label: 'Novo Estilo' }
```

## Próximas Melhorias Sugeridas

- Integração com backend (Firebase, Supabase)
- Autenticação por rede social
- Edição de perfil
- Recuperação de senha
- Upload de foto de perfil
- Validação de CPF única

## Troubleshooting

### AsyncStorage não funciona

Certifique-se de que `@react-native-async-storage/async-storage` está instalado:

```bash
npm install @react-native-async-storage/async-storage
```

### DateTimePicker não aparece

Instale o pacote correto:

```bash
npm install @react-native-community/datetimepicker
```

### Erro de TypeScript

Verifique `tsconfig.json` e certifique-se de que todos os arquivos estão em `src/`.

## Recursos Úteis

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [React Context API](https://react.dev/reference/react/useContext)
