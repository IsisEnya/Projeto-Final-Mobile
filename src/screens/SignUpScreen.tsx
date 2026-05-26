import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { Picker } from '../components/Picker';
import { CheckboxGroup } from '../components/CheckboxGroup';
import { SignUpData, SWIMMING_ACADEMIES, SWIMMING_STYLES, SwimmingStyle } from '../types';
import {
  formatCPF,
  formatPhone,
  formatPostalCode,
  formatDate,
} from '../utils/validators';

export interface SignUpScreenProps {
  onNavigateToLogin: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onNavigateToLogin }) => {
  const { signUp, loading, error, clearError } = useAuth();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [currentSection, setCurrentSection] = useState(1); // 1: Personal, 2: Address, 3: Swimming

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    cpf: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    swimmingAcademy: '',
    swimmingStyles: [] as SwimmingStyle[],
  });

  useEffect(() => {
    if (error) {
      Alert.alert('Erro ao Cadastrar', error);
      clearError();
    }
  }, [error, clearError]);

  const handleDateChange = (event: any, selectedDate: any) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFormData({ ...formData, dateOfBirth: dateString });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: '' });
    }
  };

  const validateSection = (section: number): boolean => {
    const errors: Record<string, string> = {};

    if (section === 1) {
      if (!formData.email) errors.email = 'Email é obrigatório';
      if (!formData.password) errors.password = 'Senha é obrigatória';
      if (!formData.confirmPassword) errors.confirmPassword = 'Confirmação de senha é obrigatória';
      if (formData.password !== formData.confirmPassword)
        errors.confirmPassword = 'Senhas não conferem';
      if (!formData.firstName) errors.firstName = 'Nome é obrigatório';
      if (!formData.lastName) errors.lastName = 'Sobrenome é obrigatório';
      if (!formData.dateOfBirth) errors.dateOfBirth = 'Data de nascimento é obrigatória';
      if (!formData.cpf) errors.cpf = 'CPF é obrigatório';
      if (!formData.phone) errors.phone = 'Telefone é obrigatório';
    } else if (section === 2) {
      if (!formData.address) errors.address = 'Endereço é obrigatório';
      if (!formData.city) errors.city = 'Cidade é obrigatória';
      if (!formData.state) errors.state = 'Estado é obrigatório';
      if (!formData.postalCode) errors.postalCode = 'CEP é obrigatório';
    } else if (section === 3) {
      if (!formData.swimmingAcademy) errors.swimmingAcademy = 'Academia é obrigatória';
      if (formData.swimmingStyles.length === 0)
        errors.swimmingStyles = 'Selecione pelo menos um estilo de nado';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextSection = () => {
    if (validateSection(currentSection)) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePreviousSection = () => {
    setCurrentSection(currentSection - 1);
  };

  const handleSignUp = async () => {
    if (!validateSection(3)) return;

    try {
      const signUpData: SignUpData = {
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        cpf: formData.cpf,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        swimmingAcademy: formData.swimmingAcademy,
        swimmingStyles: formData.swimmingStyles,
      };
      await signUp(signUpData);
    } catch (err) {
      // Error is handled by useEffect
    }
  };

  const academyOptions = SWIMMING_ACADEMIES.map((academy) => ({
    label: academy,
    value: academy,
  }));

  const swimmingStylesOptions = SWIMMING_STYLES.map((style) => ({
    label: style.label,
    value: style.value,
  }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>🏊 Criar Conta</Text>
          <Text style={styles.subtitle}>Seção {currentSection} de 3</Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentSection / 3) * 100}%` }]} />
        </View>

        <View style={styles.form}>
          {currentSection === 1 && (
            <>
              <Text style={styles.sectionTitle}>Informações Pessoais</Text>

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
                label="Confirmar Senha"
                placeholder="Repita sua senha"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry
                error={validationErrors.confirmPassword}
              />

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

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Data de Nascimento</Text>
                <TouchableOpacity
                  style={[styles.dateButton, validationErrors.dateOfBirth && styles.dateButtonError]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {formData.dateOfBirth
                      ? formatDate(formData.dateOfBirth)
                      : 'Selecionar data'}
                  </Text>
                </TouchableOpacity>
                {validationErrors.dateOfBirth && (
                  <Text style={styles.errorText}>{validationErrors.dateOfBirth}</Text>
                )}
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}

              <InputField
                label="CPF"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChangeText={(value) =>
                  handleInputChange('cpf', formatCPF(value).substring(0, 14))
                }
                keyboardType="numeric"
                maxLength={14}
                error={validationErrors.cpf}
              />

              <InputField
                label="Telefone"
                placeholder="(00) 9 0000-0000"
                value={formData.phone}
                onChangeText={(value) =>
                  handleInputChange('phone', formatPhone(value).substring(0, 15))
                }
                keyboardType="phone-pad"
                error={validationErrors.phone}
              />

              <Button
                title="Próximo"
                onPress={handleNextSection}
                disabled={loading}
              />
            </>
          )}

          {currentSection === 2 && (
            <>
              <Text style={styles.sectionTitle}>Endereço</Text>

              <InputField
                label="Endereço"
                placeholder="Rua, número"
                value={formData.address}
                onChangeText={(value) => handleInputChange('address', value)}
                error={validationErrors.address}
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
                label="CEP"
                placeholder="00000-000"
                value={formData.postalCode}
                onChangeText={(value) =>
                  handleInputChange('postalCode', formatPostalCode(value).substring(0, 9))
                }
                keyboardType="numeric"
                error={validationErrors.postalCode}
              />

              <View style={styles.buttonGroup}>
                <Button
                  title="Voltar"
                  onPress={handlePreviousSection}
                  variant="secondary"
                />
                <Button
                  title="Próximo"
                  onPress={handleNextSection}
                  disabled={loading}
                />
              </View>
            </>
          )}

          {currentSection === 3 && (
            <>
              <Text style={styles.sectionTitle}>Natação</Text>

              <Picker
                label="Academia de Natação"
                options={academyOptions}
                value={formData.swimmingAcademy}
                onValueChange={(value) => handleInputChange('swimmingAcademy', value)}
                error={validationErrors.swimmingAcademy}
              />

              <CheckboxGroup
                label="Estilos de Nado"
                options={swimmingStylesOptions}
                selectedValues={formData.swimmingStyles}
                onSelectionChange={(values) =>
                  setFormData({ ...formData, swimmingStyles: values as SwimmingStyle[] })
                }
                error={validationErrors.swimmingStyles}
              />

              <View style={styles.buttonGroup}>
                <Button
                  title="Voltar"
                  onPress={handlePreviousSection}
                  variant="secondary"
                />
                <Button
                  title={loading ? 'Cadastrando...' : 'Cadastrar'}
                  onPress={handleSignUp}
                  loading={loading}
                  disabled={loading}
                />
              </View>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Já tem uma conta?</Text>
          <Button
            title="Entrar"
            onPress={onNavigateToLogin}
            variant="secondary"
            size="small"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef6ff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f4d91',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#536983',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#dbe7ff',
    borderRadius: 999,
    marginBottom: 22,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0f4d91',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f3f74',
    marginBottom: 18,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#273a5a',
    marginBottom: 10,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#d1dbe8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#f9fbff',
  },
  dateButtonError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fff0f0',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#24365c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    color: '#536983',
  },
});
