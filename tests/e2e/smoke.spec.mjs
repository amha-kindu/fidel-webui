import { expect, test } from "@playwright/test";

const corsHeaders = {
  "access-control-allow-origin": "http://127.0.0.1:3000",
  "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
  "access-control-allow-headers": "authorization,content-type,accept",
};

function buildChats(count = 12) {
  return Array.from({ length: count }).map((_, index) => {
    const number = index + 1;
    return {
      id: `chat-${number}`,
      title: `Chat ${String(number).padStart(2, "0")}`,
      last_message: `Last message for chat ${number}`,
      created_at: `2026-04-${String(number).padStart(2, "0")}T08:00:00.000Z`,
      updated_at: `2026-04-${String(number).padStart(2, "0")}T09:00:00.000Z`,
    };
  });
}

function buildMessages(chats) {
  return Object.fromEntries(
    chats.map((chat, index) => [
      chat.id,
      [
        {
          id: `user-${chat.id}-1`,
          role: "user",
          content: `Question for ${chat.title}`,
          created_at: `2026-04-${String(index + 1).padStart(2, "0")}T09:10:00.000Z`,
        },
        {
          id: `assistant-${chat.id}-1`,
          role: "assistant",
          content: `Answer for ${chat.title}`,
          created_at: `2026-04-${String(index + 1).padStart(2, "0")}T09:11:00.000Z`,
        },
      ],
    ])
  );
}

async function seedSession(page, user = { email: "jane@example.com", name: "Jane Doe" }) {
  await page.addInitScript((sessionUser) => {
    localStorage.setItem("auth_token", "test-token");
    localStorage.setItem("auth_user", JSON.stringify(sessionUser));
  }, user);
}

async function signIn(page, { email = "jane@example.com", password = "correct-password" } = {}) {
  await page.getByTestId("auth-email-input").fill(email);
  await page.getByTestId("auth-password-input").fill(password);
  await page.getByTestId("auth-submit-button").click();
}

function renderedMessage(page, text) {
  return page.getByTestId("message-content").getByText(text, { exact: true });
}

async function installApiRoutes(
  page,
  {
    loginStatus = 200,
    chats = buildChats(),
    messagesByChat = buildMessages(chats),
    user = { email: "jane@example.com", name: "Jane Doe" },
    streamDelayMs = 0,
    omitStreamMessageIds = false,
    delayStreamMessageIdUntilDone = false,
  } = {}
) {
  const state = {
    chats: [...chats].sort((left, right) => new Date(right.updated_at) - new Date(left.updated_at)),
    messagesByChat: structuredClone(messagesByChat),
    user,
    streamSequence: 0,
  };

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname, searchParams } = url;
    const method = request.method();

    if (method === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: corsHeaders,
        body: "",
      });
      return;
    }

    if (pathname.endsWith("/users/me") && method === "GET") {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: "application/json",
        body: JSON.stringify(state.user),
      });
      return;
    }

    if (pathname.endsWith("/auth/login") && method === "POST") {
      if (loginStatus !== 200) {
        await route.fulfill({
          status: loginStatus,
          headers: corsHeaders,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Invalid credentials" }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: "application/json",
        body: JSON.stringify({ access_token: "test-token" }),
      });
      return;
    }

    if (pathname.endsWith("/auth/register") && method === "POST") {
      await route.fulfill({
        status: 201,
        headers: corsHeaders,
        contentType: "application/json",
        body: JSON.stringify({ email: state.user.email }),
      });
      return;
    }

    if (pathname.endsWith("/chats") && method === "GET") {
      const limit = Number(searchParams.get("limit") || "10");
      const offset = Number(searchParams.get("offset") || "0");
      const items = state.chats.slice(offset, offset + limit);

      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: "application/json",
        body: JSON.stringify({
          items,
          total: state.chats.length,
        }),
      });
      return;
    }

    if (pathname.endsWith("/chats/stream") && method === "POST") {
      const body = request.postDataJSON();
      const existingChatId = searchParams.get("id");
      const chatId = existingChatId || "chat-new";
      const created = 1_714_300_000 + state.streamSequence * 10;
      state.streamSequence += 1;
      const title = state.chats.find((chat) => chat.id === chatId)?.title || "New chat";
      const reply = `Mock reply to: ${body.message}`;
      const userMessageId = `user-${chatId}-${created}`;
      const assistantMessageId = `assistant-${chatId}-${created}`;

      if (!existingChatId) {
        state.chats.unshift({
          id: chatId,
          title,
          last_message: reply,
          created_at: "2026-04-28T11:00:00.000Z",
          updated_at: "2026-04-28T11:01:00.000Z",
        });
      }

      state.messagesByChat[chatId] = [
        ...(state.messagesByChat[chatId] || []),
        {
          id: userMessageId,
          role: "user",
          content: body.message,
          created_at: "2026-04-28T11:00:00.000Z",
        },
        {
          id: assistantMessageId,
          role: "assistant",
          content: reply,
          created_at: "2026-04-28T11:01:00.000Z",
        },
      ];

      const chunks = [
        `data: ${JSON.stringify({
          ...(omitStreamMessageIds || delayStreamMessageIdUntilDone ? {} : { id: assistantMessageId }),
          created,
          choices: [{ delta: { role: "assistant", content: "Mock reply to: " } }],
          chat_info: { id: chatId, title },
          done: false,
        })}`,
        "",
        `data: ${JSON.stringify({
          ...(omitStreamMessageIds ? {} : { id: assistantMessageId }),
          created: created + 1,
          choices: [{ delta: { role: "assistant", content: body.message } }],
          chat_info: { id: chatId, title },
          done: true,
        })}`,
        "",
        "data: [DONE]",
        "",
      ].join("\n");

      if (streamDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, streamDelayMs));
      }

      await route.fulfill({
        status: 200,
        headers: {
          ...corsHeaders,
          "content-type": "text/event-stream",
        },
        body: chunks,
      });
      return;
    }

    const chatMatch = pathname.match(/\/chats\/([^/]+)$/);
    if (chatMatch && method === "GET") {
      const chatId = chatMatch[1];
      const limit = Number(searchParams.get("limit") || "10");
      const offset = Number(searchParams.get("offset") || "0");
      const allMessages = state.messagesByChat[chatId] || [];
      const items = allMessages.slice(offset, offset + limit);

      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: "application/json",
        body: JSON.stringify({
          items,
          total: allMessages.length,
        }),
      });
      return;
    }

    if (chatMatch && method === "DELETE") {
      const chatId = chatMatch[1];
      state.chats = state.chats.filter((chat) => chat.id !== chatId);
      delete state.messagesByChat[chatId];

      await route.fulfill({
        status: 204,
        headers: corsHeaders,
        body: "",
      });
      return;
    }

    await route.fulfill({
      status: 404,
      headers: corsHeaders,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Not found" }),
    });
  });
}

test("redirects unauthenticated users to /auth", async ({ page }) => {
  await installApiRoutes(page);

  await page.goto("/chats");

  await expect(page).toHaveURL(/\/auth$/);
});

test("shows an auth error on failed login", async ({ page }) => {
  await installApiRoutes(page, { loginStatus: 401 });

  await page.goto("/auth");
  await signIn(page, { password: "wrong-password" });

  await expect(page.getByTestId("auth-error-alert")).toBeVisible();
});

test("signs in and loads the chat shell", async ({ page }) => {
  await installApiRoutes(page);

  await page.goto("/auth");
  await signIn(page);

  await expect(page).toHaveURL(/\/chats$/);
  await expect(page.getByTestId("chat-history-list").first()).toBeVisible();
  await expect(page.getByText("jane@example.com")).toBeVisible();
});

test("loads and paginates the chat list", async ({ page }) => {
  await seedSession(page);
  await installApiRoutes(page);

  await page.goto("/chats");
  await expect(page.getByRole("button", { name: /Chat 12/ })).toBeVisible();

  const sidebarScroller = page.getByTestId("chat-history-list").first();
  await sidebarScroller.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });

  await expect(page.getByRole("button", { name: /Chat 02/ })).toBeVisible();
});

test("uses a responsive mobile drawer for chat navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedSession(page);
  await installApiRoutes(page);

  await page.goto("/chats");
  await expect(page.getByTestId("mobile-sidebar-open")).toBeVisible();

  await page.getByTestId("mobile-sidebar-open").click();
  await expect(page.getByTestId("mobile-sidebar-panel")).toBeVisible();
  await page.getByRole("button", { name: /Chat 12/ }).click();

  await expect(page).toHaveURL(/\/chats\/chat-12$/);
  await expect(page.getByTestId("mobile-sidebar-open")).toBeVisible();
  await expect(page.getByText("Answer for Chat 12")).toBeVisible();
});

test("allows adjusting the desktop sidebar width", async ({ page }) => {
  await seedSession(page);
  await installApiRoutes(page);

  await page.goto("/chats");

  const sidebar = page.getByTestId("desktop-sidebar");
  const resizeHandle = page.getByTestId("desktop-sidebar-resize-handle");
  const getSidebarWidth = () =>
    sidebar.evaluate((element) => Math.round(element.getBoundingClientRect().width));
  const getAriaWidth = async () => Number(await resizeHandle.getAttribute("aria-valuenow"));

  await expect(sidebar).toBeVisible();
  const initialWidth = await getSidebarWidth();
  const initialAriaWidth = await getAriaWidth();

  await resizeHandle.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");

  await expect.poll(getSidebarWidth).toBeGreaterThan(initialWidth);
  await expect.poll(getAriaWidth).toBeGreaterThan(initialAriaWidth);
  const resizedWidth = await getAriaWidth();
  await expect.poll(getSidebarWidth).toBe(resizedWidth);

  await page.reload();
  await expect.poll(getAriaWidth).toBe(resizedWidth);
  await expect.poll(getSidebarWidth).toBe(resizedWidth);
});

test("preserves the selected theme across reloads", async ({ page }) => {
  await seedSession(page);
  await installApiRoutes(page);

  await page.goto("/chats");
  await page.getByTestId("settings-button").first().click();
  await page.getByTestId("theme-dark-button").click();

  await expect
    .poll(() =>
      page.evaluate(() => ({
        isDark: document.documentElement.classList.contains("dark"),
        storedTheme: window.localStorage.getItem("theme"),
      }))
    )
    .toEqual({ isDark: true, storedTheme: "dark" });

  await page.reload();

  await expect
    .poll(() =>
      page.evaluate(() => ({
        isDark: document.documentElement.classList.contains("dark"),
        storedTheme: window.localStorage.getItem("theme"),
      }))
      )
      .toEqual({ isDark: true, storedTheme: "dark" });
});

test("supports system theme and uses it as the default", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await seedSession(page);
  await installApiRoutes(page);

  await page.goto("/chats");

  await expect
    .poll(() =>
      page.evaluate(() => ({
        isDark: document.documentElement.classList.contains("dark"),
        storedTheme: window.localStorage.getItem("theme"),
      }))
    )
    .toEqual({ isDark: true, storedTheme: null });

  await page.getByTestId("settings-button").first().click();
  await page.getByTestId("theme-light-button").click();
  await expect
    .poll(() =>
      page.evaluate(() => ({
        isDark: document.documentElement.classList.contains("dark"),
        storedTheme: window.localStorage.getItem("theme"),
      }))
    )
    .toEqual({ isDark: false, storedTheme: "light" });

  await page.getByTestId("settings-button").first().click();
  await page.getByTestId("theme-system-button").click();

  await expect
    .poll(() =>
      page.evaluate(() => ({
        isDark: document.documentElement.classList.contains("dark"),
        storedTheme: window.localStorage.getItem("theme"),
      }))
    )
    .toEqual({ isDark: true, storedTheme: "system" });

  await page.reload();

  await expect
    .poll(() =>
      page.evaluate(() => ({
        isDark: document.documentElement.classList.contains("dark"),
        storedTheme: window.localStorage.getItem("theme"),
      }))
    )
    .toEqual({ isDark: true, storedTheme: "system" });
});

test("opens an existing chat and loads its messages", async ({ page }) => {
  await seedSession(page);
  await installApiRoutes(page);

  await page.goto("/chats/chat-5");

  await expect(page.getByText("Answer for Chat 05")).toBeVisible();
  await expect(page.getByText("Question for Chat 05")).toBeVisible();
});

test("sends a new chat message and streams the response", async ({ page }) => {
  await seedSession(page);
  await installApiRoutes(page, { streamDelayMs: 250 });

  await page.goto("/chats");
  await page.getByTestId("chat-textarea").fill("Need help with onboarding");
  await page.getByTestId("chat-textarea").press("Enter");

  await expect(renderedMessage(page, "Need help with onboarding")).toBeVisible();
  await expect(page).toHaveURL(/\/chats\/chat-new$/);
  await expect(
    page.locator(".prose").getByText("Mock reply to: Need help with onboarding")
  ).toBeVisible();
});

test("keeps one assistant row and a single route replace when the stream id arrives late", async ({ page }) => {
  await seedSession(page);
  await installApiRoutes(page, {
    streamDelayMs: 250,
    delayStreamMessageIdUntilDone: true,
  });

  await page.goto("/chats");
  await page.evaluate(() => {
    let replaceCount = 0;
    const originalReplaceState = window.history.replaceState.bind(window.history);

    window.history.replaceState = (...args) => {
      const [, , nextUrl] = args;
      if (typeof nextUrl === "string" && nextUrl.endsWith("/chats/chat-new")) {
        replaceCount += 1;
      }

      return originalReplaceState(...args);
    };

    window.__getChatReplaceCount = () => replaceCount;
  });

  await page.getByTestId("chat-textarea").fill("Late id prompt");
  await page.getByTestId("chat-textarea").press("Enter");

  await expect(page).toHaveURL(/\/chats\/chat-new$/);
  await expect(page.locator(".prose").getByText("Mock reply to: Late id prompt")).toBeVisible();

  const renderedMessages = page.locator(".prose");
  await expect(renderedMessages).toHaveCount(2);
  await expect(renderedMessages.nth(0)).toContainText("Late id prompt");
  await expect(renderedMessages.nth(1)).toContainText("Mock reply to: Late id prompt");
  await expect.poll(() => page.evaluate(() => window.__getChatReplaceCount())).toBe(1);
});

test("sends a message in an existing chat and streams the response", async ({ page }) => {
  await seedSession(page);
  await installApiRoutes(page, { streamDelayMs: 250 });

  await page.goto("/chats/chat-5");
  await expect(page.getByText("Answer for Chat 05")).toBeVisible();

  await page.getByTestId("chat-textarea").fill("Follow up question");
  await page.getByTestId("chat-textarea").press("Enter");

  await expect(renderedMessage(page, "Follow up question")).toBeVisible();
  await expect(page.locator(".prose").getByText("Mock reply to: Follow up question")).toBeVisible();
});

test("keeps showing optimistic user turns across multiple messages in the same new chat", async ({ page }) => {
  await seedSession(page);
  await installApiRoutes(page, { streamDelayMs: 250, omitStreamMessageIds: true });

  await page.goto("/chats");

  for (const prompt of ["First turn", "Second turn", "Third turn"]) {
    await page.getByTestId("chat-textarea").fill(prompt);
    await page.getByTestId("chat-textarea").press("Enter");

    await expect(renderedMessage(page, prompt)).toBeVisible();
    await expect(page.locator(".prose").getByText(`Mock reply to: ${prompt}`)).toBeVisible();
  }
});

test("ignores enter submits while a response is still streaming", async ({ page }) => {
  await seedSession(page);
  await installApiRoutes(page, { streamDelayMs: 1000 });

  await page.goto("/chats");
  await page.getByTestId("chat-textarea").fill("First only");
  await page.getByTestId("chat-textarea").press("Enter");

  await page.getByTestId("chat-textarea").fill("Should wait");
  await page.getByTestId("chat-textarea").press("Enter");

  await expect(renderedMessage(page, "Should wait")).toHaveCount(0);
  await expect(page.getByTestId("chat-textarea")).toHaveValue("Should wait");
  await expect(page.locator(".prose").getByText("Mock reply to: First only")).toBeVisible();
});

test("stops an in-flight stream without clearing the optimistic user message", async ({ page }) => {
  await seedSession(page);
  await installApiRoutes(page, { streamDelayMs: 1000 });

  await page.goto("/chats");
  await page.getByTestId("chat-textarea").fill("Please stop this response");
  await page.getByTestId("chat-textarea").press("Enter");

  await expect(page.getByTestId("typing-indicator")).toBeVisible();
  await page.getByTestId("chat-stop-button").click({ force: true });

  await expect(page.getByTestId("chat-stop-button")).toHaveCount(0);
  await expect(page.getByTestId("chat-send-button")).toBeVisible();
  await expect(renderedMessage(page, "Please stop this response")).toBeVisible();
  await expect(page.getByTestId("typing-indicator")).toHaveCount(0);

  await page.waitForTimeout(1200);
  await expect(
    page.locator(".prose").getByText("Mock reply to: Please stop this response")
  ).toHaveCount(0);
});

test("deletes a chat and returns to the empty route", async ({ page }) => {
  await seedSession(page);
  await installApiRoutes(page);

  await page.goto("/chats/chat-5");
  const chatRow = page.locator("div.group").filter({
    has: page.getByRole("button", { name: /Chat 05/ }),
  });
  await chatRow.hover();
  await chatRow.getByTestId("delete-chat-button").click();
  await page.getByTestId("confirm-dialog-confirm").click();

  await expect(page).toHaveURL(/\/chats$/);
  await expect(page.getByRole("button", { name: /Chat 05/ })).toHaveCount(0);
});

test("signs out and clears cached auth", async ({ page }) => {
  await seedSession(page);
  await installApiRoutes(page);

  await page.goto("/chats");
  await page.getByTestId("settings-button").first().click();
  await page.getByTestId("logout-button").click();

  await expect(page).toHaveURL(/\/auth$/);
  await expect
    .poll(async () =>
      page.evaluate(() => ({
        token: localStorage.getItem("auth_token"),
        user: localStorage.getItem("auth_user"),
      }))
    )
    .toEqual({ token: null, user: null });
});
