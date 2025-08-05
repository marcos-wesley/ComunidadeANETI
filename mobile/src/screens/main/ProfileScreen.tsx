import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../services/AuthContext';

const COLORS = {
  primary: '#012d6a',
  secondary: '#25a244',
  white: '#ffffff',
  gray: '#666666',
  lightGray: '#f5f5f5',
  border: '#e1e1e1'
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: user?.fullName || '',
    city: user?.city || '',
    state: user?.state || '',
    area: user?.area || '',
    phone: user?.phone || '',
  });

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout }
      ]
    );
  };

  const handleEditProfile = () => {
    setEditForm({
      fullName: user?.fullName || '',
      city: user?.city || '',
      state: user?.state || '',
      area: user?.area || '',
      phone: user?.phone || '',
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = () => {
    // Aqui faria a chamada para API para atualizar o perfil
    Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    setShowEditModal(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return COLORS.secondary;
      case 'pending': return '#ffc107';
      case 'rejected': return '#dc3545';
      default: return COLORS.gray;
    }
  };

  const getStatusText = (isApproved: boolean) => {
    return isApproved ? 'Aprovado' : 'Pendente';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header do Perfil */}
      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            <Text style={styles.profileInitials}>
              {getInitials(user?.fullName || 'AN')}
            </Text>
          </View>
          <TouchableOpacity style={styles.editImageButton}>
            <MaterialIcons name="camera-alt" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <Text style={styles.profileName}>{user?.fullName}</Text>
        <Text style={styles.profileUsername}>@{user?.username}</Text>
        
        <View style={[
          styles.statusBadge, 
          { backgroundColor: getStatusColor(user?.isApproved ? 'approved' : 'pending') }
        ]}>
          <Text style={styles.statusText}>
            {getStatusText(user?.isApproved || false)}
          </Text>
        </View>
      </View>

      {/* Informações do Perfil */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="person" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          <TouchableOpacity onPress={handleEditProfile}>
            <MaterialIcons name="edit" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <MaterialIcons name="email" size={20} color={COLORS.gray} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="location-city" size={20} color={COLORS.gray} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Localização</Text>
              <Text style={styles.infoValue}>
                {user?.city}, {user?.state}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="work" size={20} color={COLORS.gray} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Área de Atuação</Text>
              <Text style={styles.infoValue}>{user?.area}</Text>
            </View>
          </View>

          {user?.phone && (
            <View style={styles.infoItem}>
              <MaterialIcons name="phone" size={20} color={COLORS.gray} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Telefone</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Estatísticas */}
      {user?.isApproved && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="bar-chart" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Atividade</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Conexões</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Grupos</Text>
            </View>
          </View>
        </View>
      )}

      {/* Configurações */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="settings" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Configurações</Text>
        </View>

        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="notifications" size={20} color={COLORS.gray} />
            <Text style={styles.settingText}>Notificações</Text>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="privacy-tip" size={20} color={COLORS.gray} />
            <Text style={styles.settingText}>Privacidade</Text>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="help" size={20} color={COLORS.gray} />
            <Text style={styles.settingText}>Ajuda e Suporte</Text>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="info" size={20} color={COLORS.gray} />
            <Text style={styles.settingText}>Sobre o App</Text>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Botão de Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialIcons name="logout" size={20} color="#dc3545" />
        <Text style={styles.logoutText}>Sair da Conta</Text>
      </TouchableOpacity>

      {/* Modal de Edição */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.cancelButton}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TouchableOpacity onPress={handleSaveProfile}>
              <Text style={styles.saveButton}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome Completo</Text>
              <TextInput
                style={styles.input}
                value={editForm.fullName}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, fullName: text }))}
                placeholder="Digite seu nome completo"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cidade</Text>
              <TextInput
                style={styles.input}
                value={editForm.city}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, city: text }))}
                placeholder="Digite sua cidade"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Estado</Text>
              <TextInput
                style={styles.input}
                value={editForm.state}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, state: text }))}
                placeholder="Digite seu estado"
                maxLength={2}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Área de Atuação</Text>
              <TextInput
                style={styles.input}
                value={editForm.area}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, area: text }))}
                placeholder="Digite sua área de atuação"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Telefone</Text>
              <TextInput
                style={styles.input}
                value={editForm.phone}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
                placeholder="Digite seu telefone"
                keyboardType="phone-pad"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  profileHeader: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.gray,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 5,
  },
  profileUsername: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: 15,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 10,
    flex: 1,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 15,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 15,
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 5,
  },
  settingsCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingText: {
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 15,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 15,
    marginVertical: 20,
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  logoutText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cancelButton: {
    color: COLORS.gray,
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  saveButton: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.primary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.primary,
    backgroundColor: COLORS.white,
  },
});