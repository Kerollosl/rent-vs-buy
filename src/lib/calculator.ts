/**
 * Framework-independent buy-versus-rent calculation engine.
 *
 * Rate inputs use decimal fractions (`0.0676` means 6.76%). Mortgage cash flows
 * are calculated monthly and aggregated by calendar year. Each outside
 * portfolio compounds monthly, with recurring monthly contributions posted at
 * month end. Additional annual contributions and the annual cash-flow
 * equalization contribution post at year end. Equal timing for both strategies
 * avoids granting either an intra-year advantage on the housing-cost spread.
 * `stockReturnVolatility`, `homeAppreciationVolatility`, and `inflationRate`
 * are preserved scenario metadata for future stochastic/real-dollar views.
 * They intentionally do not alter this deterministic nominal expected-value
 * projection.
 */

export type Winner = "buy" | "rent" | "tie";

export interface CalculatorInputs {
  horizonYears: number;

  homePrice: number;
  /** Dollar amount. Takes precedence over downPaymentPercent when provided. */
  downPayment?: number;
  downPaymentPercent?: number;
  mortgageInterestRate: number;
  mortgageTermYears: number;
  homeAppreciationRate: number;
  propertyTaxRate: number;
  homeownersInsuranceAnnual: number;
  hoaMonthly: number;
  /** Annual percentage of the home's beginning-of-year value. */
  maintenanceRate: number;
  /** Fixed annual maintenance amount; when set, replaces maintenanceRate. */
  maintenanceAnnual?: number;
  buyerClosingCosts: number;
  sellingCostRate: number;
  /** One-time year-one cash expense. It does not automatically increase value. */
  renovationCosts?: number;
  annualCapitalImprovements?: number;

  initialMonthlyRent: number;
  rentInflationRate: number;
  rentersInsuranceAnnual: number;

  /** Defaults to the down payment plus buyer closing costs. */
  renterInitialInvestment?: number;
  ownerInitialInvestment?: number;
  stockReturnRate: number;
  /** Metadata for future stochastic projections; unused by deterministic mode. */
  stockReturnVolatility?: number;
  /** Metadata for future stochastic projections; unused by deterministic mode. */
  homeAppreciationVolatility?: number;
  /** Metadata for future real-dollar views; nominal output is not deflated. */
  inflationRate?: number;
  investmentManagementDrag?: number;
  /** Tax drag on positive annualized investment returns. */
  investmentTaxRate?: number;
  /** These contributions are made in both strategies to preserve symmetry. */
  additionalMonthlyInvestment?: number;
  additionalAnnualInvestment?: number;

  extraMortgagePaymentMonthly?: number;
  /** Refinance occurs at the start of this year. Zero disables refinancing. */
  refinanceYear?: number;
  refinanceInterestRate?: number;
  pmiAnnual?: number;
  hoaInflationRate?: number;
  maintenanceInflationRate?: number;
  homeownersInsuranceInflationRate?: number;
  rentersInsuranceInflationRate?: number;
  /** Fraction of mortgage interest returned as a tax benefit. */
  mortgageInterestTaxBenefitRate?: number;
  /** Fraction of property tax returned as a tax benefit. */
  propertyTaxBenefitRate?: number;
  homeCapitalGainsTaxRate?: number;
  capitalGainsExclusion?: number;
}

export interface NormalizedCalculatorInputs
  extends Omit<
    Required<CalculatorInputs>,
    "maintenanceAnnual" | "downPaymentPercent"
  > {
  maintenanceAnnual?: number;
  downPaymentPercent: number;
}

export interface YearResult {
  year: number;

  homeValue: number;
  mortgageBalance: number;
  principalPaid: number;
  interestPaid: number;
  mortgagePayments: number;
  propertyTaxes: number;
  homeownersInsurance: number;
  maintenance: number;
  hoa: number;
  pmi: number;
  renovationCosts: number;
  ownerTaxBenefits: number;
  /** Full owner cash outflow used for annual cash-flow symmetry. */
  ownerHousingCost: number;
  /** Owner cost excluding principal, before hypothetical selling costs. */
  ownerUnrecoverableCost: number;

  grossHomeEquity: number;
  homeCapitalGainsTax: number;
  /** Broker/transfer selling costs plus home capital-gains tax. */
  sellingCosts: number;
  realizableHomeEquity: number;
  ownerBaseInvestmentContribution: number;
  ownerCashFlowDifferenceInvested: number;
  ownerInvestmentContributions: number;
  ownerPortfolioGrowth: number;
  ownerInvestmentPortfolio: number;
  ownerNetWorth: number;

  rent: number;
  rentersInsurance: number;
  renterHousingCost: number;
  renterBaseInvestmentContribution: number;
  renterCashFlowDifferenceInvested: number;
  renterInvestmentContributions: number;
  renterPortfolioGrowth: number;
  renterInvestmentPortfolio: number;
  renterNetWorth: number;

  cumulativePrincipalPaid: number;
  cumulativeInterestPaid: number;
  cumulativePropertyTaxes: number;
  cumulativeMaintenance: number;
  cumulativeOwnerHousingCost: number;
  cumulativeOwnerUnrecoverableCostBeforeSale: number;
  /** Includes buyer closing costs and selling costs at this horizon. */
  cumulativeOwnerUnrecoverableCost: number;
  cumulativeRentPaid: number;
  cumulativeRenterHousingCost: number;
  cumulativeOwnerInvestmentContributions: number;
  cumulativeRenterInvestmentContributions: number;
  ownerInvestmentGains: number;
  renterInvestmentGains: number;

  /** Owner net worth minus renter net worth. */
  netWorthDifference: number;
  winner: Winner;
}

export interface CalculationSummary {
  winner: Winner;
  advantage: number;
  /** Difference divided by the absolute value of the trailing strategy. */
  percentageAdvantage: number | null;
  crossoverYear: number | null;
  crossoverYears: number[];
  mortgagePaymentMonthly: number;
  initialOwnerCashOutlay: number;
  initialRenterInvestment: number;
  effectiveStockReturnRate: number;
}

export interface CalculationResult {
  inputs: NormalizedCalculatorInputs;
  years: YearResult[];
  summary: CalculationSummary;
}

export interface SensitivityCell {
  stockReturnRate: number;
  homeAppreciationRate: number;
  buyNetWorth: number;
  rentNetWorth: number;
  /** Owner net worth minus renter net worth. */
  advantage: number;
  winner: Winner;
}

export interface SensitivityGrid {
  stockReturnRates: number[];
  homeAppreciationRates: number[];
  cells: SensitivityCell[][];
}

export const BASELINE_INPUTS: CalculatorInputs = {
  horizonYears: 30,
  homePrice: 500_000,
  downPayment: 100_000,
  mortgageInterestRate: 0.0676,
  mortgageTermYears: 30,
  homeAppreciationRate: 0.03,
  propertyTaxRate: 0.012,
  homeownersInsuranceAnnual: 2_000,
  hoaMonthly: 0,
  maintenanceRate: 0.01,
  buyerClosingCosts: 15_000,
  sellingCostRate: 0.06,
  renovationCosts: 0,
  annualCapitalImprovements: 0,
  initialMonthlyRent: 3_000,
  rentInflationRate: 0.03,
  rentersInsuranceAnnual: 240,
  stockReturnRate: 0.08,
  stockReturnVolatility: 0,
  homeAppreciationVolatility: 0,
  inflationRate: 0.025,
  investmentManagementDrag: 0,
  investmentTaxRate: 0,
  additionalMonthlyInvestment: 0,
  additionalAnnualInvestment: 0,
  ownerInitialInvestment: 0,
  extraMortgagePaymentMonthly: 0,
  refinanceYear: 0,
  refinanceInterestRate: 0.0676,
  pmiAnnual: 0,
  hoaInflationRate: 0,
  maintenanceInflationRate: 0,
  homeownersInsuranceInflationRate: 0,
  rentersInsuranceInflationRate: 0,
  mortgageInterestTaxBenefitRate: 0,
  propertyTaxBenefitRate: 0,
  homeCapitalGainsTaxRate: 0,
  capitalGainsExclusion: 250_000,
};

const EPSILON = 1e-7;

function finite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number`);
  }
}

function nonNegative(name: string, value: number): void {
  finite(name, value);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

function rateAboveNegativeOne(name: string, value: number): void {
  finite(name, value);
  if (value <= -1) throw new RangeError(`${name} must be greater than -100%`);
}

function resolveInputs(input: CalculatorInputs): NormalizedCalculatorInputs {
  const downPayment =
    input.downPayment ?? input.homePrice * (input.downPaymentPercent ?? 0.2);
  const downPaymentPercent =
    input.homePrice === 0 ? 0 : downPayment / input.homePrice;

  const normalized: NormalizedCalculatorInputs = {
    ...input,
    downPayment,
    downPaymentPercent,
    maintenanceAnnual: input.maintenanceAnnual,
    renovationCosts: input.renovationCosts ?? 0,
    annualCapitalImprovements: input.annualCapitalImprovements ?? 0,
    renterInitialInvestment:
      input.renterInitialInvestment ?? downPayment + input.buyerClosingCosts,
    ownerInitialInvestment: input.ownerInitialInvestment ?? 0,
    stockReturnVolatility: input.stockReturnVolatility ?? 0,
    homeAppreciationVolatility: input.homeAppreciationVolatility ?? 0,
    inflationRate: input.inflationRate ?? 0.025,
    investmentManagementDrag: input.investmentManagementDrag ?? 0,
    investmentTaxRate: input.investmentTaxRate ?? 0,
    additionalMonthlyInvestment: input.additionalMonthlyInvestment ?? 0,
    additionalAnnualInvestment: input.additionalAnnualInvestment ?? 0,
    extraMortgagePaymentMonthly: input.extraMortgagePaymentMonthly ?? 0,
    refinanceYear: input.refinanceYear ?? 0,
    refinanceInterestRate:
      input.refinanceInterestRate ?? input.mortgageInterestRate,
    pmiAnnual: input.pmiAnnual ?? 0,
    hoaInflationRate: input.hoaInflationRate ?? 0,
    maintenanceInflationRate: input.maintenanceInflationRate ?? 0,
    homeownersInsuranceInflationRate:
      input.homeownersInsuranceInflationRate ?? 0,
    rentersInsuranceInflationRate:
      input.rentersInsuranceInflationRate ?? 0,
    mortgageInterestTaxBenefitRate:
      input.mortgageInterestTaxBenefitRate ?? 0,
    propertyTaxBenefitRate: input.propertyTaxBenefitRate ?? 0,
    homeCapitalGainsTaxRate: input.homeCapitalGainsTaxRate ?? 0,
    capitalGainsExclusion: input.capitalGainsExclusion ?? 250_000,
  };

  if (!Number.isInteger(normalized.horizonYears) || normalized.horizonYears < 0) {
    throw new RangeError("horizonYears must be a non-negative integer");
  }
  if (
    !Number.isInteger(normalized.mortgageTermYears) ||
    normalized.mortgageTermYears <= 0
  ) {
    throw new RangeError("mortgageTermYears must be a positive integer");
  }
  if (!Number.isInteger(normalized.refinanceYear)) {
    throw new RangeError("refinanceYear must be an integer");
  }

  const nonNegativeFields: Array<[string, number]> = [
    ["homePrice", normalized.homePrice],
    ["downPayment", normalized.downPayment],
    ["homeownersInsuranceAnnual", normalized.homeownersInsuranceAnnual],
    ["hoaMonthly", normalized.hoaMonthly],
    ["buyerClosingCosts", normalized.buyerClosingCosts],
    ["renovationCosts", normalized.renovationCosts],
    ["annualCapitalImprovements", normalized.annualCapitalImprovements],
    ["initialMonthlyRent", normalized.initialMonthlyRent],
    ["rentersInsuranceAnnual", normalized.rentersInsuranceAnnual],
    ["renterInitialInvestment", normalized.renterInitialInvestment],
    ["ownerInitialInvestment", normalized.ownerInitialInvestment],
    ["additionalMonthlyInvestment", normalized.additionalMonthlyInvestment],
    ["additionalAnnualInvestment", normalized.additionalAnnualInvestment],
    ["extraMortgagePaymentMonthly", normalized.extraMortgagePaymentMonthly],
    ["refinanceYear", normalized.refinanceYear],
    ["refinanceInterestRate", normalized.refinanceInterestRate],
    ["pmiAnnual", normalized.pmiAnnual],
    ["stockReturnVolatility", normalized.stockReturnVolatility],
    ["homeAppreciationVolatility", normalized.homeAppreciationVolatility],
    ["homeCapitalGainsTaxRate", normalized.homeCapitalGainsTaxRate],
    ["capitalGainsExclusion", normalized.capitalGainsExclusion],
  ];
  for (const [name, value] of nonNegativeFields) nonNegative(name, value);
  if (normalized.maintenanceAnnual !== undefined) {
    nonNegative("maintenanceAnnual", normalized.maintenanceAnnual);
  }
  if (normalized.downPayment > normalized.homePrice) {
    throw new RangeError("downPayment cannot exceed homePrice");
  }

  const ordinaryRates: Array<[string, number]> = [
    ["mortgageInterestRate", normalized.mortgageInterestRate],
    ["propertyTaxRate", normalized.propertyTaxRate],
    ["maintenanceRate", normalized.maintenanceRate],
    ["sellingCostRate", normalized.sellingCostRate],
    ["investmentManagementDrag", normalized.investmentManagementDrag],
    ["investmentTaxRate", normalized.investmentTaxRate],
    ["mortgageInterestTaxBenefitRate", normalized.mortgageInterestTaxBenefitRate],
    ["propertyTaxBenefitRate", normalized.propertyTaxBenefitRate],
  ];
  for (const [name, value] of ordinaryRates) nonNegative(name, value);
  if (normalized.sellingCostRate > 1) {
    throw new RangeError("sellingCostRate cannot exceed 100%");
  }
  if (normalized.investmentTaxRate > 1) {
    throw new RangeError("investmentTaxRate cannot exceed 100%");
  }
  if (normalized.mortgageInterestTaxBenefitRate > 1) {
    throw new RangeError("mortgageInterestTaxBenefitRate cannot exceed 100%");
  }
  if (normalized.propertyTaxBenefitRate > 1) {
    throw new RangeError("propertyTaxBenefitRate cannot exceed 100%");
  }
  if (normalized.homeCapitalGainsTaxRate > 1) {
    throw new RangeError("homeCapitalGainsTaxRate cannot exceed 100%");
  }

  const growthRates: Array<[string, number]> = [
    ["homeAppreciationRate", normalized.homeAppreciationRate],
    ["rentInflationRate", normalized.rentInflationRate],
    ["stockReturnRate", normalized.stockReturnRate],
    ["inflationRate", normalized.inflationRate],
    ["hoaInflationRate", normalized.hoaInflationRate],
    ["maintenanceInflationRate", normalized.maintenanceInflationRate],
    [
      "homeownersInsuranceInflationRate",
      normalized.homeownersInsuranceInflationRate,
    ],
    [
      "rentersInsuranceInflationRate",
      normalized.rentersInsuranceInflationRate,
    ],
  ];
  for (const [name, value] of growthRates) rateAboveNegativeOne(name, value);

  return normalized;
}

function saleCostsAtValue(
  homeValue: number,
  inputs: NormalizedCalculatorInputs,
): { transactionCosts: number; homeCapitalGainsTax: number; total: number } {
  const transactionCosts = homeValue * inputs.sellingCostRate;
  const taxableGain = Math.max(
    0,
    homeValue - inputs.homePrice - inputs.capitalGainsExclusion,
  );
  const homeCapitalGainsTax = taxableGain * inputs.homeCapitalGainsTaxRate;
  return {
    transactionCosts,
    homeCapitalGainsTax,
    total: transactionCosts + homeCapitalGainsTax,
  };
}

function growPortfolioMonthly(
  openingBalance: number,
  effectiveAnnualReturn: number,
  monthlyContribution: number,
): { balance: number; growth: number } {
  const monthlyReturn = Math.pow(1 + effectiveAnnualReturn, 1 / 12) - 1;
  let balance = openingBalance;
  let growth = 0;
  for (let month = 0; month < 12; month += 1) {
    const monthlyGrowth = balance * monthlyReturn;
    growth += monthlyGrowth;
    balance += monthlyGrowth + monthlyContribution;
  }
  return { balance, growth };
}

/** Standard fixed-rate monthly principal-and-interest payment. */
export function calculateMonthlyMortgagePayment(
  principal: number,
  annualInterestRate: number,
  termYears: number,
): number {
  nonNegative("principal", principal);
  nonNegative("annualInterestRate", annualInterestRate);
  if (!Number.isInteger(termYears) || termYears <= 0) {
    throw new RangeError("termYears must be a positive integer");
  }
  if (principal === 0) return 0;
  const months = termYears * 12;
  if (annualInterestRate === 0) return principal / months;
  const monthlyRate = annualInterestRate / 12;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  );
}

function winnerForDifference(difference: number): Winner {
  if (Math.abs(difference) < 0.005) return "tie";
  return difference > 0 ? "buy" : "rent";
}

function afterTaxInvestmentReturn(inputs: NormalizedCalculatorInputs): number {
  const returnAfterDrag = inputs.stockReturnRate - inputs.investmentManagementDrag;
  return returnAfterDrag > 0
    ? returnAfterDrag * (1 - inputs.investmentTaxRate)
    : returnAfterDrag;
}

export function calculateBuyVsRent(input: CalculatorInputs): CalculationResult {
  const inputs = resolveInputs(input);
  const loanPrincipal = inputs.homePrice - inputs.downPayment;
  let activeMortgageInterestRate = inputs.mortgageInterestRate;
  let scheduledMortgagePayment = calculateMonthlyMortgagePayment(
    loanPrincipal,
    inputs.mortgageInterestRate,
    inputs.mortgageTermYears,
  );
  const effectiveStockReturnRate = afterTaxInvestmentReturn(inputs);
  if (effectiveStockReturnRate <= -1) {
    throw new RangeError(
      "stock return after management drag and tax must be greater than -100%",
    );
  }

  let homeValue = inputs.homePrice;
  let mortgageBalance = loanPrincipal;
  let ownerPortfolio = inputs.ownerInitialInvestment;
  let renterPortfolio = inputs.renterInitialInvestment;

  let cumulativePrincipalPaid = 0;
  let cumulativeInterestPaid = 0;
  let cumulativePropertyTaxes = 0;
  let cumulativeMaintenance = 0;
  let cumulativeOwnerHousingCost = 0;
  let cumulativeOwnerUnrecoverableCostBeforeSale = inputs.buyerClosingCosts;
  let cumulativeRentPaid = 0;
  let cumulativeRenterHousingCost = 0;
  let cumulativeOwnerInvestmentContributions = 0;
  let cumulativeRenterInvestmentContributions = 0;

  const initialSaleCosts = saleCostsAtValue(homeValue, inputs);
  const initialSellingCosts = initialSaleCosts.total;
  const initialRealizableEquity =
    homeValue - initialSellingCosts - mortgageBalance;
  const initialDifference =
    initialRealizableEquity + ownerPortfolio - renterPortfolio;

  const years: YearResult[] = [
    {
      year: 0,
      homeValue,
      mortgageBalance,
      principalPaid: 0,
      interestPaid: 0,
      mortgagePayments: 0,
      propertyTaxes: 0,
      homeownersInsurance: 0,
      maintenance: 0,
      hoa: 0,
      pmi: 0,
      renovationCosts: 0,
      ownerTaxBenefits: 0,
      ownerHousingCost: 0,
      ownerUnrecoverableCost: 0,
      grossHomeEquity: homeValue - mortgageBalance,
      homeCapitalGainsTax: initialSaleCosts.homeCapitalGainsTax,
      sellingCosts: initialSellingCosts,
      realizableHomeEquity: initialRealizableEquity,
      ownerBaseInvestmentContribution: 0,
      ownerCashFlowDifferenceInvested: 0,
      ownerInvestmentContributions: 0,
      ownerPortfolioGrowth: 0,
      ownerInvestmentPortfolio: ownerPortfolio,
      ownerNetWorth: initialRealizableEquity + ownerPortfolio,
      rent: 0,
      rentersInsurance: 0,
      renterHousingCost: 0,
      renterBaseInvestmentContribution: 0,
      renterCashFlowDifferenceInvested: 0,
      renterInvestmentContributions: 0,
      renterPortfolioGrowth: 0,
      renterInvestmentPortfolio: renterPortfolio,
      renterNetWorth: renterPortfolio,
      cumulativePrincipalPaid: 0,
      cumulativeInterestPaid: 0,
      cumulativePropertyTaxes: 0,
      cumulativeMaintenance: 0,
      cumulativeOwnerHousingCost: 0,
      cumulativeOwnerUnrecoverableCostBeforeSale: inputs.buyerClosingCosts,
      cumulativeOwnerUnrecoverableCost:
        inputs.buyerClosingCosts + initialSellingCosts,
      cumulativeRentPaid: 0,
      cumulativeRenterHousingCost: 0,
      cumulativeOwnerInvestmentContributions: 0,
      cumulativeRenterInvestmentContributions: 0,
      ownerInvestmentGains: 0,
      renterInvestmentGains: 0,
      netWorthDifference: initialDifference,
      winner: winnerForDifference(initialDifference),
    },
  ];

  const baseInvestmentContribution =
    inputs.additionalAnnualInvestment + inputs.additionalMonthlyInvestment * 12;

  for (let year = 1; year <= inputs.horizonYears; year += 1) {
    const beginningHomeValue = homeValue;
    let principalPaid = 0;
    let interestPaid = 0;
    let mortgagePayments = 0;
    let pmi = 0;

    const monthsElapsedAtStartOfYear = (year - 1) * 12;
    const remainingOriginalMortgageMonths =
      inputs.mortgageTermYears * 12 - monthsElapsedAtStartOfYear;
    if (
      inputs.refinanceYear === year &&
      inputs.refinanceYear > 0 &&
      remainingOriginalMortgageMonths > 0 &&
      mortgageBalance > EPSILON
    ) {
      activeMortgageInterestRate = inputs.refinanceInterestRate;
      scheduledMortgagePayment = calculateMonthlyMortgagePayment(
        mortgageBalance,
        activeMortgageInterestRate,
        remainingOriginalMortgageMonths / 12,
      );
    }

    for (let month = 0; month < 12 && mortgageBalance > EPSILON; month += 1) {
      // PMI is charged one month at a time and stops as soon as current LTV is
      // at or below 80%, rather than charging a full final year.
      if (
        beginningHomeValue > 0 &&
        mortgageBalance / beginningHomeValue > 0.8
      ) {
        pmi += inputs.pmiAnnual / 12;
      }
      const interest = mortgageBalance * (activeMortgageInterestRate / 12);
      const scheduledPrincipal = Math.max(0, scheduledMortgagePayment - interest);
      const principal = Math.min(
        mortgageBalance,
        scheduledPrincipal + inputs.extraMortgagePaymentMonthly,
      );
      interestPaid += interest;
      principalPaid += principal;
      mortgagePayments += interest + principal;
      mortgageBalance -= principal;
    }
    if (mortgageBalance < EPSILON) mortgageBalance = 0;

    const inflationIndex = year - 1;
    const propertyTaxes = beginningHomeValue * inputs.propertyTaxRate;
    const homeownersInsurance =
      inputs.homeownersInsuranceAnnual *
      Math.pow(1 + inputs.homeownersInsuranceInflationRate, inflationIndex);
    const maintenanceBase =
      inputs.maintenanceAnnual ?? beginningHomeValue * inputs.maintenanceRate;
    const maintenance =
      maintenanceBase *
      Math.pow(1 + inputs.maintenanceInflationRate, inflationIndex);
    const hoa =
      inputs.hoaMonthly *
      12 *
      Math.pow(1 + inputs.hoaInflationRate, inflationIndex);
    const renovationCosts =
      (year === 1 ? inputs.renovationCosts : 0) +
      inputs.annualCapitalImprovements;
    const ownerTaxBenefits =
      interestPaid * inputs.mortgageInterestTaxBenefitRate +
      propertyTaxes * inputs.propertyTaxBenefitRate;
    const ownerHousingCost =
      mortgagePayments +
      propertyTaxes +
      homeownersInsurance +
      maintenance +
      hoa +
      pmi +
      renovationCosts -
      ownerTaxBenefits;
    const ownerUnrecoverableCost =
      interestPaid +
      propertyTaxes +
      homeownersInsurance +
      maintenance +
      hoa +
      pmi +
      renovationCosts -
      ownerTaxBenefits;

    const rent =
      inputs.initialMonthlyRent *
      12 *
      Math.pow(1 + inputs.rentInflationRate, inflationIndex);
    const rentersInsurance =
      inputs.rentersInsuranceAnnual *
      Math.pow(1 + inputs.rentersInsuranceInflationRate, inflationIndex);
    const renterHousingCost = rent + rentersInsurance;

    const ownerCashFlowDifferenceInvested = Math.max(
      0,
      renterHousingCost - ownerHousingCost,
    );
    const renterCashFlowDifferenceInvested = Math.max(
      0,
      ownerHousingCost - renterHousingCost,
    );
    const ownerInvestmentContributions =
      baseInvestmentContribution + ownerCashFlowDifferenceInvested;
    const renterInvestmentContributions =
      baseInvestmentContribution + renterCashFlowDifferenceInvested;
    // Recurring monthly contributions are deposited at each month end and
    // therefore compound during the year. Annual and symmetry contributions
    // retain their documented year-end timing.
    const ownerPortfolioYear = growPortfolioMonthly(
      ownerPortfolio,
      effectiveStockReturnRate,
      inputs.additionalMonthlyInvestment,
    );
    const renterPortfolioYear = growPortfolioMonthly(
      renterPortfolio,
      effectiveStockReturnRate,
      inputs.additionalMonthlyInvestment,
    );
    const ownerPortfolioGrowth = ownerPortfolioYear.growth;
    const renterPortfolioGrowth = renterPortfolioYear.growth;
    ownerPortfolio =
      ownerPortfolioYear.balance +
      inputs.additionalAnnualInvestment +
      ownerCashFlowDifferenceInvested;
    renterPortfolio =
      renterPortfolioYear.balance +
      inputs.additionalAnnualInvestment +
      renterCashFlowDifferenceInvested;

    homeValue *= 1 + inputs.homeAppreciationRate;
    const grossHomeEquity = homeValue - mortgageBalance;
    const saleCosts = saleCostsAtValue(homeValue, inputs);
    const sellingCosts = saleCosts.total;
    const realizableHomeEquity = grossHomeEquity - sellingCosts;
    const ownerNetWorth = realizableHomeEquity + ownerPortfolio;
    const renterNetWorth = renterPortfolio;
    const netWorthDifference = ownerNetWorth - renterNetWorth;

    cumulativePrincipalPaid += principalPaid;
    cumulativeInterestPaid += interestPaid;
    cumulativePropertyTaxes += propertyTaxes;
    cumulativeMaintenance += maintenance;
    cumulativeOwnerHousingCost += ownerHousingCost;
    cumulativeOwnerUnrecoverableCostBeforeSale += ownerUnrecoverableCost;
    cumulativeRentPaid += rent;
    cumulativeRenterHousingCost += renterHousingCost;
    cumulativeOwnerInvestmentContributions += ownerInvestmentContributions;
    cumulativeRenterInvestmentContributions += renterInvestmentContributions;

    years.push({
      year,
      homeValue,
      mortgageBalance,
      principalPaid,
      interestPaid,
      mortgagePayments,
      propertyTaxes,
      homeownersInsurance,
      maintenance,
      hoa,
      pmi,
      renovationCosts,
      ownerTaxBenefits,
      ownerHousingCost,
      ownerUnrecoverableCost,
      grossHomeEquity,
      homeCapitalGainsTax: saleCosts.homeCapitalGainsTax,
      sellingCosts,
      realizableHomeEquity,
      ownerBaseInvestmentContribution: baseInvestmentContribution,
      ownerCashFlowDifferenceInvested,
      ownerInvestmentContributions,
      ownerPortfolioGrowth,
      ownerInvestmentPortfolio: ownerPortfolio,
      ownerNetWorth,
      rent,
      rentersInsurance,
      renterHousingCost,
      renterBaseInvestmentContribution: baseInvestmentContribution,
      renterCashFlowDifferenceInvested,
      renterInvestmentContributions,
      renterPortfolioGrowth,
      renterInvestmentPortfolio: renterPortfolio,
      renterNetWorth,
      cumulativePrincipalPaid,
      cumulativeInterestPaid,
      cumulativePropertyTaxes,
      cumulativeMaintenance,
      cumulativeOwnerHousingCost,
      cumulativeOwnerUnrecoverableCostBeforeSale,
      cumulativeOwnerUnrecoverableCost:
        cumulativeOwnerUnrecoverableCostBeforeSale + sellingCosts,
      cumulativeRentPaid,
      cumulativeRenterHousingCost,
      cumulativeOwnerInvestmentContributions,
      cumulativeRenterInvestmentContributions,
      ownerInvestmentGains:
        ownerPortfolio -
        inputs.ownerInitialInvestment -
        cumulativeOwnerInvestmentContributions,
      renterInvestmentGains:
        renterPortfolio -
        inputs.renterInitialInvestment -
        cumulativeRenterInvestmentContributions,
      netWorthDifference,
      winner: winnerForDifference(netWorthDifference),
    });
  }

  const crossoverYears: number[] = [];
  let previousNonTieWinner: Winner | null =
    years[0].winner === "tie" ? null : years[0].winner;
  for (let index = 1; index < years.length; index += 1) {
    const currentWinner = years[index].winner;
    if (currentWinner === "tie") continue;
    if (previousNonTieWinner !== null && currentWinner !== previousNonTieWinner) {
      crossoverYears.push(years[index].year);
    }
    previousNonTieWinner = currentWinner;
  }

  const finalYear = years[years.length - 1];
  const winner = finalYear.winner;
  const advantage = Math.abs(finalYear.netWorthDifference);
  const trailingNetWorth =
    winner === "buy" ? finalYear.renterNetWorth : finalYear.ownerNetWorth;
  const percentageAdvantage =
    winner === "tie" || Math.abs(trailingNetWorth) < EPSILON
      ? null
      : advantage / Math.abs(trailingNetWorth);

  return {
    inputs,
    years,
    summary: {
      winner,
      advantage,
      percentageAdvantage,
      crossoverYear: crossoverYears[0] ?? null,
      crossoverYears,
      mortgagePaymentMonthly: scheduledMortgagePayment,
      initialOwnerCashOutlay:
        inputs.downPayment + inputs.buyerClosingCosts,
      initialRenterInvestment: inputs.renterInitialInvestment,
      effectiveStockReturnRate,
    },
  };
}

/** Alias kept intentionally terse for UI consumers. */
export const calculateScenario = calculateBuyVsRent;

export function calculateSensitivity(
  input: CalculatorInputs,
  stockReturnRates: number[],
  homeAppreciationRates: number[],
): SensitivityGrid {
  for (const rate of stockReturnRates) rateAboveNegativeOne("stock return", rate);
  for (const rate of homeAppreciationRates) {
    rateAboveNegativeOne("home appreciation", rate);
  }

  return {
    stockReturnRates: [...stockReturnRates],
    homeAppreciationRates: [...homeAppreciationRates],
    cells: homeAppreciationRates.map((homeAppreciationRate) =>
      stockReturnRates.map((stockReturnRate) => {
        const calculation = calculateBuyVsRent({
          ...input,
          stockReturnRate,
          homeAppreciationRate,
        });
        const final = calculation.years[calculation.years.length - 1];
        return {
          stockReturnRate,
          homeAppreciationRate,
          buyNetWorth: final.ownerNetWorth,
          rentNetWorth: final.renterNetWorth,
          advantage: final.netWorthDifference,
          winner: final.winner,
        };
      }),
    ),
  };
}

export const buildSensitivityGrid = calculateSensitivity;

export interface BreakEvenOptions {
  minRate?: number;
  maxRate?: number;
  /** Absolute net-worth difference accepted, in dollars. */
  dollarTolerance?: number;
  /** Return-rate interval tolerance. */
  rateTolerance?: number;
  maxIterations?: number;
}

/**
 * Finds the lowest stock-return crossing in the requested range. A short scan
 * first locates a bracket, so this still works when the endpoints have the same
 * winner but an interior crossover exists.
 */
export function findBreakEvenStockReturn(
  input: CalculatorInputs,
  options: BreakEvenOptions = {},
): number | null {
  const minRate = options.minRate ?? -0.05;
  const maxRate = options.maxRate ?? 0.2;
  const dollarTolerance = options.dollarTolerance ?? 1;
  const rateTolerance = options.rateTolerance ?? 1e-7;
  const maxIterations = options.maxIterations ?? 100;
  rateAboveNegativeOne("minRate", minRate);
  rateAboveNegativeOne("maxRate", maxRate);
  if (maxRate <= minRate) throw new RangeError("maxRate must exceed minRate");
  nonNegative("dollarTolerance", dollarTolerance);
  nonNegative("rateTolerance", rateTolerance);
  if (!Number.isInteger(maxIterations) || maxIterations <= 0) {
    throw new RangeError("maxIterations must be a positive integer");
  }

  const advantageAt = (stockReturnRate: number): number => {
    const result = calculateBuyVsRent({ ...input, stockReturnRate });
    return result.years[result.years.length - 1].netWorthDifference;
  };

  const scanSteps = 200;
  let low = minRate;
  let lowValue = advantageAt(low);
  if (Math.abs(lowValue) <= dollarTolerance) return low;
  let high = low;
  let highValue = lowValue;
  let bracketFound = false;
  for (let step = 1; step <= scanSteps; step += 1) {
    high = minRate + ((maxRate - minRate) * step) / scanSteps;
    highValue = advantageAt(high);
    if (Math.abs(highValue) <= dollarTolerance) return high;
    if (Math.sign(highValue) !== Math.sign(lowValue)) {
      bracketFound = true;
      break;
    }
    low = high;
    lowValue = highValue;
  }
  if (!bracketFound) return null;

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const midpoint = (low + high) / 2;
    const midpointValue = advantageAt(midpoint);
    if (
      Math.abs(midpointValue) <= dollarTolerance ||
      high - low <= rateTolerance
    ) {
      return midpoint;
    }
    if (Math.sign(midpointValue) === Math.sign(lowValue)) {
      low = midpoint;
      lowValue = midpointValue;
    } else {
      high = midpoint;
      highValue = midpointValue;
    }
  }
  return (low + high) / 2;
}

export const approximateBreakEvenStockReturn = findBreakEvenStockReturn;
