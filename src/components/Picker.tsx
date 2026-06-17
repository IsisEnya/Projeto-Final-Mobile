import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
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
        <Text style={[styles.inputText, !value && styles.placeholderText]}>{selectedLabel}</Text>
        <Text style={styles.chevron}>v</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={() => setIsOpen(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>Selecionar</Text>
                <Text style={styles.modalTitle}>{label}</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setIsOpen(false)}>
                <Text style={styles.closeButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              contentContainerStyle={styles.optionList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, value === item.value && styles.optionSelected]}
                  onPress={() => {
                    onValueChange(item.value);
                    setIsOpen(false);
                  }}
                >
                  <View style={[styles.optionRadio, value === item.value && styles.optionRadioSelected]}>
                    {value === item.value && <View style={styles.optionRadioDot} />}
                  </View>
                  <Text style={[styles.optionText, value === item.value && styles.optionTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flex: 1,
    fontSize: 14,
    color: '#243047',
    fontWeight: '800',
    paddingRight: 10,
  },
  chevron: {
    color: '#1688c9',
    fontSize: 13,
    fontWeight: '900',
  },
  placeholderText: {
    color: '#999',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 24, 39, 0.34)',
  },
  backdropTouch: {
    flex: 1,
  },
  modalCard: {
    maxHeight: '76%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
    shadowColor: '#102a43',
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: -10 },
    shadowRadius: 24,
    elevation: 16,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 46,
    height: 5,
    borderRadius: 99,
    backgroundColor: '#d7effa',
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eef6fa',
  },
  modalEyebrow: {
    color: '#7b91a5',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#111827',
  },
  closeButton: {
    borderRadius: 14,
    backgroundColor: '#eaf8ff',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  closeButtonText: {
    fontSize: 12,
    color: '#1688c9',
    fontWeight: '900',
  },
  optionList: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#e3f2f8',
    backgroundColor: '#f8fcff',
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 13,
    marginBottom: 9,
  },
  optionSelected: {
    backgroundColor: '#eaf8ff',
    borderColor: '#7fd8f5',
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#b9d8e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioSelected: {
    borderColor: '#35bdf2',
  },
  optionRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#35bdf2',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#243047',
    fontWeight: '800',
  },
  optionTextSelected: {
    color: '#1688c9',
    fontWeight: '800',
  },
});
