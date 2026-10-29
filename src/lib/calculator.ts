export const emptyAmounts = () => ({
  purchase: '',
  contribution: '',
  expenses: '',
  future: '',
});
export type Amounts = ReturnType<typeof emptyAmounts>;
export function calculateAmounts(inputs: Amounts, scenario: string) {
  const values = Object.values(inputs);
  const valid = values.every(
    (v) =>
      /^\d+(?:\.\d{1,2})?$/.test(v) &&
      Number.isFinite(Number(v)) &&
      Number(v) <= 1_000_000_000,
  );
  if (!valid)
    return {
      invested: null,
      projectedValue: null,
      profit: null,
      returnRate: null,
    };
  const invested =
    Number(inputs.purchase) +
    Number(inputs.contribution) +
    Number(inputs.expenses);
  const projectedValue =
    Number(inputs.future) *
    (scenario === '보수적' ? 0.8 : scenario === '낙관적' ? 1.15 : 1);
  const profit = projectedValue - invested;
  return {
    invested,
    projectedValue,
    profit,
    returnRate: invested > 0 ? (profit / invested) * 100 : null,
  };
}
