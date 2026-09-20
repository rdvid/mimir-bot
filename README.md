<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/rdvid/mimir-bot">
    <img src="https://raw.githubusercontent.com/rdvid/mimir-api/main/public/uploads/logo.png" alt="Mimir Logo" width="80" height="80">
  </a>

<h3 align="center">Mimir Bot</h3>

  <p align="center">
    Thin Telegram interface over the Mimir personal-finance API — quick expenses, recent activity, and simple summaries.
    <br />
    <a href="http://localhost:5000/api/docs"><strong>API Docs (Swagger) »</strong></a>
    ·
    <a href="https://github.com/rdvid/mimir-api"><strong>mimir-api »</strong></a>
    <br />
    <br />
    <a href="https://github.com/rdvid/mimir-bot">View Repo</a>
    &middot;
    <a href="https://github.com/rdvid/mimir-bot/issues/new?labels=bug">Report Bug</a>
    &middot;
    <a href="https://github.com/rdvid/mimir-bot/issues/new?labels=enhancement">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
        <li><a href="#architecture">Architecture</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#api-mapping">API Mapping</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

**Mimir Bot** is a small personal Telegram bot that sits in front of [mimir-api](https://github.com/rdvid/mimir-api). It is intentionally thin: Telegram is the interface; the Express API owns persistence and business logic.

What you can do:

- Register expenses with a one-line message (`200 groceries`)
- Inspect today's transactions (`/today`)
- See last-7-days spend by day (`/week`)
- View income / expenses / balance for the current month (`/summary`)

Access is restricted to a single Telegram user ID. Secrets and transaction payloads are not logged; user-facing errors stay short.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

* [![Node.js][Node.js]][Node-url]
* [![TypeScript][TypeScript]][TypeScript-url]
* [![grammY][grammY]][grammY-url]
* [![Telegram][Telegram]][Telegram-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Architecture

```text
Telegram handler
    ↓
parser / formatter
    ↓
API client
    ↓
mimir-api (Express)
```

| Layer | Responsibility |
|-------|----------------|
| `src/bot.ts` | Startup, allowed-user middleware, wiring |
| `src/handlers/` | Telegram commands and messages |
| `src/parser/` | Parse `200 groceries` → structured input |
| `src/formatters/` | Brazilian currency / compact replies |
| `src/api/client.ts` | JWT login, HTTP calls, endpoint paths |

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

* Node.js 20+
* A running [mimir-api](https://github.com/rdvid/mimir-api) instance (local docs: [Swagger UI](http://localhost:5000/api/docs/))
* A Telegram bot token from [@BotFather](https://t.me/BotFather)
* Your Telegram user ID (e.g. via [@userinfobot](https://t.me/userinfobot))

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/rdvid/mimir-bot.git
   cd mimir-bot
   ```
2. Install dependencies
   ```sh
   npm install
   ```
3. Copy the env example and fill in values
   ```sh
   cp .env.example .env
   ```
4. Configure environment variables

   | Variable | Description |
   |----------|-------------|
   | `TELEGRAM_BOT_TOKEN` | Bot token from BotFather |
   | `API_URL` | Base URL of mimir-api (e.g. `http://localhost:5000`) |
   | `TELEGRAM_ALLOWED_USER_ID` | Your numeric Telegram user ID — all other users are ignored |
   | `API_EMAIL` | Email for `POST /auth/login` |
   | `API_PASSWORD` | Password for `POST /auth/login` |

   At startup the bot logs in, caches the JWT (re-authenticates on `401`), and resolves the default **"Other"** category for new expenses.
5. Start in watch mode
   ```sh
   npm run dev
   ```

Other scripts:

```sh
npm start          # one-shot
npm run typecheck
npm run build
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

### Commands

| Command | Description |
|---------|-------------|
| `/start` | Help text |
| `/today` | Today's transactions |
| `/week` | Last 7 days (daily expense totals) |
| `/summary` | Income / expenses / balance for the **current calendar month** |

### Transaction syntax

Send a plain message:

```text
200 groceries
45.50 lunch
12 coffee
```

Rules:

- First number = amount (`.` or `,` decimals)
- Rest of the line = description
- MVP treats all plain messages as **expenses**

Malformed input:

```text
I couldn't understand that.

Example:
200 groceries
```

### Example reply after creating an expense

```text
✅ R$ 200,00 — groceries
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- API MAPPING -->
## API Mapping

Example:

```text
200 groceries
```

→

```http
POST /transactions
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "categoryId": "<auto-resolved Other UUID>",
  "type": "expense",
  "amount": 200,
  "date": "YYYY-MM-DD",
  "note": "groceries"
}
```

| Bot action | API |
|------------|-----|
| Startup | `POST /auth/login`, then `GET /categories` |
| Plain expense message | `POST /transactions` |
| `/today` | `GET /transactions?from=<today>&to=<today>` |
| `/week` | `GET /transactions?from=<today-6>&to=<today>&limit=200` |
| `/summary` | `GET /summary?from=<month-start>&to=<today>` |

Date filters use the `America/Sao_Paulo` timezone.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- [x] Thin Telegram bot over mimir-api
- [x] Expense create via plain messages
- [x] `/today`, `/week`, `/summary`
- [ ] Income via message prefix or command
- [ ] Category selection beyond default "Other"
- [ ] Delete / undo last transaction

See the [open issues](https://github.com/rdvid/mimir-bot/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Top contributors:

<a href="https://github.com/rdvid/mimir-bot/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=rdvid/mimir-bot" alt="contrib.rocks image" />
</a>



<!-- LICENSE -->
## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Rafael David — [GitHub @rdvid](https://github.com/rdvid)

Project Link: [https://github.com/rdvid/mimir-bot](https://github.com/rdvid/mimir-bot)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Best-README-Template](https://github.com/othneildrew/Best-README-Template)
* [grammY](https://grammy.dev/)
* [mimir-api](https://github.com/rdvid/mimir-api)
* [Shields.io](https://shields.io/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/rdvid/mimir-bot.svg?style=for-the-badge
[contributors-url]: https://github.com/rdvid/mimir-bot/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/rdvid/mimir-bot.svg?style=for-the-badge
[forks-url]: https://github.com/rdvid/mimir-bot/network/members
[stars-shield]: https://img.shields.io/github/stars/rdvid/mimir-bot.svg?style=for-the-badge
[stars-url]: https://github.com/rdvid/mimir-bot/stargazers
[issues-shield]: https://img.shields.io/github/issues/rdvid/mimir-bot.svg?style=for-the-badge
[issues-url]: https://github.com/rdvid/mimir-bot/issues
[license-shield]: https://img.shields.io/github/license/rdvid/mimir-bot.svg?style=for-the-badge
[license-url]: https://github.com/rdvid/mimir-bot/blob/main/LICENSE

[Node.js]: https://img.shields.io/badge/Node.js_20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white
[Node-url]: https://nodejs.org/
[TypeScript]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[grammY]: https://img.shields.io/badge/grammY-0098EA?style=for-the-badge&logo=telegram&logoColor=white
[grammY-url]: https://grammy.dev/
[Telegram]: https://img.shields.io/badge/Telegram-26A5E4?style=for-the-badge&logo=telegram&logoColor=white
[Telegram-url]: https://core.telegram.org/bots
