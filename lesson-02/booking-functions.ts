const calculateBalance = (price: number, deposit: number): number => {
  return price - deposit;
};

const calculateDeposit = (price: number, rate = 0.3): number => {
  return price * rate;
};

const totalDeposits = (...deposits: number[]): number => {
  const total = deposits.reduce((deposit, current) => deposit + current, 0);
  return total;
};

const formatBookingLabel = (bookingId: string, service?: string): string => {
  if (service === undefined) {
    return bookingId;
  }

  return `${bookingId}: ${service}`;
};

console.log(`Balance: ${calculateBalance(120, 40)}`);
console.log(`Default deposit: ${calculateDeposit(100)}`);
console.log(`Undefined rate deposit: ${calculateDeposit(100, undefined)}`);
console.log(`Custom rate deposit: ${calculateDeposit(100, 0.4)}`);
console.log(`Deposit total: ${totalDeposits(20, 30, 50)}`);
console.log(`Empty deposit total: ${totalDeposits()}`);
console.log(`Label with service: ${formatBookingLabel("bk_204", "Haircut")}`);
console.log(`Label without service: ${formatBookingLabel("bk_204")}`);
