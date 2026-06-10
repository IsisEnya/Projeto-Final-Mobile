import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';

interface PickerOption {
  label: string;
  value: string;
}

interface PickerProps {
  label: string;
  options: PickerOption[];
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

export const Picker: React.FC<PickerProps> = ({
  label,
  options,
  value,
  onValueChange,
  error,
  placeholder = 'Selecione uma opção',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, error && styles.inputError]}
        onPress={() => setIsOpen(true)}
      >
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {selectedLabel}
        </Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}</Text>
            <TouchableOpacity onPress={() => setIsOpen(false)}>
              <Text style={styles.closeButton}>Fechar</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.option, value === item.value && styles.optionSelected]}
                onPress={() => {
                  onValueChange(item.value);
                  setIsOpen(false);
                }}
              >
                <Text
                  style={[styles.optionText, value === item.value && styles.optionTextSelected]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#243047',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e3f2f8',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 13,
    backgroundColor: '#f8fcff',
  },
  inputError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fef5f5',
  },
  inputText: {
    fontSize: 14,
    color: '#243047',
  },
  placeholderText: {
    color: '#999',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#243047',
  },
  closeButton: {
    fontSize: 14,
    color: '#22a9e7',
    fontWeight: '800',
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionSelected: {
    backgroundColor: '#e9f8ff',
  },
  optionText: {
    fontSize: 14,
    color: '#243047',
  },
  optionTextSelected: {
    color: '#1688c9',
    fontWeight: '800',
  },
});
