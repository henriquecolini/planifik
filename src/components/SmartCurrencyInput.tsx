import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { CurrencyInput, CurrencyInputProps } from "react-currency-input-field";

export const SmartCurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>((props, ref) => {
  const internalRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => internalRef.current as HTMLInputElement);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const key = event.key;
    const { selectionStart, selectionEnd } = event.currentTarget;

    // Determine target and alternate based on props
    const targetDecimal = props.decimalSeparator || ".";
    const alternateDecimal = targetDecimal === "." ? "," : ".";

    if (key === alternateDecimal) {
      event.preventDefault();

      const currentValue = event.currentTarget.value;
      const start = selectionStart ?? 0;
      const end = selectionEnd ?? 0;

      // Build the corrected string
      const newValue =
        currentValue.substring(0, start) + targetDecimal + currentValue.substring(end);

      // Access the native HTMLInputElement value setter
      const prototype = window.HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

      if (descriptor?.set) {
        // Manually set the value bypassing React's internal tracker
        descriptor.set.call(event.currentTarget, newValue);

        // Dispatch 'input' event to trigger the library's internal handleOnChange
        const changeEvent = new Event("input", { bubbles: true });
        event.currentTarget.dispatchEvent(changeEvent);

        // Correct cursor position after the library updates
        window.requestAnimationFrame(() => {
          if (internalRef.current) {
            const newPos = start + 1;
            internalRef.current.setSelectionRange(newPos, newPos);
          }
        });
      }
    }

    // Propagate the event to any original onKeyDown listener
    props.onKeyDown?.(event);
  };

  return <CurrencyInput {...props} ref={internalRef} onKeyDown={handleKeyDown} />;
});

SmartCurrencyInput.displayName = "SmartCurrencyInput";
