import React from 'react';

interface MobileInputFieldProps {
  value: string;
  onChange: (digits: string, fullFormatted: string) => void;
  error?: string | null;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  autoFocus?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
}

/**
 * Sanitizes incoming text from typing, pasting, or browser/mobile autofill.
 * Strips:
 *  - "+919876543210" -> "9876543210"
 *  - "+91 9876543210" -> "9876543210"
 *  - "+91-9876543210" -> "9876543210"
 *  - "09876543210" -> "9876543210"
 *  - "919876543210" -> "9876543210"
 *  - Keeps only max 10 digits in editable field.
 */
export const sanitizeIndianMobile = (rawInput: string): string => {
  if (!rawInput) return '';
  let str = String(rawInput).trim();

  // If starts with +91, remove +91
  if (str.startsWith('+91')) {
    str = str.slice(3).trim();
  }

  // Remove all non-digits
  let digits = str.replace(/\D/g, '');

  // If starts with 91 and length is 12 (e.g. 919876543210), remove 91
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }

  // If starts with 0 and length > 10 (e.g. 09876543210), strip leading zeros
  if (digits.length > 10 && digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '');
  }

  // Cap to 10 digits max
  return digits.slice(0, 10);
};

export const formatFullMobile = (digits: string): string => {
  const clean = sanitizeIndianMobile(digits);
  return clean ? `+91${clean}` : '';
};

export const formatDisplayMobile = (rawMobile: string | null | undefined): string => {
  if (!rawMobile) return '';
  const clean = sanitizeIndianMobile(rawMobile);
  return clean ? `+91 ${clean}` : rawMobile;
};

export const validateIndianMobile = (digits: string): string | null => {
  const clean = sanitizeIndianMobile(digits);
  if (!clean) {
    return 'Mobile number is required.';
  }
  if (clean.length !== 10) {
    return 'Please enter a valid 10-digit mobile number.';
  }
  if (!/^[6-9]\d{9}$/.test(clean)) {
    return 'Please enter a valid 10-digit Indian mobile number starting with 6-9.';
  }
  return null;
};

export default function MobileInputField({
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
  autoFocus = false,
  placeholder = '10-digit mobile number',
  id,
  name = 'mobile',
}: MobileInputFieldProps) {
  // Ensure displayed value in the editable field is strictly only the 10 digits
  const displayDigits = sanitizeIndianMobile(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = sanitizeIndianMobile(e.target.value);
    const fullFormatted = clean ? `+91${clean}` : '';
    onChange(clean, fullFormatted);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const clean = sanitizeIndianMobile(pastedText);
    const fullFormatted = clean ? `+91${clean}` : '';
    onChange(clean, fullFormatted);
  };

  return (
    <div className={`flex items-center rounded-lg border bg-transparent overflow-hidden transition-all ${
      error
        ? 'border-red-500 ring-1 ring-red-500'
        : 'border-smoke focus-within:ring-1 focus-within:ring-carbon focus-within:border-carbon'
    } ${className}`}>
      {/* Fixed, Non-editable Prefix */}
      <span className="bg-stone/50 text-carbon font-semibold text-[14px] px-[14px] py-[12px] border-r border-smoke select-none shrink-0 flex items-center justify-center">
        +91
      </span>

      {/* Editable 10-digit input */}
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={16} // Allows full autofill string (+91 9876543210) to pass through to onChange
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete="tel-national"
        value={displayDigits}
        onChange={handleChange}
        onPaste={handlePaste}
        className="w-full bg-transparent text-[14px] px-[14px] py-[12px] outline-none text-carbon placeholder:text-graphite/40 font-sans disabled:opacity-60"
      />
    </div>
  );
}
