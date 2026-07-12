const { MercadoPagoConfig, Preference } = require('mercadopago');

const mpAccessToken = process.env.MP_ACCESS_TOKEN || "APP_USR-3914856003223019-111111-9a7c6f059bb29c0a4e76cd2d2a417539-111111111"; // Add valid one if needed
const client = new MercadoPagoConfig({ accessToken: mpAccessToken, options: { timeout: 5000 } });
const preference = new Preference(client);

async function test() {
  try {
    const response = await preference.create({
      body: {
        items: [{ id: "123", title: "Membresía BLACK Fim", quantity: 1, unit_price: 39990, currency_id: 'CLP' }],
        payer: { email: "conductor@test.com" },
        back_urls: {
          success: `http://localhost:3000/driver/membership-success?plan=BLACK`,
          failure: `http://localhost:3000/driver/membership-failure`,
          pending: `http://localhost:3000/driver/membership-pending`,
        },
        auto_return: 'approved',
        notification_url: `http://localhost:3001/payments/membership-webhook`,
        external_reference: `123|BLACK`,
      }
    });
    console.log("SUCCESS", response.init_point);
  } catch (err) {
    console.error("ERROR", err.message);
    if (err.cause) console.error("CAUSE", err.cause);
    if (err.response) console.error("RESPONSE", JSON.stringify(err.response, null, 2));
  }
}

test();
