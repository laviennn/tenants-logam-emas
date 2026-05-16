export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';

  const isMY = import.meta.env.PUBLIC_TENANT_REGION === 'MY';

  if (isMY) {
    // Format: RM 1,180.00
    return `RM ${num.toLocaleString('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } else {
    // Format: Rp 1.180.000
    return `Rp${num.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }
};
