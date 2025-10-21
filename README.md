# Nekoma

**Nekoma** is a next-generation, AI-powered agent platform for programmable money on Base. The name "Nekoma" reflects the app's role as a smart, delegated agent—securely managing user funds, permissions, and on-chain actions with precision and transparency.

Nekoma is designed for developers and advanced users who want:

- Fine-grained, on-chain spend delegation and automation
- Secure, gasless smart contract wallet management
- AI-driven workflows that bridge on-chain and off-chain actions
  
[Link to live demo]([https://openai.com](https://drive.google.com/file/d/1iki1-ty_tgFcdFdFqcIKJEhyWW5BfJ3g/view?usp=sharing))

---

## Architecture Overview

- **Frontend**: Next.js 15, React 19, Tailwind CSS UI, custom hooks for chat and transfer logic.
- **Backend/API**: Next.js API routes for authentication, wallet management, transfer, swap, and chat.
- **Smart Wallets**: Server-side creation and management of smart contract wallets using Coinbase CDP SDK.
- **Permissions**: Fine-grained spend permissions via @base-org/account SDK, supporting daily limits and delegation.
- **AI Integration**: Gemini API (Google GenAI) for natural language chat and tool invocation.

## Authentication: Login with Base

- Users authenticate via the **Sign In With Base** button, which uses the Base Account SDK to connect to the user's wallet and sign a nonce for secure login.
- The backend verifies the signature and issues a JWT session cookie, which is used for all subsequent authenticated API calls.
- Session management is handled securely with HTTP-only cookies.

## Permission Setting & Delegation

- **Spend Permissions**: Users can allocate daily spend limits (e.g., USDC) to a delegated smart account (server wallet) on the Base network.
- **Delegation**: The server creates a smart contract wallet for each user, which can act on their behalf within the limits set by spend permissions.
- **Permission Management**: Users can view, allocate, and manage permissions via the UI. All permission logic is handled using the @base-org/account SDK and is enforced on-chain.
- **Transfer & Swap**: All transfers and swaps are executed by the server wallet, but only within the user's granted permissions.

## Tool System

Nekoma features a modular, extensible tool system that enables the AI agent to perform both on-chain and off-chain actions via natural language. Tools are defined in `src/utils/tools.ts` and include:

- **sendUSDCTransaction**: Prepares and executes USDC transfers on Base, integrating with the user's spend permissions and server wallet.
- **convertUSDToUSDC**: Converts USD values to USDC token units (6 decimals) for precise transaction amounts.
- **getUserSpendPermissionsWithSignatures**: Fetches full spend permission objects (with signatures) for a user and their delegated smart account.
- **getWeatherDetails**: Fetches real-time weather data for a given location (off-chain utility).
- **getCurrentTime**: Returns the current time and date (off-chain utility).
- **calculateMath**: Evaluates mathematical expressions (off-chain utility).

Each tool is described with a JSON schema for parameters and is invoked by the AI via structured toolcall JSONs. The backend parses and executes these toolcalls, returning results to the chat interface.

### Example Tool Invocation (AI to Backend)

When a user says "Send $1 to 0xabc...", the AI generates:

```
{
	"type": "toolcall",
	"toolname": "sendUSDCTransaction",
	"parameters": {
		"recipient": "0xabc...",
		"amount": "1000000",
		"amountUSD": 1.0
	}
}
```

The backend parses this, checks permissions, and executes the transfer via the server wallet.

## AI & Gemini API Integration

- Nekoma features an AI chat assistant powered by the Gemini API (Google GenAI).
- The chat system can:
  - Answer user questions conversationally.
  - Dynamically invoke tools (e.g., send USDC, check permissions, convert USD to USDC, get weather, do math) by generating toolcall JSONs, which are parsed and executed by the backend.
  - Use conversation history for context-aware responses.
- Tool invocation is strictly controlled and mapped to backend logic, ensuring security and transparency.

## Coinbase SDK Usage

Nekoma leverages multiple Coinbase and Base SDKs for secure, programmable wallet management:

- **@base-org/account**: Used for Base Account SDK integration, including wallet connection, spend permission management, and signature verification. Handles all user authentication and permission logic.
- **@coinbase/cdp-sdk**: Used for server-side creation and management of smart contract wallets (CDP Smart Accounts) for each user. These wallets are capable of gas-sponsored transactions via CDP paymaster integration.
- **Spend Permission System**: Users grant limited, daily spend permissions (e.g., $1-$2 USDC) to their delegated smart account. All on-chain actions (transfers, swaps) are executed by the server wallet, but strictly within the user's granted limits.
- **Gas Sponsorship**: All transactions are gasless for the user, sponsored by the CDP paymaster. No ETH is required in the user's wallet.

## Supported Features

- **Sign In With Base**: Secure, nonce-based wallet authentication.
- **Smart Wallet Creation**: Automatic server wallet creation and management per user.
- **Spend Permission Management**: Allocate, view, and revoke granular spend permissions for delegated wallets.
- **USDC Transfers**: Send USDC to any address on Base, with permission checks and client/server-side execution.
- **Token Swaps**: Swap tokens using server wallet, respecting user permissions.
- **AI Chat Assistant**: Natural language chat with Gemini, including tool invocation for on-chain and off-chain actions.
- **Weather, Math, and Utility Tools**: Extendable tool system for various user queries.
- **Secure Session Management**: JWT-based, HTTP-only cookies for all sensitive operations.

## Functionalities and Flow

1. **Sign In With Base**: User authenticates by signing a nonce with their wallet. The backend verifies the signature and issues a session cookie.
2. **Server Wallet Creation**: On first login, a CDP Smart Account is created for the user and mapped to their address.
3. **Spend Permission Allocation**: User sets daily USDC spend limits for their server wallet. Permissions are enforced both on-chain and in backend logic.
4. **AI Chat & Tool Invocation**: User interacts with the AI assistant (Gemini API). The AI can:
   - Answer questions directly
   - Generate toolcall JSONs to invoke tools (e.g., send USDC, check permissions)
   - Chain toolcalls for complex workflows
5. **Transaction Execution**: When a toolcall requires an on-chain action, the backend prepares the transaction using the server wallet and executes it, ensuring all permission checks are enforced.
6. **Retry Logic**: For critical operations (e.g., transfers), the backend implements retry logic to handle transient failures and ensure reliability.
7. **Security**: All sensitive actions require authentication. Server wallets never act outside the user's granted permissions. JWT session cookies are used for all API calls.

## Key API Endpoints

- `/api/auth/status` — Check authentication status.
- `/api/auth/verify` — Nonce generation and signature verification for login.
- `/api/auth/signout` — Logout and session cleanup.
- `/api/serverwallet` — Get or create the user's delegated smart wallet.
- `/api/transfer` — Execute USDC transfers via server wallet, with permission checks.
- `/api/swap` — Execute token swaps via server wallet, with permission checks.
- `/api/chat` — AI chat endpoint, routes toolcalls to backend logic and Gemini API.

## Security Considerations

- All sensitive actions require authentication and are protected by session cookies.
- Spend permissions are enforced both on-chain and in backend logic.
- Server wallets are mapped 1:1 to user addresses and never act outside granted permissions.
- Tool invocation from AI is sandboxed and only mapped to whitelisted backend logic.

## Additional Technical Details

- **Session Security**: JWT tokens are signed with a strong secret and stored as HTTP-only cookies, preventing XSS and CSRF attacks.
- **Nonce Management**: Nonces for login are generated server-side and validated to prevent replay attacks during wallet authentication.
- **Smart Account Mapping**: Each EOA (Externally Owned Account) is mapped 1:1 to a CDP smart account, ensuring clear separation and traceability of delegated actions.
- **Permission Enforcement**: All spend permissions are double-enforced—checked both on-chain (via Base contracts) and in backend logic before any transaction is submitted.
- **AI Tooling**: The Gemini-powered chat agent can chain multiple toolcalls, enabling complex, multi-step workflows (e.g., check balance, then transfer, then confirm activity).
- **Extensible Tooling**: Developers can add new tools by extending the schema in `src/utils/tools.ts` and implementing the backend logic, making Nekoma adaptable for new protocols or utilities.
- **Error Handling & Observability**: All critical operations (transfers, swaps, permission changes) include robust error handling, logging, and retry logic for reliability in production.
- **Gasless UX**: All user-initiated transactions are gas-sponsored by the CDP paymaster, providing a seamless experience even for users with zero ETH.
- **Modular UI**: The frontend is built with composable React components and hooks, making it easy to extend or integrate into other dApps.

## Key Technical Decisions

- **Gas Sponsorship**: All transactions are sponsored via CDP paymaster for a seamless, gasless user experience.
- **Smart Accounts**: Each user is assigned a server-managed CDP smart account, which acts as their delegated agent on-chain.
- **Spend Permissions**: Permissions are prepared on the frontend and enforced on the backend, ensuring user safety and compliance.
- **Retry Logic**: Up to 5 attempts for critical operations to maximize reliability.
- **Extensible Tools**: The tool system is designed for easy addition of new on-chain or off-chain actions.

## Extensibility

- The tool system is modular; new tools can be added for both on-chain and off-chain actions.
- The AI assistant can be extended to support more complex workflows and integrations.

---

For more details, see the code in `src/app/api/`, `src/utils/`, and `src/components/`.
