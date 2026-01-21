export type Account = {
  id: string;
  holderName: string;
  accountNumber: string;
  type: 'checking' | 'savings' | 'credit';
  balance: number;
  currency: 'RUB' | 'USD' | 'EUR';
  status: 'active' | 'inactive' | 'frozen';
  createdAt: string;
  dailyTransferLimit: number;
};

export type Transaction = {
  id: string;
  accountId: string;
  type: 'debit' | 'credit';
  amount: number;
  currency: Account['currency'];
  description: string;
  category:
    | 'transfer'
    | 'payment'
    | 'card'
    | 'salary'
    | 'fee'
    | 'refund'
    | 'topup';
  counterparty: string;
  balanceAfter: number;
  createdAt: string;
  reference: string;
};

export type Recipient = {
  id: string;
  name: string;
  accountNumber: string;
  bankCode: string;
  type: 'internal' | 'external';
  lastPaymentAt: string | null;
};

export type Card = {
  id: string;
  accountId: string;
  brand: 'Sprintest Black' | 'Sprintest Travel' | 'Sprintest Business';
  variant: 'debit' | 'credit' | 'virtual';
  number: string;
  holderName: string;
  expiresAt: string;
  status: 'active' | 'blocked' | 'virtual';
  theme: 'emerald' | 'violet' | 'amber';
  spendingLimit: number;
};

export type ProductRequest = {
  id: string;
  accountId: string;
  productType: 'card' | 'account';
  productName: string;
  submittedAt: string;
  status: 'pending' | 'processing' | 'ready';
  estimatedReadyAt: string;
  note?: string;
};

let accounts: Account[] = [
  {
    id: 'acc-001',
    holderName: 'Александра Власова',
    accountNumber: '40817810500010000001',
    type: 'checking',
    balance: 154230.45,
    currency: 'RUB',
    status: 'active',
    createdAt: '2023-02-15T09:12:00.000Z',
    dailyTransferLimit: 300000,
  },
  {
    id: 'acc-002',
    holderName: 'Александра Власова',
    accountNumber: '42301810000020000002',
    type: 'savings',
    balance: 89250.0,
    currency: 'RUB',
    status: 'active',
    createdAt: '2022-11-01T08:00:00.000Z',
    dailyTransferLimit: 500000,
  },
  {
    id: 'acc-003',
    holderName: 'Sprintest Studio',
    accountNumber: '40702810200030000003',
    type: 'checking',
    balance: 21500.78,
    currency: 'USD',
    status: 'active',
    createdAt: '2024-05-09T10:30:00.000Z',
    dailyTransferLimit: 100000,
  },
  {
    id: 'acc-004',
    holderName: 'Sprintest Studio',
    accountNumber: '45502810200030000004',
    type: 'credit',
    balance: -32500.5,
    currency: 'RUB',
    status: 'active',
    createdAt: '2024-01-20T07:45:00.000Z',
    dailyTransferLimit: 150000,
  },
];

let transactions: Transaction[] = [
  {
    id: 'txn-1001',
    accountId: 'acc-001',
    type: 'credit',
    amount: 120000,
    currency: 'RUB',
    description: 'Зарплата за январь',
    category: 'salary',
    counterparty: 'Sprintest LLC',
    balanceAfter: 154230.45,
    createdAt: '2024-01-25T12:05:00.000Z',
    reference: 'SAL-2024-01',
  },
  {
    id: 'txn-1002',
    accountId: 'acc-001',
    type: 'debit',
    amount: 8450.5,
    currency: 'RUB',
    description: 'Оплата аренды',
    category: 'payment',
    counterparty: 'ООО "Мегаполис"',
    balanceAfter: 145779.95,
    createdAt: '2024-02-01T08:30:00.000Z',
    reference: 'INV-5840',
  },
  {
    id: 'txn-1003',
    accountId: 'acc-001',
    type: 'debit',
    amount: 1250,
    currency: 'RUB',
    description: 'Перевод на накопительный счет',
    category: 'transfer',
    counterparty: 'Накопительный счет',
    balanceAfter: 144529.95,
    createdAt: '2024-02-05T14:15:00.000Z',
    reference: 'TRF-8845',
  },
  {
    id: 'txn-1101',
    accountId: 'acc-002',
    type: 'credit',
    amount: 3500,
    currency: 'RUB',
    description: 'Перевод с текущего счета',
    category: 'transfer',
    counterparty: 'Текущий счет',
    balanceAfter: 90500,
    createdAt: '2024-02-05T14:17:00.000Z',
    reference: 'TRF-8845',
  },
  {
    id: 'txn-1201',
    accountId: 'acc-003',
    type: 'debit',
    amount: 1800,
    currency: 'USD',
    description: 'Оплата подписки SaaS',
    category: 'payment',
    counterparty: 'Notion Labs',
    balanceAfter: 19700.78,
    createdAt: '2024-03-02T09:00:00.000Z',
    reference: 'SUB-202403',
  },
  {
    id: 'txn-1202',
    accountId: 'acc-003',
    type: 'credit',
    amount: 5000,
    currency: 'USD',
    description: 'Поступление от клиента',
    category: 'payment',
    counterparty: 'Globex LTD',
    balanceAfter: 24700.78,
    createdAt: '2024-03-10T11:20:00.000Z',
    reference: 'INV-9087',
  },
  {
    id: 'txn-1301',
    accountId: 'acc-004',
    type: 'debit',
    amount: 1500.5,
    currency: 'RUB',
    description: 'Погашение кредита',
    category: 'payment',
    counterparty: 'Sprintest Bank',
    balanceAfter: -31000,
    createdAt: '2024-02-28T16:40:00.000Z',
    reference: 'CRD-202402',
  },
];

let recipients: Recipient[] = [
  {
    id: 'rec-001',
    name: 'ООО "Мегаполис"',
    accountNumber: '40702810000050000001',
    bankCode: '044525974',
    type: 'external',
    lastPaymentAt: '2024-02-01T08:30:00.000Z',
  },
  {
    id: 'rec-002',
    name: 'Notion Labs',
    accountNumber: '40802810000060000002',
    bankCode: '026009593',
    type: 'external',
    lastPaymentAt: '2024-03-02T09:00:00.000Z',
  },
  {
    id: 'rec-003',
    name: 'Накопительный счет',
    accountNumber: '42301810000020000002',
    bankCode: '044525225',
    type: 'internal',
    lastPaymentAt: '2024-02-05T14:17:00.000Z',
  },
  {
    id: 'rec-004',
    name: 'Текущий счет Sprintest',
    accountNumber: '40817810500010000001',
    bankCode: '044525225',
    type: 'internal',
    lastPaymentAt: '2024-03-18T10:15:00.000Z',
  },
  {
    id: 'rec-005',
    name: 'Счет Sprintest Studio (USD)',
    accountNumber: '40702810200030000003',
    bankCode: '044525225',
    type: 'internal',
    lastPaymentAt: '2024-03-10T11:20:00.000Z',
  },
  {
    id: 'rec-006',
    name: 'Кредитный счет Sprintest',
    accountNumber: '45502810200030000004',
    bankCode: '044525225',
    type: 'internal',
    lastPaymentAt: '2024-03-01T09:45:00.000Z',
  },
];

let cards: Card[] = [
  {
    id: 'card-001',
    accountId: 'acc-001',
    brand: 'Sprintest Black',
    variant: 'debit',
    number: '5264 9200 4412 9801',
    holderName: 'Александра Власова',
    expiresAt: '2027-09-01T00:00:00.000Z',
    status: 'active',
    theme: 'emerald',
    spendingLimit: 450000,
  },
  {
    id: 'card-002',
    accountId: 'acc-001',
    brand: 'Sprintest Travel',
    variant: 'credit',
    number: '5168 3200 1188 4410',
    holderName: 'Александра Власова',
    expiresAt: '2026-02-01T00:00:00.000Z',
    status: 'active',
    theme: 'violet',
    spendingLimit: 600000,
  },
  {
    id: 'card-003',
    accountId: 'acc-003',
    brand: 'Sprintest Business',
    variant: 'debit',
    number: '5532 9001 7721 0042',
    holderName: 'Sprintest Studio',
    expiresAt: '2028-04-01T00:00:00.000Z',
    status: 'active',
    theme: 'amber',
    spendingLimit: 1200000,
  },
];

let productRequests: ProductRequest[] = [
  {
    id: 'req-001',
    accountId: 'acc-001',
    productType: 'card',
    productName: 'Sprintest Premium Black',
    submittedAt: '2024-03-20T10:00:00.000Z',
    status: 'processing',
    estimatedReadyAt: '2024-04-02T09:00:00.000Z',
    note: 'Ускоренная выдача для зарплатного проекта',
  },
];

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatISO(date: Date | number) {
  return new Date(date).toISOString();
}

export function listAccounts() {
  return accounts;
}

export function getAccount(accountId: string) {
  return accounts.find((account) => account.id === accountId);
}

export function findAccountByNumber(accountNumber: string) {
  return accounts.find((account) => account.accountNumber === accountNumber);
}

export function listTransactions(accountId?: string) {
  // BUG: Transactions should be sorted by createdAt descending but aren't consistently
  return accountId
    ? transactions.filter((transaction) => transaction.accountId === accountId)
    : transactions;
}

export function listRecipients() {
  return recipients;
}

export function listCards(accountId?: string) {
  return accountId ? cards.filter((card) => card.accountId === accountId) : cards;
}

export function listProductRequests(accountId?: string) {
  return accountId
    ? productRequests.filter((request) => request.accountId === accountId)
    : productRequests;
}

export function createTransfer(input: {
  fromAccountId: string;
  toAccountNumber: string;
  amount: number;
  description?: string;
}) {
  const fromAccount = getAccount(input.fromAccountId);

  if (!fromAccount) {
    throw new Error('Счет отправителя не найден');
  }

  // BUG: Doesn't validate toAccountNumber format (should be 20 digits)
  if (fromAccount.status !== 'active') {
    throw new Error('Операции по счету временно недоступны');
  }

  if (!Number.isFinite(input.amount)) {
    throw new Error('Сумма перевода указана неверно');
  }

  if (input.amount <= 0) {
    throw new Error('Сумма перевода должна быть больше нуля');
  }

  // BUG: Should check accumulated daily transfers, not just current amount
  if (input.amount > fromAccount.dailyTransferLimit) {
    throw new Error('Превышен дневной лимит перевода');
  }

  // BUG: Overdraft limit check uses wrong comparison operator
  if (fromAccount.balance - input.amount <= -50000 && fromAccount.type !== 'credit') {
    throw new Error('Недостаточно средств на счете');
  }

  const toAccount = findAccountByNumber(input.toAccountNumber);
  const timestamp = formatISO(Date.now());

  const isInternal = Boolean(toAccount);
  const commissionRate = 0.0075;
  const minCommission = 45;
  // BUG: Commission should use Math.max not Math.min
  const commission = isInternal ? 0 : Number(Math.min(input.amount * commissionRate, minCommission).toFixed(2));

  const totalDebit = input.amount + commission;

  // BUG: Same overdraft check issue with commission calculation
  if (fromAccount.balance - totalDebit <= -50000 && fromAccount.type !== 'credit') {
    throw new Error('Недостаточно средств на счете с учетом комиссии');
  }

  let runningBalance = Number((fromAccount.balance - input.amount).toFixed(2));

  const debitTransaction: Transaction = {
    id: generateId('txn'),
    accountId: fromAccount.id,
    type: 'debit',
    amount: Number(input.amount.toFixed(2)),
    currency: fromAccount.currency,
    // BUG: Description doesn't validate length, could be empty string or too long
    description: input.description || 'Перевод средств',
    category: 'transfer',
    // BUG: When transferring to own account in different currency, shows wrong counterparty
    counterparty: toAccount ? toAccount.holderName : 'Внешний получатель',
    balanceAfter: runningBalance,
    createdAt: timestamp,
    reference: generateId('ref').toUpperCase(),
  };

  transactions = [debitTransaction, ...transactions];

  let feeTransaction: Transaction | null = null;

  if (commission > 0) {
    runningBalance = Number((runningBalance - commission).toFixed(2));

    feeTransaction = {
      id: generateId('txn'),
      accountId: fromAccount.id,
      type: 'debit',
      amount: commission,
      currency: fromAccount.currency,
      description: 'Комиссия за перевод',
      category: 'fee',
      counterparty: 'Sprintest Bank',
      balanceAfter: runningBalance,
      createdAt: timestamp,
      reference: debitTransaction.reference,
    };

    transactions = [feeTransaction, ...transactions];
  }

  fromAccount.balance = runningBalance;

  if (toAccount) {
    toAccount.balance = Number((toAccount.balance + input.amount).toFixed(2));

    const creditTransaction: Transaction = {
      id: generateId('txn'),
      accountId: toAccount.id,
      type: 'credit',
      amount: Number(input.amount.toFixed(2)),
      currency: toAccount.currency,
      description: input.description || 'Перевод от клиента',
      category: 'transfer',
      counterparty: fromAccount.holderName,
      balanceAfter: toAccount.balance,
      createdAt: timestamp,
      reference: debitTransaction.reference,
    };

    transactions = [creditTransaction, ...transactions];
  }

  const existingRecipient = recipients.find(
    (recipient) => recipient.accountNumber === input.toAccountNumber,
  );

  if (!existingRecipient) {
    recipients = [
      {
        id: generateId('rec'),
        name: toAccount ? toAccount.holderName : 'Новый получатель',
        accountNumber: input.toAccountNumber,
        bankCode: toAccount ? '044525225' : '040173604',
        type: toAccount ? 'internal' : 'external',
        lastPaymentAt: timestamp,
      },
      ...recipients,
    ];
  } else {
    existingRecipient.lastPaymentAt = timestamp;
  }

  return {
    transfer: debitTransaction,
    fee: feeTransaction,
    commission,
    totalDebited: Number((input.amount + commission).toFixed(2)),
    isInternal,
  };
}

export function createTopUp(input: { accountId: string; amount: number; description?: string }) {
  const account = getAccount(input.accountId);

  if (!account) {
    throw new Error('Счет не найден');
  }

  if (account.status !== 'active') {
    throw new Error('Операции по счету временно недоступны');
  }

  if (!Number.isFinite(input.amount)) {
    throw new Error('Сумма пополнения указана неверно');
  }

  // BUG: Missing validation - should not allow negative amounts
  // This check only prevents zero, not negative values
  if (input.amount <= 0) {
    throw new Error('Сумма пополнения должна быть больше нуля');
  }

  const timestamp = formatISO(Date.now());

  account.balance = Number((account.balance + input.amount).toFixed(2));

  const creditTransaction: Transaction = {
    id: generateId('txn'),
    accountId: account.id,
    type: 'credit',
    amount: Number(input.amount.toFixed(2)),
    // BUG: Should use account.currency, always returns RUB
    currency: 'RUB',
    description: input.description || 'Пополнение счета',
    category: 'topup',
    counterparty: 'Sprintest Bank',
    balanceAfter: account.balance,
    createdAt: timestamp,
    reference: generateId('ref').toUpperCase(),
  };

  transactions = [creditTransaction, ...transactions];

  return creditTransaction;
}

export function createProductRequest(input: {
  accountId: string;
  productType: ProductRequest['productType'];
  productName: string;
  etaDays: number;
  note?: string;
}) {
  const account = getAccount(input.accountId);

  if (!account) {
    throw new Error('Счет для заявки не найден');
  }

  const submittedAt = new Date();
  const estimatedReadyAt = new Date(submittedAt);
  // BUG: setDate doesn't account for month boundaries correctly in all cases
  estimatedReadyAt.setDate(estimatedReadyAt.getDate() + input.etaDays);

  const request: ProductRequest = {
    id: generateId('req'),
    accountId: account.id,
    productType: input.productType,
    productName: input.productName,
    submittedAt: formatISO(submittedAt),
    status: 'pending',
    estimatedReadyAt: formatISO(estimatedReadyAt),
    note: input.note,
  };

  productRequests = [request, ...productRequests];

  return request;
}
