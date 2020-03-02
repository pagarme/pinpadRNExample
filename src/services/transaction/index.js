async function createTransaction(payload) {
  const request = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  };

  // eslint-disable-next-line no-undef
  return fetch('https://api.pagar.me/1/transactions', request)
    .then((res) => res.json());
}

export default {
  createTransaction,
};
