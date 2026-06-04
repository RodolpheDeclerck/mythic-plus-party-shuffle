<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Security (passwords)

New accounts store **Argon2id** hashes (memory cost ~19 MiB, time cost 3, parallelism 4). Existing rows that still use the legacy 64-character hex HMAC format are verified on login and **re-hashed to Argon2** automatically. The `salt` column is left empty for Argon2 rows (the encoded hash embeds its own salt).

## Security (rate limiting)

`POST /auth/login` and `POST /auth/register` are limited **per client IP** using Redis fixed windows (`INCR` + `EXPIRE`). Over the limit returns **429** with a **`Retry-After`** header (seconds).

| Variable | Default | Meaning |
|----------|---------|---------|
| `AUTH_LOGIN_RL_LIMIT` | `10` | Max login attempts per window |
| `AUTH_LOGIN_RL_WINDOW_SEC` | `900` | Login window (15 minutes) |
| `AUTH_REGISTER_RL_LIMIT` | `5` | Max registrations per window |
| `AUTH_REGISTER_RL_WINDOW_SEC` | `3600` | Register window (1 hour) |

In **production**, the app sets Express **`trust proxy`** to `1` so `X-Forwarded-For` is honored behind Render (or similar). Local dev without a reverse proxy does not enable it.

## Security (logging)

JWT authentication paths do **not** log cookies, `Authorization` headers, or full JWT payloads. `JwtAuthGuard` logs a single **`warn`** on failure (reason + HTTP method + path only). `JwtStrategy` logs **`warn`** on invalid payload or missing user (numeric user id only when relevant); optional **`debug`** on successful validation exists only when `NODE_ENV=development`.

Elsewhere, **`console.*` is avoided** in `src/`: bootstrap, party/character/event controllers and services, and WebSocket code use Nest **`Logger`**. Verbose payloads (request bodies, full event JSON) are logged at **`debug`** so they stay off default production log levels.

## Blizzard integration (Auth0 Token Vault)

Logged-in users can fetch their World of Warcraft roster (Retail, US region) to register a character without retyping it. The backend exchanges the user's Auth0 token for a federated Battle.net access token via **Auth0 Token Vault**, then calls the Blizzard Profile API. No Blizzard token is stored in our database — Auth0 stores and refreshes it.

| Variable | Default | Meaning |
|----------|---------|---------|
| `TOKEN_VAULT_CLIENT_ID` | — | Custom API Client id authorized for the federated token-exchange grant |
| `TOKEN_VAULT_CLIENT_SECRET` | — | Custom API Client secret (never commit) |
| `TOKEN_VAULT_CONNECTION` | `battlenet` | Auth0 connection name for Battle.net |
| `BLIZZARD_REGION` | `us` | Blizzard region |
| `BLIZZARD_API_HOST` | `https://us.api.blizzard.com` | Blizzard Profile API host |
| `BLIZZARD_NAMESPACE` | `profile-us` | Profile API namespace (Retail US) |
| `BLIZZARD_LOCALE` | `en_US` | Locale for display names (mapping uses IDs, not names) |

Auth0 setup (dashboard, out of code): set the Battle.net connection to **Connected Accounts for Token Vault** with scope `wow.profile`, and create a **Custom API Client** allowed to call the federated-connection token-exchange grant.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

On Render, the service uses `npm run render-start`, which runs `prisma migrate deploy` before starting the app so pending migrations are always applied on each deploy.

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
