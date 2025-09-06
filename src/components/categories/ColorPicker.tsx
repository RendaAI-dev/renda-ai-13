
import React from 'react';

interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

const colors = [
  '#F44336', // Red
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#673AB7', // Deep Purple
  '#3F51B5', // Indigo
  '#2196F3', // Blue
  '#03A9F4', // Light Blue
  '#00BCD4', // Cyan
  '#009688', // Teal
  '#4CAF50', // Green
  '#8BC34A', // Light Green
  '#CDDC39', // Lime
  '#FFEB3B', // Yellow
  '#FFC107', // Amber
  '#FF9800', // Orange
  '#FF5722', // Deep Orange
  '#795548', // Brown
  '#607D8B', // Blue Grey
];

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onSelectColor }) => {
  return (
    <div className="grid grid-cols-6 gap-2 py-2">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onSelectColor(color)}
          className="w-8 h-8 rounded-full relative flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          {selectedColor === color && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="h-2.5 w-2.5 bg-white rounded-full"></span>
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default ColorPicker;
