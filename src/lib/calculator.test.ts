import { describe, expect, it } from "vitest";

import {
  BASELINE_INPUTS,
  calculateBuyVsRent,
  calculateMonthlyMortgagePayment,
  calculateSensitivity,
  findBreakEvenStockReturn,
  type CalculatorInputs,
} from "./calculator";

const simpleInputs = (overrides: Partial<CalculatorInputs> = {}): CalculatorInputs => ({
  ...BASELINE_INPUTS,
  horizonYears: 1,
  homePrice: 100_000,
  downPayment: 20_000,
  mortgageInterestRate: 0.06,
  mortgageTermYears: 30,
  homeAppreciationRate: 0,
  propertyTaxRate: 0,
  homeownersInsuranceAnnual: 0,
  hoaMonthly: 0,
  maintenanceRate: 0,
  buyerClosingCosts: 0,
  sellingCostRate: 0,
  initialMonthlyRent: 0,
  rentInflationRate: 0,
  rentersInsuranceAnnual: 0,
  stockReturnRate: 0,
  ...overrides,
});

describe("fixed-rate mortgage math", () => {
  it("matches a known 30-year payment example", () => {
    expect(calculateMonthlyMortgagePayment(100_000, 0.06, 30)).toBeCloseTo(
      599.5505,
      4,
    );
  });

  it("aggregates the first year of amortization accurately", () => {
    const result = calculateBuyVsRent(
      simpleInputs({ homePrice: 100_000, downPayment: 0 }),
    );
    const year = result.years[1];

    expect(year.mortgagePayments).toBeCloseTo(7_194.61, 2);
    expect(year.interestPaid).toBeCloseTo(5_966.59, 2);
    expect(year.principalPaid).toBeCloseTo(1_228.01, 2);
    expect(year.mortgageBalance).toBeCloseTo(98_771.99, 2);
  });

  it("fully amortizes without overpaying and preserves principal", () => {
    const result = calculateBuyVsRent(
      simpleInputs({
        horizonYears: 40,
        homePrice: 360_000,
        downPayment: 60_000,
        mortgageInterestRate: 0.05,
      }),
    );
    const final = result.years.at(-1)!;

    expect(final.mortgageBalance).toBe(0);
    expect(final.cumulativePrincipalPaid).toBeCloseTo(300_000, 5);
    expect(result.years[31].principalPaid).toBe(0);
    expect(result.years[31].interestPaid).toBe(0);
  });

  it("handles a zero-interest mortgage", () => {
    expect(calculateMonthlyMortgagePayment(120_000, 0, 10)).toBe(1_000);
    const result = calculateBuyVsRent(
      simpleInputs({
        horizonYears: 10,
        homePrice: 120_000,
        downPayment: 0,
        mortgageInterestRate: 0,
        mortgageTermYears: 10,
      }),
    );
    expect(result.years.at(-1)!.mortgageBalance).toBe(0);
    expect(result.years.at(-1)!.cumulativeInterestPaid).toBe(0);
  });

  it("refinances the current balance over the remaining original term", () => {
    const original = simpleInputs({
      horizonYears: 2,
      homePrice: 120_000,
      downPayment: 0,
      mortgageInterestRate: 0.12,
      mortgageTermYears: 10,
    });
    const withoutRefinance = calculateBuyVsRent(original);
    const refinanced = calculateBuyVsRent({
      ...original,
      refinanceYear: 2,
      refinanceInterestRate: 0,
    });
    const balanceAtRefinance = refinanced.years[1].mortgageBalance;

    expect(refinanced.years[2].interestPaid).toBe(0);
    expect(refinanced.years[2].mortgagePayments).toBeCloseTo(
      (balanceAtRefinance / 108) * 12,
      8,
    );
    expect(refinanced.years[2].mortgageBalance).toBeGreaterThan(0);
    expect(withoutRefinance.years[2].interestPaid).toBeGreaterThan(0);
  });

  it("ignores refinance years at zero or outside the original term", () => {
    const original = simpleInputs({ horizonYears: 2, mortgageTermYears: 1 });
    const disabled = calculateBuyVsRent({
      ...original,
      refinanceYear: 0,
      refinanceInterestRate: 0,
    });
    const outsideTerm = calculateBuyVsRent({
      ...original,
      refinanceYear: 2,
      refinanceInterestRate: 0,
    });
    expect(outsideTerm.years).toEqual(disabled.years);
  });
});

describe("accounting invariants", () => {
  it("keeps principal out of unrecoverable owner cost", () => {
    const year = calculateBuyVsRent(
      simpleInputs({
        propertyTaxRate: 0.01,
        homeownersInsuranceAnnual: 500,
        maintenanceRate: 0.01,
        hoaMonthly: 25,
      }),
    ).years[1];

    expect(year.ownerHousingCost - year.ownerUnrecoverableCost).toBeCloseTo(
      year.principalPaid,
      8,
    );
    expect(year.ownerUnrecoverableCost).toBeCloseTo(
      year.interestPaid +
        year.propertyTaxes +
        year.homeownersInsurance +
        year.maintenance +
        year.hoa,
      8,
    );
  });

  it("invests exactly the annual housing-cost difference on the cheaper side", () => {
    const result = calculateBuyVsRent(
      simpleInputs({
        horizonYears: 12,
        initialMonthlyRent: 700,
        rentInflationRate: 0.2,
        homeownersInsuranceAnnual: 2_000,
        additionalMonthlyInvestment: 100,
      }),
    );

    for (const year of result.years.slice(1)) {
      const expectedDifference = Math.abs(
        year.ownerHousingCost - year.renterHousingCost,
      );
      const actualDifference =
        year.ownerCashFlowDifferenceInvested +
        year.renterCashFlowDifferenceInvested;
      expect(actualDifference).toBeCloseTo(expectedDifference, 8);
      expect(
        Math.min(
          year.ownerCashFlowDifferenceInvested,
          year.renterCashFlowDifferenceInvested,
        ),
      ).toBe(0);
      expect(
        year.ownerHousingCost + year.ownerCashFlowDifferenceInvested,
      ).toBeCloseTo(
        year.renterHousingCost + year.renterCashFlowDifferenceInvested,
        8,
      );
      expect(year.ownerBaseInvestmentContribution).toBe(1_200);
      expect(year.renterBaseInvestmentContribution).toBe(1_200);
    }
  });

  it("uses sale-ready equity in owner net worth", () => {
    const result = calculateBuyVsRent(
      simpleInputs({
        horizonYears: 0,
        homePrice: 500_000,
        downPayment: 100_000,
        buyerClosingCosts: 15_000,
        sellingCostRate: 0.06,
      }),
    );
    const year = result.years[0];

    expect(year.grossHomeEquity).toBe(100_000);
    expect(year.sellingCosts).toBe(30_000);
    expect(year.realizableHomeEquity).toBe(70_000);
    expect(year.ownerNetWorth).toBe(70_000);
    expect(year.renterNetWorth).toBe(115_000);
  });

  it("accounts for every dollar of each outside portfolio", () => {
    const result = calculateBuyVsRent(
      simpleInputs({
        horizonYears: 10,
        stockReturnRate: 0.08,
        ownerInitialInvestment: 10_000,
        renterInitialInvestment: 30_000,
        additionalAnnualInvestment: 1_000,
      }),
    );
    const final = result.years.at(-1)!;

    expect(final.ownerInvestmentPortfolio).toBeCloseTo(
      10_000 +
        final.cumulativeOwnerInvestmentContributions +
        final.ownerInvestmentGains,
      8,
    );
    expect(final.renterInvestmentPortfolio).toBeCloseTo(
      30_000 +
        final.cumulativeRenterInvestmentContributions +
        final.renterInvestmentGains,
      8,
    );
  });

  it("compounds recurring monthly investments from each month-end deposit", () => {
    const result = calculateBuyVsRent(
      simpleInputs({
        homePrice: 0,
        downPayment: 0,
        mortgageInterestRate: 0,
        ownerInitialInvestment: 0,
        renterInitialInvestment: 0,
        stockReturnRate: 0.12,
        additionalMonthlyInvestment: 100,
      }),
    );
    const year = result.years[1];

    expect(year.ownerInvestmentPortfolio).toBeGreaterThan(1_200);
    expect(year.ownerInvestmentPortfolio).toBeLessThan(1_200 * 1.12);
    expect(year.ownerInvestmentPortfolio).toBeCloseTo(
      year.renterInvestmentPortfolio,
      10,
    );
    expect(year.ownerInvestmentGains).toBeCloseTo(
      year.ownerInvestmentPortfolio - 1_200,
      8,
    );
  });

  it("prorates PMI by month and cancels it after crossing 80% LTV", () => {
    const result = calculateBuyVsRent(
      simpleInputs({
        homePrice: 100_000,
        downPayment: 15_000,
        mortgageInterestRate: 0,
        mortgageTermYears: 1,
        pmiAnnual: 1_200,
      }),
    );
    const year = result.years[1];

    // Balance starts at 85% LTV. With $7,083.33 monthly principal it is above
    // 80% only for the first month, so only one $100 installment is charged.
    expect(year.pmi).toBeCloseTo(100, 8);
  });

  it("subtracts taxable home gains from realizable equity", () => {
    const result = calculateBuyVsRent(
      simpleInputs({
        horizonYears: 1,
        homePrice: 100_000,
        downPayment: 100_000,
        homeAppreciationRate: 1,
        sellingCostRate: 0.05,
        homeCapitalGainsTaxRate: 0.2,
        capitalGainsExclusion: 25_000,
      }),
    );
    const year = result.years[1];

    expect(year.homeValue).toBe(200_000);
    expect(year.homeCapitalGainsTax).toBe(15_000);
    expect(year.sellingCosts).toBe(25_000);
    expect(year.realizableHomeEquity).toBe(175_000);
    expect(year.cumulativeOwnerUnrecoverableCost).toBeCloseTo(
      year.cumulativeOwnerUnrecoverableCostBeforeSale + 25_000,
      8,
    );
  });

  it("preserves deterministic metadata without changing nominal output", () => {
    const plain = calculateBuyVsRent(simpleInputs({ horizonYears: 5 }));
    const metadata = calculateBuyVsRent(
      simpleInputs({
        horizonYears: 5,
        stockReturnVolatility: 0.22,
        homeAppreciationVolatility: 0.12,
        inflationRate: 0.04,
      }),
    );

    expect(metadata.inputs.stockReturnVolatility).toBe(0.22);
    expect(metadata.inputs.homeAppreciationVolatility).toBe(0.12);
    expect(metadata.inputs.inflationRate).toBe(0.04);
    expect(metadata.years).toEqual(plain.years);
  });

  it("derives dollar down payment from a percentage", () => {
    const inputs = simpleInputs({ downPayment: undefined, downPaymentPercent: 0.25 });
    const result = calculateBuyVsRent(inputs);
    expect(result.inputs.downPayment).toBe(25_000);
    expect(result.years[0].mortgageBalance).toBe(75_000);
  });
});

describe("comparison helpers", () => {
  it("returns a year-zero point, every requested year, and valid crossover data", () => {
    const result = calculateBuyVsRent({ ...BASELINE_INPUTS, horizonYears: 30 });
    expect(result.years).toHaveLength(31);
    expect(result.years.map((year) => year.year)).toEqual(
      Array.from({ length: 31 }, (_, index) => index),
    );
    for (const year of result.summary.crossoverYears) {
      expect(year).toBeGreaterThan(0);
      expect(year).toBeLessThanOrEqual(30);
    }
    expect(result.summary.crossoverYear).toBe(
      result.summary.crossoverYears[0] ?? null,
    );
  });

  it("builds a sensitivity grid in home-by-stock axis order", () => {
    const stocks = [0.04, 0.08, 0.12];
    const homes = [0.01, 0.04];
    const grid = calculateSensitivity(
      { ...BASELINE_INPUTS, horizonYears: 10 },
      stocks,
      homes,
    );

    expect(grid.cells).toHaveLength(2);
    expect(grid.cells[0]).toHaveLength(3);
    expect(grid.cells[1][2].stockReturnRate).toBe(0.12);
    expect(grid.cells[1][2].homeAppreciationRate).toBe(0.04);
    expect(grid.cells[1][2].advantage).toBeCloseTo(
      grid.cells[1][2].buyNetWorth - grid.cells[1][2].rentNetWorth,
      8,
    );
  });

  it("finds a stock return whose final net-worth difference is near zero", () => {
    const inputs = { ...BASELINE_INPUTS, horizonYears: 20 };
    const rate = findBreakEvenStockReturn(inputs, {
      minRate: -0.05,
      maxRate: 0.25,
      dollarTolerance: 5,
    });

    expect(rate).not.toBeNull();
    const result = calculateBuyVsRent({ ...inputs, stockReturnRate: rate! });
    expect(Math.abs(result.years.at(-1)!.netWorthDifference)).toBeLessThanOrEqual(6);
  });

  it("returns null when no break-even exists in the requested interval", () => {
    const inputs = simpleInputs({
      horizonYears: 10,
      homePrice: 100_000,
      downPayment: 100_000,
      homeAppreciationRate: 0.2,
      initialMonthlyRent: 10_000,
      sellingCostRate: 0,
    });
    expect(
      findBreakEvenStockReturn(inputs, { minRate: 0, maxRate: 0.01 }),
    ).toBeNull();
  });
});

describe("input protection", () => {
  it("rejects impossible down payments and invalid rates", () => {
    expect(() =>
      calculateBuyVsRent(simpleInputs({ downPayment: 100_001 })),
    ).toThrow(/downPayment/);
    expect(() =>
      calculateBuyVsRent(simpleInputs({ homeAppreciationRate: -1 })),
    ).toThrow(/homeAppreciationRate/);
  });
});
