import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { CheckboxGroup } from '../components/CheckboxGroup';
import { InputField } from '../components/InputField';
import { Picker } from '../components/Picker';
import { useAuth } from '../contexts/AuthContext';
import {
  AccountType,
  SignUpData,
  SWIMMING_MODALITIES,
  SwimmingModality,
  TRAINING_PLACE_OPTIONS,
} from '../types';

export interface SignUpScreenProps {
  onNavigateToLogin: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onNavigateToLogin }) => {
  const { signUp, loading, error, clearError } = useAuth();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    accountType: 'student' as AccountType,
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    trainingPlace: '',
    primaryModality: '' as SwimmingModality | '',
    modalities: [] as SwimmingModality[],
    academyName: '',
    city: '',
    state: '',
    address: '',
    site: '',
    instagram: '',
  });

  useEffect(() => {
    if (error) {
      Alert.alert('Erro ao cadastrar', error);
      clearError();
    }
  }, [error, clearError]);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: '' });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email) errors.email = 'Email é obrigatório';
    if (!formData.password) errors.password = 'Senha é obrigatória';
    if (!formData.confirmPassword) errors.confirmPassword = 'Confirmação de senha é obrigatória';
    if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = 'Senhas não conferem';

    if (formData.accountType === 'student') {
      if (!formData.firstName) errors.firstName = 'Nome é obrigatório';
      if (!formData.lastName) errors.lastName = 'Sobrenome é obrigatório';
      if (!formData.trainingPlace) errors.trainingPlace = 'Informe onde você treina';
      if (!formData.primaryModality) errors.primaryModality = 'Selecione a modalidade principal';
      if (formData.modalities.length === 0)
        errors.modalities = 'Selecione pelo menos uma modalidade';
    } else {
      if (!formData.academyName) errors.academyName = 'Nome da academia é obrigatório';
      if (!formData.city) errors.city = 'Cidade é obrigatória';
      if (!formData.state) errors.state = 'Estado é obrigatório';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      const signUpData: SignUpData = {
        accountType: formData.accountType,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        trainingPlace: formData.trainingPlace,
        primaryModality: formData.primaryModality || undefined,
        modalities: formData.modalities,
        academyName: formData.academyName,
        city: formData.city,
        state: formData.state,
        address: formData.address,
        site: formData.site,
        instagram: formData.instagram,
      };
      await signUp(signUpData);
    } catch (err) {
      // Error is handled by useEffect
    }
  };

  const trainingPlaceOptions = TRAINING_PLACE_OPTIONS.map((option) => ({
    label: option,
    value: option,
  }));

  const modalityOptions = SWIMMING_MODALITIES.map((modality) => ({
    label: modality.label,
    value: modality.value,
  }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>H</Text>
          </View>
          <Text style={styles.title}>Criar conta Hydro Pump</Text>
          <Text style={styles.subtitle}>Escolha como você quer entrar no app.</Text>
        </View>

        <View style={styles.typeSwitch}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              formData.accountType === 'student' && styles.typeButtonActive,
            ]}
            onPress={() => handleInputChange('accountType', 'student')}
          >
            <Text
              style={[
                styles.typeButtonText,
                formData.accountType === 'student' && styles.typeButtonTextActive,
              ]}
            >
              Aluno
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              formData.accountType === 'academy' && styles.typeButtonActive,
            ]}
            onPress={() => handleInputChange('accountType', 'academy')}
          >
            <Text
              style={[
                styles.typeButtonText,
                formData.accountType === 'academy' && styles.typeButtonTextActive,
              ]}
            >
              Academia
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>
            {formData.accountType === 'student' ? 'Cadastro de aluno' : 'Cadastro de academia'}
          </Text>

          {formData.accountType === 'student' ? (
            <>
              <InputField
                label="Nome"
                placeholder="Seu nome"
                value={formData.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
                error={validationErrors.firstName}
              />

              <InputField
                label="Sobrenome"
                placeholder="Seu sobrenome"
                value={formData.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
                error={validationErrors.lastName}
              />
            </>
          ) : (
            <>
              <InputField
                label="Nome da academia"
                placeholder="Ex: Hydro Center"
                value={formData.academyName}
                onChangeText={(value) => handleInputChange('academyName', value)}
                error={validationErrors.academyName}
              />

              <InputField
                label="Cidade"
                placeholder="São Paulo"
                value={formData.city}
                onChangeText={(value) => handleInputChange('city', value)}
                error={validationErrors.city}
              />

              <InputField
                label="Estado"
                placeholder="SP"
                value={formData.state}
                onChangeText={(value) => handleInputChange('state', value.toUpperCase())}
                maxLength={2}
                error={validationErrors.state}
              />

              <InputField
                label="Endereço"
                placeholder="Opcional"
                value={formData.address}
                onChangeText={(value) => handleInputChange('address', value)}
              />
            </>
          )}

          <InputField
            label="Email"
            placeholder="seu@email.com"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            error={validationErrors.email}
          />

          <InputField
            label="Senha"
            placeholder="Mínimo 6 caracteres"
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            secureTextEntry
            error={validationErrors.password}
          />

          <InputField
            label="Confirmar senha"
            placeholder="Repita sua senha"
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            secureTextEntry
            error={validationErrors.confirmPassword}
          />

          {formData.accountType === 'student' ? (
            <>
              <Picker
                label="Onde você treina"
                options={trainingPlaceOptions}
                value={formData.trainingPlace}
                onValueChange={(value) => handleInputChange('trainingPlace', value)}
                error={validationErrors.trainingPlace}
              />

              <Picker
                label="Modalidade principal"
                options={modalityOptions}
                value={formData.primaryModality}
                onValueChange={(value) => handleInputChange('primaryModality', value)}
                error={validationErrors.primaryModality}
              />

              <CheckboxGroup
                label="Modalidades que você pratica"
                options={modalityOptions}
                selectedValues={formData.modalities}
                onSelectionChange={(values) =>
                  setFormData({ ...formData, modalities: values as SwimmingModality[] })
                }
                error={validationErrors.modalities}
              />
            </>
          ) : (
            <>
              <InputField
                label="Site"
                placeholder="Opcional"
                value={formData.site}
                onChangeText={(value) => handleInputChange('site', value)}
              />

              <InputField
                label="Instagram"
                placeholder="@suaacademia"
                value={formData.instagram}
                onChangeText={(value) => handleInputChange('instagram', value)}
              />
            </>
          )}

          <Button
            title={loading ? 'Cadastrando...' : 'Criar conta'}
            onPress={handleSignUp}
            loading={loading}
            disabled={loading}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Já tem uma conta?</Text>
          <Button title="Entrar" onPress={onNavigateToLogin} variant="secondary" size="small" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fbfe',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandMark: {
    width: 54,
    height: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f8ff',
    marginBottom: 12,
    shadowColor: '#72cdeb',
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 5,
  },
  brandMarkText: {
    color: '#35bdf2',
    fontSize: 30,
    fontWeight: '900',
  },
  title: {
    fontSize: 25,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    maxWidth: 280,
    textAlign: 'center',
    fontSize: 14,
    color: '#7b91a5',
    fontWeight: '700',
    lineHeight: 20,
  },
  typeSwitch: {
    flexDirection: 'row',
    backgroundColor: '#eaf8ff',
    padding: 6,
    borderRadius: 18,
    marginBottom: 18,
  },
  typeButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#43c7f4',
  },
  typeButtonText: {
    color: '#617b91',
    fontSize: 14,
    fontWeight: '900',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 26,
    padding: 22,
    shadowColor: '#7dbce0',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 26,
    elevation: 7,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    color: '#7b91a5',
    fontWeight: '700',
  },
});
