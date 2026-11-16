const createDepositTracker =(depositRate: number)=> {
    let prices = [] as number[];
    let count = 0;

    return {
        add: (price: number | null | undefined) => {
            if (typeof price !== "number" || price < 0 || Number.isNaN(price)) {
                throw new Error("Invalid price. Please enter a non-negative number.");
            }
            prices.push(price);
            const bookPrice = price * depositRate;
            count++;
            return bookPrice;
        },
        total: () => {
            return prices.reduce((sum, price) => sum + price * depositRate, 0);
        },
        count: () => {
            return count;
        }
    }

}

const rate = createDepositTracker(0.6);

console.log('Addition: ', rate.add(40));
console.log('Total: ', rate.total());
console.log('Count: ', rate.count());

console.log('Addition: ', rate.add(10));
console.log('Total: ', rate.total());
console.log('Count: ', rate.count());

for (const invalidPrice of [null, undefined, Number.NaN, -5]) {
    try {
        rate.add(invalidPrice);
    } catch (error) {
        console.log(
            `Caught expected error for ${invalidPrice}:`,
            error instanceof Error ? error.message : error
        );
    }
}
console.log('Total: ', rate.total());
console.log('Count: ', rate.count());

console.log('Addition: ', rate.add(0));
console.log('Total: ', rate.total());
console.log('Count: ', rate.count());

class BookingSummary {
    client: string;
    price: number;

    constructor(client: string, price: number) {
        this.client = client;
        this.price = price;
    }

    describe(): string {
        return `${this.client} - ${this.price}`;
    }
}

const summary = new BookingSummary('Ada', 120);
const fn = summary.describe;

// Detached methods lose their receiver, so `this` is undefined when fn() runs.
try {
    console.log(fn());
} catch (error) {
    console.log('Expected unbound-method error:', error instanceof Error ? error.message : error);
}