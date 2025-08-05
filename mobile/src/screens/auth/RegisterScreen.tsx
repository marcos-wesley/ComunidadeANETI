import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#012d6a',
  secondary: '#25a244',
  white: '#ffffff',
  gray: '#666666',
  lightGray: '#f5f5f5',
  error: '#dc3545'
};

export default function RegisterScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    city: '',
    state: '',
    area: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Erro', 'Nome completo é obrigatório');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Erro', 'Email é obrigatório');
      return false;
    }
    if (!formData.username.trim()) {
      Alert.alert('Erro', 'Nome de usuário é obrigatório');
      return false;
    }
    if (!formData.password.trim()) {
      Alert.alert('Erro', 'Senha é obrigatória');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Erro', 'Senhas não coincidem');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Erro', 'Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Como a aplicação web utiliza um processo de cadastro com aprovação,
      // aqui faremos a requisição para o endpoint de registro existente
      Alert.alert(
        'Funcionalidade em Desenvolvimento',
        'O cadastro via mobile será implementado na próxima versão. Por enquanto, use a versão web para se cadastrar.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Erro', 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Criar Conta ANETI</Text>
          <Text style={styles.subtitle}>
            Junte-se à maior comunidade de profissionais de TI do Brasil
          </Text>

          {/* Nome Completo */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={20} color={COLORS.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              value={formData.fullName}
              onChangeText={(value) => handleInputChange('fullName', value)}
              autoCapitalize="words"
            />
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color={COLORS.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Username */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="alternate-email" size={20} color={COLORS.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nome de usuário"
              value={formData.username}
              onChangeText={(value) => handleInputChange('username', value)}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Cidade */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="location-city" size={20} color={COLORS.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Cidade"
              value={formData.city}
              onChangeText={(value) => handleInputChange('city', value)}
              autoCapitalize="words"
            />
          </View>

          {/* Estado */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="map" size={20} color={COLORS.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Estado"
              value={formData.state}
              onChangeText={(value) => handleInputChange('state', value)}
              autoCapitalize="characters"
              maxLength={2}
            />
          </View>

          {/* Área de Atuação */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="work" size={20} color={COLORS.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Área de atuação"
              value={formData.area}
              onChangeText={(value) => handleInputChange('area', value)}
              autoCapitalize="words"
            />
          </View>

          {/* Senha */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color={COLORS.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <MaterialIcons 
                name={showPassword ? 'visibility-off' : 'visibility'} 
                size={20} 
                color={COLORS.gray} 
              />
            </TouchableOpacity>
          </View>

          {/* Confirmar Senha */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color={COLORS.gray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirmar senha"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity 
            style={[styles.registerButton, isLoading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.registerButtonText}>
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            Ao se cadastrar, você concorda com nossos Termos de Uso e Política de Privacidade
          </Text>
        </View>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Já tem conta? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.loginLink}>Faça login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: COLORS.white,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: COLORS.primary,
  },
  eyeIcon: {
    padding: 5,
  },
  registerButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  disabledButton: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 18,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: COLORS.white,
    fontSize: 16,
  },
  loginLink: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});