// The arithmetic, kept away from anything that draws. The instalment, the bars,
// the transfer-day table and the sentence that says whether a bank would lend
// all come out of this file, so the page cannot quote one figure and chart
// another.

import { FEES, LOAN, type Unit } from "./data";

/** The monthly instalment on an annuity loan. */
export function instalment(
  principal: number,
  annualRate: number,
  years: number,
): number {
  const monthly = annualRate / 100 / 12;
  const terms = years * 12;
  if (monthly === 0) return principal / terms;
  return (principal * monthly) / (1 - Math.pow(1 + monthly, -terms));
}

/** The largest loan a given instalment carries, which is the same sum solved back. */
export function loanFor(
  payment: number,
  annualRate: number,
  years: number,
): number {
  const monthly = annualRate / 100 / 12;
  const terms = years * 12;
  return (payment * (1 - Math.pow(1 + monthly, -terms))) / monthly;
}

export interface YearRow {
  /** 1 for the first year of the loan */
  year: number;
  /** true while the promotional rate is still running */
  promo?: boolean;
  principal: number;
  interest: number;
  /** what is still owed at the end of the year */
  balance: number;
  /** the rate that applied through it */
  rate: number;
}

/**
 * Month by month, at the rate that actually applies. The instalment is fixed at
 * what the floating rate asks for, so through the teaser years more of it lands
 * on the balance and the loan finishes early. That is what really happens, and
 * it is the one part of this where the borrower is ahead.
 */
export function schedule(
  loan: number,
  payment: number,
  years: number,
): YearRow[] {
  const rows: YearRow[] = [];
  let balance = loan;

  for (let year = 1; year <= years && balance > 0.5; year += 1) {
    const rate = year <= LOAN.promoYears ? LOAN.promoRate : LOAN.floatRate;
    const monthly = rate / 100 / 12;
    let principalPaid = 0;
    let interestPaid = 0;

    for (let month = 0; month < 12 && balance > 0.5; month += 1) {
      const interest = balance * monthly;
      const principal = Math.min(payment - interest, balance);
      balance -= principal;
      principalPaid += principal;
      interestPaid += interest;
    }

    rows.push({
      year,
      principal: principalPaid,
      interest: interestPaid,
      balance,
      rate,
      promo: year <= LOAN.promoYears,
    });
  }

  return rows;
}

export interface Charge {
  id: string;
  label: string;
  amount: number;
  basis: string;
}

/** Everything that has to clear on transfer day besides the deposit. */
export function closingCharges(unit: Unit, loan: number): Charge[] {
  return [
    {
      id: "transfer",
      label: "ค่าธรรมเนียมโอนกรรมสิทธิ์",
      amount:
        unit.price *
        FEES.appraisedShare *
        FEES.transferRate *
        FEES.transferShare,
      basis:
        `${FEES.transferRate * 100}% ของราคาประเมิน ` +
        `(ประเมินไว้ ${Math.round(FEES.appraisedShare * 100)}% ของราคาขาย) ` +
        "ผู้ซื้อออกครึ่งหนึ่ง",
    },
    {
      id: "mortgage",
      label: "ค่าจดจำนอง",
      amount: loan * FEES.mortgageRate,
      basis: `${FEES.mortgageRate * 100}% ของวงเงินกู้`,
    },
    {
      id: "sinking",
      label: "เงินกองทุนส่วนกลาง",
      amount: unit.sqm * FEES.sinkingPerSqm,
      basis: `${FEES.sinkingPerSqm} บาทต่อ ตร.ม. จ่ายครั้งเดียว`,
    },
    {
      id: "maintenance",
      label: "ค่าส่วนกลางล่วงหน้า 1 ปี",
      amount: unit.sqm * FEES.maintenancePerSqm * 12,
      basis: `${FEES.maintenancePerSqm} บาทต่อ ตร.ม. ต่อเดือน`,
    },
    {
      id: "meters",
      label: "ค่ามิเตอร์ไฟและน้ำ",
      amount: FEES.meters,
      basis: "จ่ายให้โครงการ",
    },
    {
      id: "insurance",
      label: "ประกันอัคคีภัย 3 ปี",
      amount: FEES.fireInsurance,
      basis: "ธนาคารขอระหว่างผ่อน",
    },
  ];
}

export interface Remedy {
  /** extra deposit needed, in baht, to bring the instalment inside the rule */
  moreDown: number;
  /** the shortest term on offer that passes, if any does */
  longerYears: number | null;
}

export interface Assessment {
  unit: Unit;
  /** what the buyer put down */
  downPayment: number;
  /** the deposit a bank requires at all, whatever the buyer meant to put down */
  minimumDown: number;
  loan: number;
  payment: number;
  /** what the buyer must earn for this instalment to sit inside the DSR rule */
  incomeNeeded: number;
  income: number;
  passes: boolean;
  /** how far short the income is, monthly */
  gap: number;
  schedule: YearRow[];
  totalInterest: number;
  /** months actually taken, which the teaser years shorten */
  monthsTaken: number;
  monthsSaved: number;
  /** the first year where the instalment puts more on the balance than on interest */
  crossoverYear: number | null;
  charges: Charge[];
  chargesTotal: number;
  cashOnDay: number;
  remedy: Remedy | null;
}

export function assess(
  unit: Unit,
  downPayment: number,
  income: number,
  years: number,
): Assessment {
  // A bank lends up to its share of the price, so a thin deposit does not buy a
  // bigger loan: it just fails to complete the purchase.
  const minimumDown = unit.price * (1 - LOAN.maxLoanShare);
  const loan = Math.min(
    unit.price - downPayment,
    unit.price * LOAN.maxLoanShare,
  );

  const payment = instalment(loan, LOAN.floatRate, years);
  const incomeNeeded = payment / LOAN.dsr;

  // Income is the only thing that can fail here: the deposit control starts at
  // the bank's own minimum, so a thinner deposit is not a state this page can
  // be in, and a verdict that tried to cover both would have to explain a
  // shortfall of zero baht.
  const passes = income >= incomeNeeded;

  const rows = schedule(loan, payment, years);
  const totalInterest = rows.reduce((sum, row) => sum + row.interest, 0);
  const monthsTaken = rows.reduce(
    (count, row) =>
      count + (row.balance > 0.5 ? 12 : monthsInFinalYear(row, payment)),
    0,
  );
  // The year the split turns over for good. Taking the first year it happens
  // at all names a teaser year: while the promotional rate runs, more of the
  // instalment lands on the balance, and when the rate steps up it goes back.
  // Walked backwards, so it is the row after the last year interest won.
  let lastLosing = -1;
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    if (rows[index].principal <= rows[index].interest) {
      lastLosing = index;
      break;
    }
  }
  const crossover = rows[lastLosing + 1];

  const charges = closingCharges(unit, loan);
  const chargesTotal = charges.reduce((sum, charge) => sum + charge.amount, 0);

  let remedy: Remedy | null = null;
  if (!passes) {
    const affordable = loanFor(income * LOAN.dsr, LOAN.floatRate, years);
    const downNeeded = Math.max(unit.price - affordable, minimumDown);
    const longerYears =
      LOAN.years.find(
        (option) =>
          option > years &&
          instalment(loan, LOAN.floatRate, option) / LOAN.dsr <= income,
      ) ?? null;

    remedy = {
      moreDown: Math.max(
        0,
        Math.ceil((downNeeded - downPayment) / 1000) * 1000,
      ),
      longerYears,
    };
  }

  return {
    unit,
    downPayment,
    minimumDown,
    loan,
    payment,
    incomeNeeded,
    income,
    passes,
    gap: Math.max(0, incomeNeeded - income),
    schedule: rows,
    totalInterest,
    monthsTaken,
    monthsSaved: years * 12 - monthsTaken,
    crossoverYear: crossover ? crossover.year : null,
    charges,
    chargesTotal,
    cashOnDay: chargesTotal + downPayment,
    remedy,
  };
}

/**
 * The last year is rarely a full twelve instalments, so count what it took.
 * Rounded up rather than to nearest: a final instalment of less than half a
 * payment is still an instalment, and rounding it away made the "finishes
 * early by N" figure one too many on every term but thirty years.
 */
function monthsInFinalYear(row: YearRow, payment: number): number {
  const paid = row.principal + row.interest;
  return Math.max(1, Math.ceil(paid / payment - 0.001));
}
