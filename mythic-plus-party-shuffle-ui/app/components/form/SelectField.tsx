import React from 'react';
import CustomSelect from './CustomSelect';

interface SelectFieldProps {
  label: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder,
}) => {
  const handleChange = (selectedOption: { value: string; label: string } | null) => {
    if (selectedOption) {
      onChange(selectedOption.value);
    } else {
      onChange('');
    }
  };

  return (
    <div className="input-box">
      <label>{label}</label>
      <CustomSelect
        options={options}
        value={options.find((option) => option.value === value) || null}
        placeholder={placeholder || 'Select an option'}
        onChange={handleChange}
      />
    </div>
  );
};

export default SelectField;
