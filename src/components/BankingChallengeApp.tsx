import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Account,
  Card,
  ProductRequest,
  Recipient,
  Transaction,
} from "@/data/qa-banking";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card as UiCard,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRightLeft,
  CreditCard,
  FilePlus2,
  Loader2,
  PiggyBank,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const cardThemeClasses: Record<Card["theme"], string> = {
  emerald: "from-emerald-600 via-emerald-500 to-emerald-400",
  violet: "from-violet-600 via-violet-500 to-purple-400",
  amber: "from-amber-500 via-amber-400 to-orange-400",
};

const requestStatusStyles: Record<ProductRequest["status"], string> = {
  pending: "border-amber-200 bg-amber-100 text-amber-700",
  processing: "border-blue-200 bg-blue-100 text-blue-700",
  ready: "border-emerald-200 bg-emerald-100 text-emerald-700",
};

const requestStatusLabels: Record<ProductRequest["status"], string> = {
  pending: "На рассмотрении",
  processing: "В работе",
  ready: "Готово к выдаче",
};

type TransferFormState = {
  toAccountNumber: string;
  amount: string;
  description: string;
};

type ActionType = "transfer" | "topup" | "request";

type ProductOffer = {
  id: string;
  productType: ProductRequest["productType"];
  name: string;
  description: string;
  etaDays: number;
  perks: string[];
};

const productOffers: ProductOffer[] = [
  {
    id: "card-black-metal",
    productType: "card",
    name: "Sprintest Black Metal",
    description:
      "Премиальная металлическая карта с кешбэком и консьерж-сервисом.",
    etaDays: 9,
    perks: ["Кешбэк до 5%", "Страховка путешественника", "Консьерж 24/7"],
  },
  {
    id: "card-digital-travel",
    productType: "card",
    name: "Sprintest Travel Digital",
    description: "Виртуальная карта с милями и защитой для онлайн-платежей.",
    etaDays: 2,
    perks: ["Начисление миль", "Виртуальная выдача", "0% за рубежом"],
  },
  {
    id: "account-business-one",
    productType: "account",
    name: "Расчетный счет Business One",
    description:
      "Быстрый старт для ИП и малого бизнеса с фиксированной комиссией.",
    etaDays: 3,
    perks: [
      "Бесплатные переводы внутри Sprintest",
      "Интеграция с 1С",
      "Лимит до 5 млн ₽",
    ],
  },
];

const formatCurrency = (value: number, currency: Account["currency"]) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (value: string) =>
  // BUG: Missing year in date format, can cause confusion for older transactions
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatCardNumber = (value: string) =>
  // BUG: Card formatting adds extra space at the end
  value
    .replace(/\s+/g, "")
    .replace(/(\d{4})/g, "$1 ");

const formatCardExpiry = (iso: string) => {
  const date = new Date(iso);
  // BUG: getMonth() returns 0-11, adding 1 is correct but getDate() returns day not month
  const month = `${date.getDate()}`.padStart(2, "0");
  const year = `${date.getFullYear()}`.slice(-2);
  return `${month}/${year}`;
};

const accountTypeLabel: Record<Account["type"], string> = {
  checking: "Расчетный",
  savings: "Накопительный",
  credit: "Кредитный",
};

const accountStatusBadge: Record<Account["status"], string> = {
  active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  inactive: "bg-muted text-muted-foreground border-muted-foreground/20",
  frozen: "bg-amber-500/10 text-amber-500 border-amber-500/30",
};

const parseAmount = (value: string) => {
  // BUG: Only replaces first comma, should use replaceAll or regex with g flag
  const normalized = value.replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : NaN;
};

export function BankingChallengeApp() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [requests, setRequests] = useState<ProductRequest[]>([]);

  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  const [activeSheet, setActiveSheet] = useState<ActionType | null>(null);
  const isSheetOpen = activeSheet !== null;

  const [transferForm, setTransferForm] = useState<TransferFormState>({
    toAccountNumber: "",
    amount: "",
    description: "",
  });
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const [isTransferSubmitting, setIsTransferSubmitting] = useState(false);

  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpNote, setTopUpNote] = useState("");
  const [topUpError, setTopUpError] = useState<string | null>(null);
  const [topUpSuccess, setTopUpSuccess] = useState<string | null>(null);
  const [isTopUpSubmitting, setIsTopUpSubmitting] = useState(false);

  const [requestOfferId, setRequestOfferId] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [isRequestSubmitting, setIsRequestSubmitting] = useState(false);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId],
  );

  const selectedOffer = useMemo(
    () => productOffers.find((offer) => offer.id === requestOfferId) ?? null,
    [requestOfferId],
  );

  const { ownAccountRecipients, externalRecipients } = useMemo(() => {
    const accountNumbers = new Set(
      accounts.map((account) => account.accountNumber),
    );
    const own = recipients.filter((recipient) =>
      accountNumbers.has(recipient.accountNumber),
    );
    const external = recipients.filter(
      (recipient) => !accountNumbers.has(recipient.accountNumber),
    );

    return { ownAccountRecipients: own, externalRecipients: external };
  }, [accounts, recipients]);

  const availableOwnRecipients = useMemo(
    () =>
      selectedAccount
        ? ownAccountRecipients.filter(
            (recipient) =>
              recipient.accountNumber !== selectedAccount.accountNumber,
          )
        : ownAccountRecipients,
    [ownAccountRecipients, selectedAccount],
  );

  const calculateCommission = useCallback(
    (amount: number, toAccountNumber: string) => {
      if (!selectedAccount || !Number.isFinite(amount) || amount <= 0) {
        return 0;
      }

      const internalAccount = accounts.find(
        (account) => account.accountNumber === toAccountNumber.trim(),
      );
      if (internalAccount) {
        return 0;
      }

      const rate = 0.0075;
      const min = 45;
      return Number(Math.max(amount * rate, min).toFixed(2));
    },
    [accounts, selectedAccount],
  );

  const commissionPreview = useMemo(() => {
    const amount = parseAmount(transferForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return 0;
    }
    return calculateCommission(amount, transferForm.toAccountNumber);
  }, [calculateCommission, transferForm.amount, transferForm.toAccountNumber]);

  const usedLimit = useMemo(() => {
    if (!selectedAccount) return 0;
    const today = new Date().toISOString().slice(0, 10);
    // BUG: Should also include 'fee' category in daily limit calculation
    const todaysTransfers = transactions.filter(
      (transaction) =>
        transaction.type === "debit" &&
        transaction.category === "transfer" &&
        transaction.createdAt.startsWith(today),
    );
    return todaysTransfers.reduce(
      (total, transaction) => total + transaction.amount,
      0,
    );
  }, [selectedAccount, transactions]);

  const limitUsagePercent = useMemo(() => {
    if (!selectedAccount || selectedAccount.dailyTransferLimit <= 0) {
      return 0;
    }

    const ratio = (usedLimit / selectedAccount.dailyTransferLimit) * 100;
    return Math.min(100, Number(ratio.toFixed(2)));
  }, [selectedAccount, usedLimit]);

  const remainingLimit = useMemo(() => {
    if (!selectedAccount) return 0;
    return Math.max(selectedAccount.dailyTransferLimit - usedLimit, 0);
  }, [selectedAccount, usedLimit]);

  useEffect(() => {
    const loadAccounts = async () => {
      setIsLoadingAccounts(true);
      try {
        const response = await fetch("/api/qa-banking/accounts", {
          cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Не удалось загрузить счета");
        }
        setAccounts(payload.data ?? []);
        if (payload.data?.length) {
          setSelectedAccountId((current) => current ?? payload.data[0].id);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    loadAccounts();
  }, []);

  useEffect(() => {
    const loadRecipients = async () => {
      try {
        const response = await fetch("/api/qa-banking/recipients", {
          cache: "no-store",
        });
        const payload = await response.json();
        if (response.ok) {
          setRecipients(payload.data ?? []);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadRecipients();
  }, []);

  useEffect(() => {
    if (!selectedAccountId) {
      setTransactions([]);
      setCards([]);
      setRequests([]);
      return;
    }

    const loadAccountContext = async () => {
      setIsLoadingTransactions(true);
      setIsLoadingCards(true);
      setIsLoadingRequests(true);
      try {
        const [transactionsResponse, cardsResponse, requestsResponse] =
          await Promise.all([
            fetch(
              `/api/qa-banking/accounts/${selectedAccountId}/transactions?limit=12`,
              {
                cache: "no-store",
              },
            ),
            fetch(`/api/qa-banking/cards?accountId=${selectedAccountId}`, {
              cache: "no-store",
            }),
            fetch(`/api/qa-banking/requests?accountId=${selectedAccountId}`, {
              cache: "no-store",
            }),
          ]);

        const transactionsPayload = await transactionsResponse.json();
        if (transactionsResponse.ok) {
          setTransactions(transactionsPayload.data ?? []);
        }

        const cardsPayload = await cardsResponse.json();
        if (cardsResponse.ok) {
          setCards(cardsPayload.data ?? []);
        }

        const requestsPayload = await requestsResponse.json();
        if (requestsResponse.ok) {
          setRequests(requestsPayload.data ?? []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingTransactions(false);
        setIsLoadingCards(false);
        setIsLoadingRequests(false);
      }
    };

    loadAccountContext();
  }, [selectedAccountId]);

  const handleCloseSheet = () => {
    setActiveSheet(null);
    // Reset all form states when closing
    setTransferForm({ toAccountNumber: "", amount: "", description: "" });
    setTransferError(null);
    setTransferSuccess(null);
    setTopUpAmount("");
    setTopUpNote("");
    setTopUpError(null);
    setTopUpSuccess(null);
    setRequestOfferId("");
    setRequestNote("");
    setRequestError(null);
    setRequestSuccess(null);
  };

  const refreshAccountData = async (accountId: string) => {
    try {
      const [
        accountsResponse,
        transactionsResponse,
        recipientsResponse,
        cardsResponse,
        requestsResponse,
      ] = await Promise.all([
        fetch("/api/qa-banking/accounts", { cache: "no-store" }),
        fetch(`/api/qa-banking/accounts/${accountId}/transactions?limit=12`, {
          cache: "no-store",
        }),
        fetch("/api/qa-banking/recipients", { cache: "no-store" }),
        fetch(`/api/qa-banking/cards?accountId=${accountId}`, {
          cache: "no-store",
        }),
        fetch(`/api/qa-banking/requests?accountId=${accountId}`, {
          cache: "no-store",
        }),
      ]);

      const updatedAccounts = await accountsResponse.json();
      if (accountsResponse.ok) {
        setAccounts(updatedAccounts.data ?? []);
      }

      const updatedTransactions = await transactionsResponse.json();
      if (transactionsResponse.ok) {
        setTransactions(updatedTransactions.data ?? []);
      }

      const updatedRecipients = await recipientsResponse.json();
      if (recipientsResponse.ok) {
        setRecipients(updatedRecipients.data ?? []);
      }

      const updatedCards = await cardsResponse.json();
      if (cardsResponse.ok) {
        setCards(updatedCards.data ?? []);
      }

      const updatedRequests = await requestsResponse.json();
      if (requestsResponse.ok) {
        setRequests(updatedRequests.data ?? []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectRecipient = (recipient: Recipient) => {
    const isOwnAccount = accounts.some(
      (account) => account.accountNumber === recipient.accountNumber,
    );
    setTransferForm((prev) => ({
      ...prev,
      toAccountNumber: recipient.accountNumber,
      description:
        prev.description ||
        (isOwnAccount
          ? `Перевод между своими счетами: ${recipient.name}`
          : `Перевод для ${recipient.name}`),
    }));
  };

  const handleTransfer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAccount) {
      setTransferError("Выберите счет отправителя");
      return;
    }

    const amount = parseAmount(transferForm.amount);
    // BUG: Should check if amount exceeds remaining daily limit before API call
    if (!Number.isFinite(amount) || amount <= 0) {
      setTransferError("Введите корректную сумму перевода");
      return;
    }

    setIsTransferSubmitting(true);
    setTransferError(null);
    setTransferSuccess(null);

    try {
      const response = await fetch("/api/qa-banking/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAccountId: selectedAccount.id,
          toAccountNumber: transferForm.toAccountNumber.trim(),
          amount,
          description: transferForm.description.trim() || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Не удалось выполнить перевод");
      }

      const commission = Number(payload?.data?.commission ?? 0);
      if (commission > 0) {
        setTransferSuccess(
          `Перевод выполнен. Комиссия ${formatCurrency(commission, selectedAccount.currency)} удержана банком.`,
        );
      } else {
        setTransferSuccess("Перевод внутри банка выполнен без комиссии.");
      }

      await refreshAccountData(selectedAccount.id);
    } catch (error) {
      setTransferError(
        error instanceof Error ? error.message : "Неизвестная ошибка",
      );
    } finally {
      setIsTransferSubmitting(false);
    }
  };

  const handleTopUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAccount) {
      setTopUpError("Выберите счет для пополнения");
      return;
    }

    const amount = parseAmount(topUpAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setTopUpError("Введите корректную сумму пополнения");
      return;
    }

    setIsTopUpSubmitting(true);
    setTopUpError(null);
    setTopUpSuccess(null);

    try {
      const response = await fetch("/api/qa-banking/topups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccount.id,
          amount,
          description: topUpNote.trim() || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Не удалось выполнить пополнение");
      }

      setTopUpSuccess("Пополнение успешно зачислено.");
      // BUG: Form not cleared after successful topup
      await refreshAccountData(selectedAccount.id);
    } catch (error) {
      setTopUpError(
        error instanceof Error ? error.message : "Неизвестная ошибка",
      );
    } finally {
      setIsTopUpSubmitting(false);
    }
  };

  const handleRequestSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!selectedAccount) {
      setRequestError("Выберите счет для подачи заявки");
      return;
    }

    if (!selectedOffer) {
      setRequestError("Выберите продукт из списка предложений");
      return;
    }

    setIsRequestSubmitting(true);
    setRequestError(null);
    setRequestSuccess(null);

    try {
      const response = await fetch("/api/qa-banking/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccount.id,
          productType: selectedOffer.productType,
          productName: selectedOffer.name,
          etaDays: selectedOffer.etaDays,
          note: requestNote.trim() || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Не удалось оформить заявку");
      }

      setRequestSuccess(
        `Заявка отправлена. Ожидаемая готовность: ${new Date(payload.data.estimatedReadyAt).toLocaleDateString("ru-RU")}.`,
      );
      await refreshAccountData(selectedAccount.id);
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "Неизвестная ошибка",
      );
    } finally {
      setIsRequestSubmitting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border bg-card shadow-xl">
      <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-r bg-muted/30 p-6 lg:border-b-0">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Счета</h2>
                <Badge
                  variant="outline"
                  className="border-primary/30 text-primary"
                >
                  {accounts.length}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Переключайтесь между счетами, чтобы видеть релевантные операции.
              </p>
            </div>

            <div className="space-y-3">
              {isLoadingAccounts ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-16 animate-pulse rounded-xl bg-muted"
                    />
                  ))}
                </div>
              ) : (
                accounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => setSelectedAccountId(account.id)}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-all hover:border-primary/60 hover:bg-background",
                      selectedAccountId === account.id
                        ? "border-primary bg-background shadow-lg"
                        : "border-border bg-card/70",
                    )}
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                      <span>{accountTypeLabel[account.type]}</span>
                      <span className="font-mono">
                        ••{account.accountNumber.slice(-4)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <p className="text-2xl font-semibold">
                        {formatCurrency(account.balance, account.currency)}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border",
                          accountStatusBadge[account.status],
                        )}
                      >
                        {account.status === "active"
                          ? "Активен"
                          : account.status === "frozen"
                            ? "Заморожен"
                            : "Неактивен"}
                      </Badge>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">
                Быстрые действия
              </h3>
              <div className="mt-3 grid gap-3">
                <Button
                  variant="secondary"
                  className="justify-start gap-3"
                  onClick={() => setActiveSheet("transfer")}
                >
                  <ArrowRightLeft className="h-4 w-4" /> Перевод средств
                </Button>
                <Button
                  variant="secondary"
                  className="justify-start gap-3"
                  onClick={() => setActiveSheet("topup")}
                >
                  <PiggyBank className="h-4 w-4" /> Пополнить счет
                </Button>
                <Button
                  variant="secondary"
                  className="justify-start gap-3"
                  onClick={() => setActiveSheet("request")}
                >
                  <FilePlus2 className="h-4 w-4" /> Оставить заявку
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">
                Сохраненные получатели
              </h3>
              <div className="mt-3 space-y-2">
                {recipients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Получатели появятся после выполнения первых переводов.
                  </p>
                ) : (
                  recipients.slice(0, 5).map((recipient) => {
                    const isOwnAccount = accounts.some(
                      (account) =>
                        account.accountNumber === recipient.accountNumber,
                    );

                    return (
                      <div
                        key={recipient.id}
                        className="rounded-xl border border-dashed border-muted-foreground/20 p-3"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{recipient.name}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "border-muted-foreground/30 text-muted-foreground",
                              isOwnAccount && "border-primary/40 text-primary",
                            )}
                          >
                            {isOwnAccount
                              ? "Мой счет"
                              : recipient.type === "internal"
                                ? "Внутри банка"
                                : "Межбанк"}
                          </Badge>
                        </div>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {recipient.accountNumber}
                        </p>
                        {isOwnAccount && (
                          <p className="mt-1 text-xs font-medium text-primary/80">
                            Собственный счет Sprintest
                          </p>
                        )}
                        {recipient.lastPaymentAt && (
                          <p className="mt-1 text-xs text-muted-foreground/80">
                            Последний платеж:{" "}
                            {formatDate(recipient.lastPaymentAt)}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </aside>

        <main className="space-y-6 p-6 lg:p-8">
          {selectedAccount ? (
            <div className="space-y-6">
              <UiCard className="border-primary/20 bg-linear-to-br from-background via-background to-primary/10">
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <CardTitle className="text-2xl font-semibold">
                      {selectedAccount.holderName}
                    </CardTitle>
                    <CardDescription>
                      {accountTypeLabel[selectedAccount.type]} •{" "}
                      {selectedAccount.accountNumber}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-right">
                    <span className="text-sm text-muted-foreground">
                      Текущий баланс
                    </span>
                    <span className="text-3xl font-semibold">
                      {formatCurrency(
                        selectedAccount.balance,
                        selectedAccount.currency,
                      )}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-primary/20 p-4">
                    <p className="text-sm text-muted-foreground">
                      Дневной лимит переводов
                    </p>
                    <p className="mt-2 text-xl font-semibold">
                      {formatCurrency(
                        selectedAccount.dailyTransferLimit,
                        selectedAccount.currency,
                      )}
                    </p>
                    <div className="mt-3">
                      <Progress value={limitUsagePercent} className="h-2" />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Использовано сегодня:{" "}
                        {formatCurrency(usedLimit, selectedAccount.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Осталось:{" "}
                        {formatCurrency(
                          remainingLimit,
                          selectedAccount.currency,
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-primary/20 p-4">
                    <p className="text-sm text-muted-foreground">
                      Статус обслуживания
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-xl font-semibold">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      Премиум сопровождение
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Используйте API и UI, чтобы проверить корректность
                      статусов и тарифов.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-primary/20 p-4">
                    <p className="text-sm text-muted-foreground">QA-инсайт</p>
                    <p className="mt-2 flex items-center gap-2 text-xl font-semibold">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Проверка комиссий
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Внешние переводы теперь удерживают комиссию. Сравните
                      итоги UI и ответов REST.
                    </p>
                  </div>
                </CardContent>
              </UiCard>

              <div className="grid gap-4 xl:grid-cols-3">
                <UiCard className="xl:col-span-2">
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Карты Sprintest</CardTitle>
                      <CardDescription>
                        Управляйте пластиковыми и цифровыми картами,
                        выпускаемыми к выбранному счету.
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveSheet("request")}
                    >
                      Запросить карту
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingCards ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {Array.from({ length: 2 }).map((_, index) => (
                          <div
                            key={index}
                            className="h-40 animate-pulse rounded-3xl bg-muted"
                          />
                        ))}
                      </div>
                    ) : cards.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-muted-foreground/30 p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          Для этого счета еще не выпущено карт. Оформите первую
                          заявку, чтобы протестировать процесс.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {cards.map((card) => (
                          <div
                            key={card.id}
                            className={cn(
                              "relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br p-6 text-white shadow-lg",
                              cardThemeClasses[card.theme],
                            )}
                          >
                            <div className="flex items-center justify-between text-sm uppercase tracking-wide">
                              <span>{card.brand}</span>
                              <Badge
                                variant="outline"
                                className="border-white/40 bg-white/10 text-white"
                              >
                                {card.variant === "credit"
                                  ? "Кредитная"
                                  : card.variant === "virtual"
                                    ? "Виртуальная"
                                    : "Дебетовая"}
                              </Badge>
                            </div>
                            <p className="mt-6 text-xl font-medium tracking-widest">
                              {formatCardNumber(card.number)}
                            </p>
                            <div className="mt-6 flex items-end justify-between text-sm">
                              <div>
                                <p className="text-xs uppercase text-white/70">
                                  Держатель
                                </p>
                                <p className="font-semibold">
                                  {card.holderName}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs uppercase text-white/70">
                                  Действует до
                                </p>
                                <p className="font-semibold">
                                  {formatCardExpiry(card.expiresAt)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-xs text-white/80">
                              <span>
                                Лимит{" "}
                                {formatCurrency(
                                  card.spendingLimit,
                                  selectedAccount.currency,
                                )}
                              </span>
                              <span>
                                {card.status === "active"
                                  ? "Активна"
                                  : "Ограничена"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </UiCard>

                <UiCard>
                  <CardHeader>
                    <CardTitle>Заявки на продукты</CardTitle>
                    <CardDescription>
                      Следите за статусом выпусков карт и открытием счетов в
                      режиме реального времени.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingRequests ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div
                            key={index}
                            className="h-14 animate-pulse rounded-xl bg-muted"
                          />
                        ))}
                      </div>
                    ) : requests.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-muted-foreground/30 p-4 text-sm text-muted-foreground">
                        Нет активных заявок. Создайте новую, чтобы проверить
                        цепочку уведомлений.
                      </div>
                    ) : (
                      requests.slice(0, 4).map((request) => (
                        <div
                          key={request.id}
                          className="rounded-xl border border-muted-foreground/20 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{request.productName}</p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "border",
                                requestStatusStyles[request.status],
                              )}
                            >
                              {requestStatusLabels[request.status]}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Отправлена: {formatDate(request.submittedAt)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Готовность:{" "}
                            {new Date(
                              request.estimatedReadyAt,
                            ).toLocaleDateString("ru-RU")}
                          </p>
                          {request.note && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Комментарий: {request.note}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="secondary"
                      className="w-full justify-center gap-2"
                      onClick={() => setActiveSheet("request")}
                    >
                      <CreditCard className="h-4 w-4" />
                      Оформить новый продукт
                    </Button>
                  </CardFooter>
                </UiCard>
              </div>

              <UiCard>
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>История операций</CardTitle>
                    <CardDescription>
                      Последние транзакции по выбранному счету
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-muted-foreground/30 text-muted-foreground"
                  >
                    Показано {transactions.length} операций
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingTransactions ? (
                    <div className="space-y-3">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div
                          key={index}
                          className="h-12 animate-pulse rounded-xl bg-muted"
                        />
                      ))}
                    </div>
                  ) : transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      История пока пуста. Создайте перевод или пополнение, чтобы
                      увидеть движение средств.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between rounded-xl border border-muted-foreground/15 bg-card/60 p-4"
                        >
                          <div>
                            <p className="font-medium">
                              {transaction.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(transaction.createdAt)} •{" "}
                              {transaction.counterparty}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={cn(
                                "font-semibold",
                                transaction.type === "credit"
                                  ? "text-emerald-500"
                                  : "text-destructive",
                              )}
                            >
                              {transaction.type === "credit" ? "+" : "-"}
                              {formatCurrency(
                                transaction.amount,
                                transaction.currency,
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Баланс:{" "}
                              {formatCurrency(
                                transaction.balanceAfter,
                                transaction.currency,
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </UiCard>
            </div>
          ) : (
            <UiCard>
              <CardHeader>
                <CardTitle>Выберите счет, чтобы начать</CardTitle>
                <CardDescription>
                  Слева отображается список доступных счетов. После выбора
                  загрузится их история и продукты.
                </CardDescription>
              </CardHeader>
            </UiCard>
          )}
        </main>
      </div>

      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => !open && handleCloseSheet()}
      >
        <SheetContent side="right" className="w-full max-w-xl overflow-y-auto">
          {activeSheet === "transfer" && (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle>Новый перевод</SheetTitle>
                <SheetDescription>
                  Заполните данные получателя и сумму. Внешние переводы
                  облагаются комиссией, отображаемой ниже.
                </SheetDescription>
              </SheetHeader>
              <form className="space-y-4" onSubmit={handleTransfer}>
                {transferError && (
                  <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {transferError}
                  </p>
                )}
                {transferSuccess && (
                  <p className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-600">
                    {transferSuccess}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="transfer-to">Счет получателя</Label>
                  <Input
                    id="transfer-to"
                    value={transferForm.toAccountNumber}
                    onChange={(event) =>
                      setTransferForm((prev) => ({
                        ...prev,
                        toAccountNumber: event.target.value,
                      }))
                    }
                    placeholder="4070••••"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transfer-amount">Сумма перевода</Label>
                  <Input
                    id="transfer-amount"
                    value={transferForm.amount}
                    onChange={(event) =>
                      setTransferForm((prev) => ({
                        ...prev,
                        amount: event.target.value,
                      }))
                    }
                    placeholder="15000"
                    inputMode="decimal"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transfer-description">Комментарий</Label>
                  <Input
                    id="transfer-description"
                    value={transferForm.description}
                    onChange={(event) =>
                      setTransferForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Оплата услуг"
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Подставить получателя</p>
                  {availableOwnRecipients.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Мои счета
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {availableOwnRecipients.map((recipient) => (
                          <Button
                            key={recipient.id}
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSelectRecipient(recipient)}
                          >
                            {recipient.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  {externalRecipients.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Сохраненные контрагенты
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {externalRecipients.map((recipient) => (
                          <Button
                            key={recipient.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectRecipient(recipient)}
                          >
                            {recipient.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  {availableOwnRecipients.length === 0 &&
                    externalRecipients.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Список появится после создания первого перевода.
                      </p>
                    )}
                </div>
                <div className="rounded-xl border border-muted-foreground/20 bg-muted/30 p-4 text-sm">
                  <p>
                    Комиссия:{" "}
                    <strong>
                      {formatCurrency(
                        commissionPreview,
                        selectedAccount?.currency ?? "RUB",
                      )}
                    </strong>
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Внутренние переводы между счетами Sprintest выполняются без
                    комиссии.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isTransferSubmitting}
                >
                  {isTransferSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Выполняем
                      перевод
                    </span>
                  ) : (
                    "Отправить перевод"
                  )}
                </Button>
              </form>
            </div>
          )}

          {activeSheet === "topup" && (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle>Пополнение счета</SheetTitle>
                <SheetDescription>
                  Внесите средства на текущий счет. Используйте разные суммы,
                  чтобы проверить обновление баланса.
                </SheetDescription>
              </SheetHeader>
              <form className="space-y-4" onSubmit={handleTopUp}>
                {topUpError && (
                  <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {topUpError}
                  </p>
                )}
                {topUpSuccess && (
                  <p className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-600">
                    {topUpSuccess}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="topup-amount">Сумма пополнения (₽)</Label>
                  <Input
                    id="topup-amount"
                    value={topUpAmount}
                    onChange={(event) => setTopUpAmount(event.target.value)}
                    placeholder="3000"
                    inputMode="decimal"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topup-note">Комментарий</Label>
                  <Input
                    id="topup-note"
                    value={topUpNote}
                    onChange={(event) => setTopUpNote(event.target.value)}
                    placeholder="Возврат командных расходов"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isTopUpSubmitting}
                >
                  {isTopUpSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Обрабатываем
                      пополнение
                    </span>
                  ) : (
                    "Пополнить счет"
                  )}
                </Button>
              </form>
            </div>
          )}

          {activeSheet === "request" && (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle>Новая заявка</SheetTitle>
                <SheetDescription>
                  Выберите продукт Sprintest Bank и отправьте заявку, чтобы
                  отследить ее статус на главном экране.
                </SheetDescription>
              </SheetHeader>
              <form className="space-y-4" onSubmit={handleRequestSubmit}>
                {requestError && (
                  <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {requestError}
                  </p>
                )}
                {requestSuccess && (
                  <p className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-600">
                    {requestSuccess}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="product-offer">Предложение</Label>
                  <select
                    id="product-offer"
                    value={requestOfferId}
                    onChange={(event) => setRequestOfferId(event.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="" disabled>
                      Выберите продукт
                    </option>
                    {productOffers.map((offer) => (
                      <option key={offer.id} value={offer.id}>
                        {offer.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedOffer && (
                  <div className="rounded-xl border border-muted-foreground/20 bg-muted/30 p-4 text-sm">
                    <p className="font-medium">{selectedOffer.name}</p>
                    <p className="mt-1 text-muted-foreground">
                      {selectedOffer.description}
                    </p>
                    <ul className="mt-3 space-y-1 text-muted-foreground">
                      {selectedOffer.perks.map((perk) => (
                        <li key={perk}>• {perk}</li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Ориентировочный срок выпуска: {selectedOffer.etaDays} дн.
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="request-note">
                    Комментарий (необязательно)
                  </Label>
                  <Input
                    id="request-note"
                    value={requestNote}
                    onChange={(event) => setRequestNote(event.target.value)}
                    placeholder="Укажите причину открытия продукта"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isRequestSubmitting}
                >
                  {isRequestSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Отправляем
                      заявку
                    </span>
                  ) : (
                    "Оформить заявку"
                  )}
                </Button>
              </form>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
