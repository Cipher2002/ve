import { useState } from "react";
import { INITIAL_ROWS, MAX_ROWS } from "../constants";

/**
 * A custom React hook that manages the number of visible rows in a component.
 * The number of rows is bounded between INITIAL_ROWS and MAX_ROWS.
 *
 * @returns {Object} An object containing:
 *   - visibleRows: The current number of visible rows
 *   - getVisibleRows: Function to get the current visible rows count
 *   - setVisibleRows: Function to directly set the visible rows count
 *   - addRow: Function to increment visible rows (up to MAX_ROWS)
 *   - removeRow: Function to decrement visible rows (down to INITIAL_ROWS)
 */
// export const useVisibleRows = (onAddRow?: () => void, onRemoveRow?: () => void) => {
//   const [visibleRows, setVisibleRows] = useState(INITIAL_ROWS);

//   /**
//    * Increments the number of visible rows by 1, up to MAX_ROWS
//    * Also triggers callback to shift overlays down
//    */
//   const addRow = () => {
//     setVisibleRows((current) => {
//       const newCount = Math.min(current + 1, MAX_ROWS);
//       // Only trigger callback if we're actually adding a row
//       if (newCount > current && onAddRow) {
//         onAddRow();
//       }
//       return newCount;
//     });
//   };
export const useVisibleRows = (onAddRow?: () => void, onRemoveRow?: () => void) => {
  const [visibleRows, setVisibleRows] = useState(INITIAL_ROWS);

  /**
   * Increments the number of visible rows by 1, up to MAX_ROWS
   * Calls onAddRow callback when a row is actually added (to shift overlays)
   */
  const addRow = () => {
    setVisibleRows((current) => {
      const newCount = Math.min(current + 1, MAX_ROWS);
      // Only trigger callback if we're actually adding a row
      if (newCount > current && onAddRow) {
        onAddRow();
      }
      return newCount;
    });
  };

  /**
   * Decrements the number of visible rows by 1, down to INITIAL_ROWS
   * Calls onRemoveRow callback when a row is actually removed
   */
  const removeRow = () => {
    setVisibleRows((current) => {
      const newCount = Math.max(current - 1, INITIAL_ROWS);
      // Only trigger callback if we're actually removing a row
      if (newCount < current && onRemoveRow) {
        onRemoveRow();
      }
      return newCount;
    });
  };

  return {
    visibleRows,
    getVisibleRows: () => visibleRows,
    setVisibleRows,
    addRow,
    removeRow,
  };
};
