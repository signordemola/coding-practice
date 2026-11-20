interface Booking {
  id: number;
  client: { name: string };
  price: number;
  depositPaid: number;
  status: "paid" | "pending" | "cancelled";
}

interface Rate {
  currency: "USD" | "EUR" | "GBP";
  fee: number;
}

const fetchBookings = (): Promise<Booking[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          client: { name: "John Doe" },
          price: 100,
          depositPaid: 50,
          status: "paid",
        },
        {
          id: 2,
          client: { name: "Jane Smith" },
          price: 200,
          depositPaid: 100,
          status: "pending",
        },
        {
          id: 3,
          client: { name: "Alice Becker" },
          price: 180,
          depositPaid: 75,
          status: "cancelled",
        },
        {
          id: 4,
          client: { name: "Dreq Johnson" },
          price: 150,
          depositPaid: 75,
          status: "cancelled",
        },
        {
          id: 5,
          client: { name: "Bruce Williams" },
          price: 220,
          depositPaid: 110,
          status: "pending",
        },
      ]);
    }, 300);
  });
};

const fetchRates = (): Promise<Rate> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ currency: "USD", fee: 0.03 });
    }, 300);
  });
};

const main = async () => {
  try {
    const [bookings, rates] = await Promise.all([
      fetchBookings(),
      fetchRates(),
    ]);
    const bookingsWithBalances = bookings
      .filter((booking) => booking.status !== "cancelled")
      .map((booking) => ({
        ...booking,
        balance: booking.price - booking.depositPaid,
      }));

    const totalBalance = bookingsWithBalances.reduce(
      (total, booking) => total + booking.balance,
      0,
    );
    console.log("Bookings with Balances:", bookingsWithBalances);

    console.log("Total Balance of Active Bookings:", totalBalance);

    // Spread shares the nested client, while structuredClone makes an independent copy.
    const shallowCopyBooking = { ...bookings[0] };
    if (shallowCopyBooking.client) {
      shallowCopyBooking.client.name = "Modified Name";
      console.log("Shallow Copy of First Booking:", shallowCopyBooking);
      console.log("Original First Booking After Modification:", bookings[0]);
    }

    const clone = structuredClone(bookings[0]);
    if (clone) {
      clone.client.name = "Another Modified Name";
      console.log("Cloned First Booking:", clone);
      console.log(
        "Original First Booking After Cloning Modification:",
        bookings[0],
      );
    }

    console.log("Bookings:", bookings);
    console.log("Rates:", rates);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

main();
