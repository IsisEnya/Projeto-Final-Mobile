import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CheckboxOption {
  label: string;
  value: string;
}

interface CheckboxGroupProps {
  label: string;
  options: CheckboxOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  error?: string;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  label,
  options,
  selectedValues,
  onSelectionChange,
  error,
}) => {
  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter((v) => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={styles.optionRow}
            onPress={() => handleToggle(option.value)}
          >
            <View
              style={[
                styles.checkbox,
                selectedValues.includes(option.value) && styles.checkboxSelected,
              ]}
            >
              {selectedValues.includes(option.value) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.optionText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
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
    marginBottom: 12,
  },
  optionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e3f2f8',
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#cfeafa',
    borderRadius: 7,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#43c7f4',
    borderColor: '#43c7f4',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  optionText: {
    fontSize: 14,
    color: '#243047',
    flex: 1,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 8,
  },
});
