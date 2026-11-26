import React from 'react';
import { CppLogo, PythonLogo } from '../ui/BrandLogos';

/** A sheet's mark: the official C++ and Python logos, otherwise its short label */
export default function SheetIcon({ sheet, size = 22 }) {
  if (!sheet) return null;
  if (sheet.id === 'cpp-beginners') return <CppLogo size={size} />;
  if (sheet.id === 'python-dsa') return <PythonLogo size={size} />;
  if (React.isValidElement(sheet.icon)) return sheet.icon;
  return <span className="font-mono font-medium text-brand-600 dark:text-brand-400 text-xs">{sheet.icon}</span>;
}
