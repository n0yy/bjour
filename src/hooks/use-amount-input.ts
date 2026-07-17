import { useState } from 'react';

export function useAmountInput(initial = 0) {
  const [amount, setAmount] = useState(initial);

  function pressKey(key: string) {
    if (key === '⌫') {
      setAmount((prev) => Math.floor(prev / 10));
      return;
    }
    const digits = key === '000' ? 3 : 1;
    setAmount((prev) => {
      const next = prev * 10 ** digits + Number(key);
      return next > Number.MAX_SAFE_INTEGER ? prev : next;
    });
  }

  return { amount, setAmount, pressKey };
}
