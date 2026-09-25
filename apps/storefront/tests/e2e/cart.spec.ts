import { expect, test } from "@playwright/test";

test("гостьовий кошик зберігається після оновлення сторінки", async ({
  page,
  context,
}) => {
  const response = await page.goto("/products/polonyna-trek");

  expect(response?.status()).toBe(200);

  await expect(
    page.getByRole("heading", {
      name: "Полонина Trek",
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByText("Кошик порожній.", { exact: true }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Додати в кошик", exact: true })
    .click();

  const orderCode = page.getByText(/^Код замовлення:/);
  const quantity = page.getByText(/^Кількість товарів:/);
  const total = page.getByText(/^Сума:/);

  await expect(orderCode).toHaveText(/^Код замовлення:\s*\S+$/);
  await expect(quantity).toHaveText(/^Кількість товарів:\s*1$/);

  const expectedTotal = /^Сума:\s*8\s?099[,.]10\s*(?:₴|грн\.?|UAH)$/;
  await expect(total).toHaveText(expectedTotal);

  const codeBeforeReload = await orderCode.innerText();

  const cookie = (await context.cookies(page.url())).find(
    (item) => item.name === "karpaty-gear-session",
  );

  expect(
    cookie
      ? {
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite,
          path: cookie.path,
        }
      : null,
  ).toEqual({
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
  });

  const reloadResponse = await page.reload();

  expect(reloadResponse?.status()).toBe(200);
  await expect(orderCode).toHaveText(codeBeforeReload);
  await expect(quantity).toHaveText(/^Кількість товарів:\s*1$/);
  await expect(total).toHaveText(expectedTotal);
});

test("різні браузерні сесії мають окремі кошики", async ({
  page,
  browser,
  baseURL,
}) => {
  await page.goto("/products/polonyna-trek");

  await expect(
    page.getByText("Кошик порожній.", { exact: true }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Додати в кошик", exact: true })
    .click();

  const firstCode = page.getByText(/^Код замовлення:/);

  await expect(firstCode).toHaveText(/^Код замовлення:\s*\S+$/);
  await expect(page.getByText(/^Кількість товарів:/)).toHaveText(
    /^Кількість товарів:\s*1$/,
  );

  const firstCodeText = await firstCode.innerText();

  const secondContext = await browser.newContext({ baseURL });

  try {
    const secondPage = await secondContext.newPage();

    await secondPage.goto("/products/polonyna-trek");

    await expect(
      secondPage.getByText("Кошик порожній.", { exact: true }),
    ).toBeVisible();

    const secondButton = secondPage.getByRole("button", {
      name: "Додати в кошик",
      exact: true,
    });

    const secondQuantity = secondPage.getByText(/^Кількість товарів:/);
    const secondCode = secondPage.getByText(/^Код замовлення:/);

    await secondButton.click();
    await expect(secondQuantity).toHaveText(/^Кількість товарів:\s*1$/);
    await expect(secondCode).toHaveText(/^Код замовлення:\s*\S+$/);
    await expect(secondCode).not.toHaveText(firstCodeText);
    await secondButton.click();
    await expect(secondQuantity).toHaveText(/^Кількість товарів:\s*2$/);

    await page.reload();
    await expect(firstCode).toHaveText(firstCodeText);
    await expect(page.getByText(/^Кількість товарів:/)).toHaveText(
      /^Кількість товарів:\s*1$/,
    );
  } finally {
    await secondContext.close();
  }
});

test("неіснуючий variant ID не змінює кошик", async ({ page }) => {
  await page.goto("/products/polonyna-trek");

  await expect(
    page.getByText("Кошик порожній.", { exact: true }),
  ).toBeVisible();

  const button = page.getByRole("button", {
    name: "Додати в кошик",
    exact: true,
  });

  await button.click();

  const orderCode = page.getByText(/^Код замовлення:/);
  const quantity = page.getByText(/^Кількість товарів:/);
  const total = page.getByText(/^Сума:/);

  await expect(orderCode).toHaveText(/^Код замовлення:\s*\S+$/);
  await expect(quantity).toHaveText(/^Кількість товарів:\s*1$/);

  const expectedTotal = /^Сума:\s*8\s?099[,.]10\s*(?:₴|грн\.?|UAH)$/;
  await expect(total).toHaveText(expectedTotal);

  const originalCode = await orderCode.innerText();

  const variantInput = page.locator('input[name="productVariantId"]');

  await variantInput.evaluate((element) => {
    (element as HTMLInputElement).value = "999999999";
  });

  await expect(variantInput).toHaveValue("999999999");
  await button.click();

  await expect(
    page.getByText(/^Не вдалося (?:додати товар|підтвердити додавання)\./),
  ).toBeVisible();

  await expect(
    page.getByText("Товар додано в кошик!", { exact: true }),
  ).toBeHidden();

  const response = await page.reload();

  expect(response?.status()).toBe(200);
  await expect(orderCode).toHaveText(originalCode);
  await expect(quantity).toHaveText(/^Кількість товарів:\s*1$/);
  await expect(total).toHaveText(expectedTotal);
});
